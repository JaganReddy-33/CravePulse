package com.foodplatform.websocket;

import com.foodplatform.dao.OrderMessageDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.daoImpl.OrderMessageDaoImpl;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.model.OrderMessage;
import com.foodplatform.model.Restaurant;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.model.User;
import com.foodplatform.util.JsonUtil;
import com.foodplatform.util.JwtUtil;
import com.google.gson.JsonObject;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@ServerEndpoint(value = "/ws/realtime")
public class RealtimeEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(RealtimeEndpoint.class);
    private static final int MAX_MESSAGE_SIZE = 65536; // 64 KB

    private final RealtimeSessionRegistry registry;
    private final RiderDao riderDao;
    private final RestaurantDao restaurantDao;
    private final OrderMessageDao orderMessageDao;
    private final UserDao userDao;

    public RealtimeEndpoint() {
        this(RealtimeSessionRegistry.getInstance(), new RiderDaoImpl(), new RestaurantDaoImpl(), new OrderMessageDaoImpl(), new UserDaoImpl());
    }

    public RealtimeEndpoint(RealtimeSessionRegistry registry, RiderDao riderDao, RestaurantDao restaurantDao, OrderMessageDao orderMessageDao, UserDao userDao) {
        this.registry = registry;
        this.riderDao = riderDao;
        this.restaurantDao = restaurantDao;
        this.orderMessageDao = orderMessageDao;
        this.userDao = userDao;
    }

    @OnOpen
    public void onOpen(Session session, EndpointConfig config) {
        logger.info("WebSocket connected: sessionId={}", session.getId());
        Map<String, java.util.List<String>> params = session.getRequestParameterMap();
        if (params.containsKey("token") && !params.get("token").isEmpty()) {
            String token = params.get("token").get(0);
            try {
                Long userId = JwtUtil.extractUserId(token);
                String role = JwtUtil.extractRole(token);
                if (userId != null && role != null) {
                    session.getUserProperties().put("userId", userId);
                    session.getUserProperties().put("role", role);
                    registry.registerSession(session, userId);
                    if ("ADMIN".equalsIgnoreCase(role)) {
                        registry.subscribe(session, "admin:feed");
                    }
                    logger.info("Session {} authenticated onOpen: userId={}, role={}", session.getId(), userId, role);
                } else {
                    rejectConnection(session, "Invalid authentication token");
                }
            } catch (Exception e) {
                rejectConnection(session, "Malformed token");
            }
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        try {
            // 1. Message size validation
            if (message == null || message.length() > MAX_MESSAGE_SIZE) {
                session.close(new CloseReason(CloseReason.CloseCodes.TOO_BIG, "Message exceeds 64KB limit"));
                return;
            }

            // 2. Message rate limiting (Max 40 msgs / 10s per session)
            if (!checkRateLimit(session)) {
                return;
            }

            JsonObject json = JsonUtil.fromJson(message, JsonObject.class);
            if (json == null || !json.has("action")) {
                return;
            }

            String action = json.get("action").getAsString();
            switch (action) {
                case "auth" -> handleAuth(session, json);
                case "subscribe" -> handleSubscribe(session, json);
                case "unsubscribe" -> handleUnsubscribe(session, json);
                case "rider_telemetry" -> handleTelemetry(session, json);
                case "chat_message" -> handleChatMessage(session, json);
                case "ping" -> sendJson(session, Map.of("event", "pong", "timestamp", System.currentTimeMillis()));
                default -> logger.warn("Unknown websocket action: {}", action);
            }
        } catch (Exception e) {
            logger.error("Error processing websocket message: {}", message, e);
        }
    }

    private void handleAuth(Session session, JsonObject json) throws IOException {
        if (!json.has("token")) {
            sendJson(session, Map.of("event", "auth_error", "message", "Token required"));
            return;
        }
        String token = json.get("token").getAsString();
        Long userId = JwtUtil.extractUserId(token);
        String role = JwtUtil.extractRole(token);
        if (userId != null && role != null) {
            session.getUserProperties().put("userId", userId);
            session.getUserProperties().put("role", role);
            registry.registerSession(session, userId);
            if ("ADMIN".equalsIgnoreCase(role)) {
                registry.subscribe(session, "admin:feed");
            }
            sendJson(session, Map.of(
                    "event", "auth_success",
                    "userId", userId,
                    "role", role
            ));
        } else {
            sendJson(session, Map.of("event", "auth_error", "message", "Invalid or expired token"));
        }
    }

    private void handleSubscribe(Session session, JsonObject json) throws IOException {
        Long userId = (Long) session.getUserProperties().get("userId");
        String role = (String) session.getUserProperties().get("role");
        if (userId == null) {
            sendJson(session, Map.of("event", "auth_error", "message", "Authentication required before subscribing"));
            return;
        }

        String channel = json.has("channel") ? json.get("channel").getAsString().trim() : "";
        if (channel.isEmpty()) {
            sendJson(session, Map.of("event", "subscribe_error", "message", "Channel name required"));
            return;
        }

        // Authorize subscriptions by role and ownership
        if (!isAuthorizedForChannel(userId, role, channel)) {
            logger.warn("Unauthorized subscription attempt: userId={}, role={}, channel={}", userId, role, channel);
            sendJson(session, Map.of(
                    "event", "subscribe_error",
                    "channel", channel,
                    "message", "Forbidden: Not authorized to subscribe to " + channel
            ));
            return;
        }

        registry.subscribe(session, channel);
        sendJson(session, Map.of("event", "subscribed", "channel", channel));
    }

    private void handleUnsubscribe(Session session, JsonObject json) throws IOException {
        if (json.has("channel")) {
            String channel = json.get("channel").getAsString().trim();
            registry.unsubscribe(session, channel);
            sendJson(session, Map.of("event", "unsubscribed", "channel", channel));
        }
    }

    private void handleTelemetry(Session session, JsonObject json) {
        Long userId = (Long) session.getUserProperties().get("userId");
        String role = (String) session.getUserProperties().get("role");
        if (userId == null || (!"RIDER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role))) {
            return;
        }

        long riderId = json.has("riderId") ? json.get("riderId").getAsLong() : 0L;
        double lat = json.has("latitude") ? json.get("latitude").getAsDouble() : 0.0;
        double lng = json.has("longitude") ? json.get("longitude").getAsDouble() : 0.0;
        double speed = json.has("speed") ? json.get("speed").getAsDouble() : 0.0;
        double heading = json.has("heading") ? json.get("heading").getAsDouble() : 0.0;
        Long orderId = json.has("orderId") && !json.get("orderId").isJsonNull() ? json.get("orderId").getAsLong() : null;

        riderDao.updateRiderLocation(riderId, lat, lng, speed, heading, orderId);

        Map<String, Object> telemetryData = Map.of(
                "riderId", riderId,
                "orderId", orderId != null ? orderId : 0,
                "latitude", lat,
                "longitude", lng,
                "speed", speed,
                "heading", heading,
                "timestamp", System.currentTimeMillis()
        );

        if (orderId != null) {
            registry.broadcastToOrder(orderId, "rider_location_updated", telemetryData);
        }
        registry.broadcastToAdmin("rider_location_updated", telemetryData);
    }

    private void handleChatMessage(Session session, JsonObject json) throws IOException {
        Long userId = (Long) session.getUserProperties().get("userId");
        String role = (String) session.getUserProperties().get("role");
        if (userId == null) {
            sendJson(session, Map.of("event", "auth_error", "message", "Authentication required to chat"));
            return;
        }

        long orderId = json.has("orderId") ? json.get("orderId").getAsLong() : 0L;
        String text = json.has("messageText") ? json.get("messageText").getAsString().trim() : "";
        String recipientRole = json.has("recipientRole") ? json.get("recipientRole").getAsString().trim().toUpperCase() : "ALL";

        if (orderId <= 0 || text.isEmpty()) {
            sendJson(session, Map.of("event", "chat_error", "message", "orderId and messageText are required"));
            return;
        }

        if (!orderMessageDao.isUserAllowedInOrderChat(orderId, userId, role)) {
            sendJson(session, Map.of("event", "chat_error", "message", "Access denied to order chat"));
            return;
        }

        User sender = userDao.findById(userId);
        OrderMessage msg = new OrderMessage();
        msg.setOrderId(orderId);
        msg.setSenderUserId(userId);
        msg.setSenderRole(role);
        msg.setRecipientRole(recipientRole);
        msg.setMessageText(text);
        msg.setSenderName(sender != null ? sender.getFullName() : role);
        msg.setCreatedAt(Timestamp.from(Instant.now()));

        Long msgId = orderMessageDao.saveMessage(msg);
        msg.setId(msgId);

        registry.broadcastToOrder(orderId, "new_chat_message", msg);
    }

    public boolean checkRateLimit(Session session) throws IOException {
        AtomicInteger counter = (AtomicInteger) session.getUserProperties().computeIfAbsent("msgCount", k -> new AtomicInteger(0));
        Long windowStart = (Long) session.getUserProperties().computeIfAbsent("msgWindowStart", k -> System.currentTimeMillis());
        if (System.currentTimeMillis() - windowStart > 10000) {
            session.getUserProperties().put("msgWindowStart", System.currentTimeMillis());
            counter.set(0);
        }
        if (counter.incrementAndGet() > 40) {
            sendJson(session, Map.of("event", "rate_limited", "message", "Rate limit exceeded. Please throttle messaging."));
            return false;
        }
        return true;
    }

    public boolean isAuthorizedForChannel(long userId, String role, String channel) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return true;
        }

        if (channel.startsWith("admin:")) {
            return false; // Non-admin cannot subscribe to admin channels
        }

        if (channel.startsWith("user:")) {
            try {
                long targetUserId = Long.parseLong(channel.substring(5));
                return targetUserId == userId;
            } catch (NumberFormatException e) {
                return false;
            }
        }

        if (channel.startsWith("rider:")) {
            try {
                long riderId = Long.parseLong(channel.substring(6));
                RiderProfile rider = riderDao.findById(riderId);
                return rider != null && rider.getUserId() == userId;
            } catch (NumberFormatException e) {
                return false;
            }
        }

        if (channel.startsWith("restaurant:")) {
            try {
                long restaurantId = Long.parseLong(channel.substring(11));
                Restaurant rest = restaurantDao.findById(restaurantId);
                return rest != null && rest.getUserId() == userId;
            } catch (NumberFormatException e) {
                return false;
            }
        }

        if (channel.startsWith("order:")) {
            try {
                long orderId = Long.parseLong(channel.substring(6));
                return orderMessageDao.isUserAllowedInOrderChat(orderId, userId, role);
            } catch (NumberFormatException e) {
                return false;
            }
        }

        return false;
    }

    private void rejectConnection(Session session, String reason) {
        try {
            session.close(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, reason));
        } catch (IOException ignored) {}
    }

    private void sendJson(Session session, Object payload) throws IOException {
        if (session.isOpen()) {
            session.getBasicRemote().sendText(JsonUtil.toJson(payload));
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) {
        registry.removeSession(session);
        logger.info("WebSocket disconnected: sessionId={}, code={}, reason={}", session.getId(), reason.getCloseCode(), reason.getReasonPhrase());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        logger.error("WebSocket error for sessionId={}: {}", session != null ? session.getId() : "null", throwable != null ? throwable.getMessage() : "unknown");
    }
}
