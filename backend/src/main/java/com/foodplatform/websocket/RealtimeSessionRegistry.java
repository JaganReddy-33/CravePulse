package com.foodplatform.websocket;

import com.foodplatform.util.JsonUtil;
import jakarta.websocket.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

public final class RealtimeSessionRegistry {

    private static final Logger logger = LoggerFactory.getLogger(RealtimeSessionRegistry.class);
    private static final RealtimeSessionRegistry INSTANCE = new RealtimeSessionRegistry();

    // Map channelName -> Set of Session
    private final Map<String, Set<Session>> channelSubscriptions = new ConcurrentHashMap<>();
    // Map sessionId -> Set of subscribed channels
    private final Map<String, Set<String>> sessionChannels = new ConcurrentHashMap<>();
    // Map sessionId -> userId
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();

    private RealtimeSessionRegistry() {
    }

    public static RealtimeSessionRegistry getInstance() {
        return INSTANCE;
    }

    public void registerSession(Session session, Long userId) {
        if (userId != null) {
            sessionUserMap.put(session.getId(), userId);
            subscribe(session, "user:" + userId);
        }
    }

    public void subscribe(Session session, String channel) {
        channelSubscriptions.computeIfAbsent(channel, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionChannels.computeIfAbsent(session.getId(), k -> new CopyOnWriteArraySet<>()).add(channel);
        logger.debug("Session {} subscribed to channel {}", session.getId(), channel);
    }

    public void unsubscribe(Session session, String channel) {
        Set<Session> sessions = channelSubscriptions.get(channel);
        if (sessions != null) {
            sessions.remove(session);
        }
        Set<String> channels = sessionChannels.get(session.getId());
        if (channels != null) {
            channels.remove(channel);
        }
    }

    public void removeSession(Session session) {
        String sessionId = session.getId();
        Set<String> channels = sessionChannels.remove(sessionId);
        if (channels != null) {
            for (String ch : channels) {
                Set<Session> sessions = channelSubscriptions.get(ch);
                if (sessions != null) {
                    sessions.remove(session);
                    if (sessions.isEmpty()) {
                        channelSubscriptions.remove(ch);
                    }
                }
            }
        }
        sessionUserMap.remove(sessionId);
        logger.debug("Removed session {} from registry", sessionId);
    }

    public void broadcastToChannel(String channel, String eventType, Object payload) {
        Set<Session> sessions = channelSubscriptions.get(channel);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        Map<String, Object> msg = new HashMap<>();
        msg.put("channel", channel);
        msg.put("event", eventType);
        msg.put("data", payload);
        msg.put("timestamp", System.currentTimeMillis());
        String json = JsonUtil.toJson(msg);

        for (Session s : sessions) {
            if (s.isOpen()) {
                try {
                    s.getBasicRemote().sendText(json);
                } catch (IOException e) {
                    logger.warn("Error sending message to session {}: {}", s.getId(), e.getMessage());
                }
            }
        }
    }

    public void broadcastToUser(long userId, String eventType, Object payload) {
        broadcastToChannel("user:" + userId, eventType, payload);
    }

    public void broadcastToRestaurant(long restaurantId, String eventType, Object payload) {
        broadcastToChannel("restaurant:" + restaurantId, eventType, payload);
    }

    public void broadcastToRider(long riderId, String eventType, Object payload) {
        broadcastToChannel("rider:" + riderId, eventType, payload);
    }

    public void broadcastToOrder(long orderId, String eventType, Object payload) {
        broadcastToChannel("order:" + orderId, eventType, payload);
    }

    public void broadcastToAdmin(String eventType, Object payload) {
        broadcastToChannel("admin:feed", eventType, payload);
    }
}
