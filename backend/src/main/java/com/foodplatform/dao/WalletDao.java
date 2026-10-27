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

    void markNotificationRead(long notificationId);

    Coupon getCouponByCode(String code);

    String getPlatformSetting(String key, String defaultValue);
}
