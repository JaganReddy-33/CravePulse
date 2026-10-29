package com.foodplatform.dao;

import com.foodplatform.model.Coupon;
import com.foodplatform.model.Notification;
import com.foodplatform.model.WalletTransaction;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

public interface WalletDao {

    void recordTransaction(Connection conn, WalletTransaction tx) throws SQLException;

    List<WalletTransaction> getUserTransactions(long userId);

    void createNotification(Notification notif);

    List<Notification> getUserNotifications(long userId, boolean unreadOnly);

    void markNotificationRead(long notificationId, long userId);

    void markAllNotificationsRead(long userId);

    void clearAllNotifications(long userId);

    Coupon getCouponByCode(String code);

    int getCouponUsageCountByUser(long userId, long couponId);

    void recordCouponUsage(Connection conn, long userId, long couponId, long orderId) throws SQLException;

    void incrementCouponUsage(Connection conn, long couponId) throws SQLException;

    String getPlatformSetting(String key, String defaultValue);
}
