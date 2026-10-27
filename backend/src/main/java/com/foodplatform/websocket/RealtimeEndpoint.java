package com.foodplatform.websocket;

import com.foodplatform.dao.RiderDao;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.util.JsonUtil;
import com.foodplatform.util.JwtUtil;
import com.google.gson.JsonObject;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;

@ServerEndpoint(value = "/ws/realtime")
public class RealtimeEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(RealtimeEndpoint.class);
    private final RealtimeSessionRegistry registry = RealtimeSessionRegistry.getInstance();
    private final RiderDao riderDao = new RiderDaoImpl();

    @OnOpen
    public void onOpen(Session session, EndpointConfig config) {
        logger.info("WebSocket connected: sessionId={}", session.getId());
        // Check query string for token: /ws/realtime?token=xyz
        Map<String, java.util.List<String>> params = session.getRequestParameterMap();
        if (params.containsKey("token") && !params.get("token").isEmpty()) {
            String token = params.get("token").get(0);
            Long userId = JwtUtil.extractUserId(token);
            String role = JwtUtil.extractRole(token);
            if (userId != null) {
                registry.registerSession(session, userId);
                if ("ADMIN".equals(role)) {
                    registry.subscribe(session, "admin:feed");
                }
                logger.info("Session {} authenticated onOpen as userId={} role={}", session.getId(), userId, role);
            }
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        try {
            JsonObject json = JsonUtil.fromJson(message, JsonObject.class);
            if (json == null || !json.has("action")) {
                return;
            }

            String action = json.get("action").getAsString();
            switch (action) {
                case "auth" -> {
                    String token = json.get("token").getAsString();
                    Long userId = JwtUtil.extractUserId(token);
                    String role = JwtUtil.extractRole(token);
                    if (userId != null) {
                        registry.registerSession(session, userId);
                        if ("ADMIN".equals(role)) {
                            registry.subscribe(session, "admin:feed");
                        }
                        session.getBasicRemote().sendText(JsonUtil.toJson(Map.of(
                                "event", "auth_success",
                                "userId", userId,
                                "role", role
                        )));
                    } else {
                        session.getBasicRemote().sendText(JsonUtil.toJson(Map.of("event", "auth_error", "message", "Invalid token")));
                    }
                }
                case "subscribe" -> {
                    String channel = json.get("channel").getAsString();
                    registry.subscribe(session, channel);
                    session.getBasicRemote().sendText(JsonUtil.toJson(Map.of("event", "subscribed", "channel", channel)));
                }
                case "unsubscribe" -> {
                    String channel = json.get("channel").getAsString();
                    registry.unsubscribe(session, channel);
                    session.getBasicRemote().sendText(JsonUtil.toJson(Map.of("event", "unsubscribed", "channel", channel)));
                }
                case "rider_telemetry" -> {
                    long riderId = json.get("riderId").getAsLong();
                    double lat = json.get("latitude").getAsDouble();
                    double lng = json.get("longitude").getAsDouble();
                    double speed = json.has("speed") ? json.get("speed").getAsDouble() : 25.0;
                    double heading = json.has("heading") ? json.get("heading").getAsDouble() : 0.0;
                    Long orderId = json.has("orderId") && !json.get("orderId").isJsonNull() ? json.get("orderId").getAsLong() : null;

                    // Update DB telemetry
                    riderDao.updateRiderLocation(riderId, lat, lng, speed, heading, orderId);

                    // Broadcast live location to order channel and admin feed
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
                case "ping" -> {
                    session.getBasicRemote().sendText(JsonUtil.toJson(Map.of("event", "pong", "timestamp", System.currentTimeMillis())));
                }
                default -> logger.warn("Unknown websocket action: {}", action);
            }
        } catch (Exception e) {
            logger.error("Error processing websocket message: {}", message, e);
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) {
        registry.removeSession(session);
        logger.info("WebSocket disconnected: sessionId={}, code={}", session.getId(), reason.getCloseCode());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        logger.error("WebSocket error for sessionId={}: {}", session != null ? session.getId() : "null", throwable.getMessage());
    }
}
