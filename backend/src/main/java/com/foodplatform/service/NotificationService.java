package com.foodplatform.service;

import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.Notification;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final WalletDao walletDao;
    private final RealtimeSessionRegistry registry;

    public NotificationService() {
        this(new WalletDaoImpl(), RealtimeSessionRegistry.getInstance());
    }

    public NotificationService(WalletDao walletDao, RealtimeSessionRegistry registry) {
        this.walletDao = walletDao;
        this.registry = registry;
    }

    public void sendNotification(long userId, String title, String message, String type, String referenceId) {
        try {
            Notification n = new Notification();
            n.setUserId(userId);
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type != null ? type : "SYSTEM");
            n.setReferenceId(referenceId);
            n.setRead(false);
            n.setCreatedAt(Timestamp.from(Instant.now()));

            walletDao.createNotification(n);

            if (registry != null) {
                registry.broadcastToUser(userId, "notification", n);
            }
            logger.debug("Notification sent to user {}: {}", userId, title);
        } catch (Exception e) {
            logger.warn("Failed to deliver notification to user {}: {}", userId, e.getMessage());
        }
    }

    public List<Notification> getUserNotifications(long userId, boolean unreadOnly) {
        return walletDao.getUserNotifications(userId, unreadOnly);
    }

    public void markAsRead(long notificationId) {
        walletDao.markNotificationRead(notificationId);
    }

    public void markAllAsRead(long userId) {
        walletDao.markAllNotificationsRead(userId);
    }

    public void clearAll(long userId) {
        walletDao.clearAllNotifications(userId);
    }
}
