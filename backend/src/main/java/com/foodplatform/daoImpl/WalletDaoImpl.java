package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Coupon;
import com.foodplatform.model.Notification;
import com.foodplatform.model.WalletTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class WalletDaoImpl implements WalletDao {

    private static final Logger logger = LoggerFactory.getLogger(WalletDaoImpl.class);

    @Override
    public void recordTransaction(Connection conn, WalletTransaction tx) throws SQLException {
        String sql = "INSERT INTO wallet_transactions (user_id, amount, transaction_type, reason, reference_order_id, balance_after) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, tx.getUserId());
            ps.setBigDecimal(2, tx.getAmount());
            ps.setString(3, tx.getTransactionType());
            ps.setString(4, tx.getReason());
            if (tx.getReferenceOrderId() != null) ps.setLong(5, tx.getReferenceOrderId());
            else ps.setNull(5, Types.BIGINT);
            ps.setBigDecimal(6, tx.getBalanceAfter());
            ps.executeUpdate();
        }
    }

    @Override
    public List<WalletTransaction> getUserTransactions(long userId) {
        List<WalletTransaction> list = new ArrayList<>();
        String sql = "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    WalletTransaction tx = new WalletTransaction();
                    tx.setId(rs.getLong("id"));
                    tx.setUserId(rs.getLong("user_id"));
                    tx.setAmount(rs.getBigDecimal("amount"));
                    tx.setTransactionType(rs.getString("transaction_type"));
                    tx.setReason(rs.getString("reason"));
                    long ref = rs.getLong("reference_order_id");
                    if (!rs.wasNull()) tx.setReferenceOrderId(ref);
                    tx.setBalanceAfter(rs.getBigDecimal("balance_after"));
                    tx.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(tx);
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting wallet transactions for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public void createNotification(Notification notif) {
        String sql = "INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, notif.getUserId());
            ps.setString(2, notif.getTitle());
            ps.setString(3, notif.getMessage());
            ps.setString(4, notif.getType());
            ps.setString(5, notif.getReferenceId());
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error creating notification for user: {}", notif.getUserId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<Notification> getUserNotifications(long userId, boolean unreadOnly) {
        List<Notification> list = new ArrayList<>();
        String sql = "SELECT * FROM notifications WHERE user_id = ? " +
                (unreadOnly ? "AND is_read = FALSE " : "") +
                "ORDER BY id DESC LIMIT 30";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Notification n = new Notification();
                    n.setId(rs.getLong("id"));
                    n.setUserId(rs.getLong("user_id"));
                    n.setTitle(rs.getString("title"));
                    n.setMessage(rs.getString("message"));
                    n.setType(rs.getString("type"));
                    n.setRead(rs.getBoolean("is_read"));
                    n.setReferenceId(rs.getString("reference_id"));
                    n.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(n);
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting notifications for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public void markNotificationRead(long notificationId, long userId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, notificationId);
            ps.setLong(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error marking notification read: {}", notificationId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void markAllNotificationsRead(long userId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error marking all notifications read for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void clearAllNotifications(long userId) {
        String sql = "DELETE FROM notifications WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error clearing notifications for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public Coupon getCouponByCode(String code) {
        String sql = "SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, code);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Coupon c = new Coupon();
                    c.setId(rs.getLong("id"));
                    c.setCode(rs.getString("code"));
                    c.setDescription(rs.getString("description"));
                    c.setDiscountType(rs.getString("discount_type"));
                    c.setDiscountValue(rs.getBigDecimal("discount_value"));
                    c.setMinOrderAmount(rs.getBigDecimal("min_order_amount"));
                    c.setMaxDiscountAmount(rs.getBigDecimal("max_discount_amount"));
                    c.setValidFrom(rs.getTimestamp("valid_from"));
                    c.setValidUntil(rs.getTimestamp("valid_until"));
                    c.setUsageLimit(rs.getInt("usage_limit"));
                    c.setTimesUsed(rs.getInt("times_used"));
                    c.setActive(rs.getBoolean("is_active"));
                    try {
                        c.setFirstOrderOnly(rs.getBoolean("first_order_only"));
                        long rId = rs.getLong("restaurant_id");
                        if (!rs.wasNull()) c.setRestaurantId(rId);
                        c.setPerUserLimit(rs.getInt("per_user_limit"));
                    } catch (SQLException ignored) {}
                    c.setCreatedAt(rs.getTimestamp("created_at"));
                    return c;
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting coupon: {}", code, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public int getCouponUsageCountByUser(long userId, long couponId) {
        String sql = "SELECT COUNT(*) FROM coupon_usages WHERE user_id = ? AND coupon_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setLong(2, couponId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            logger.error("Error checking coupon usage count: user {} coupon {}", userId, couponId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return 0;
    }

    @Override
    public void recordCouponUsage(Connection conn, long userId, long couponId, long orderId) throws SQLException {
        String sql = "INSERT INTO coupon_usages (user_id, coupon_id, order_id) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setLong(2, couponId);
            ps.setLong(3, orderId);
            ps.executeUpdate();
        }
    }

    @Override
    public void incrementCouponUsage(Connection conn, long couponId) throws SQLException {
        String sql = "UPDATE coupons SET times_used = times_used + 1 WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, couponId);
            ps.executeUpdate();
        }
    }

    @Override
    public String getPlatformSetting(String key, String defaultValue) {
        String sql = "SELECT config_value FROM platform_settings WHERE config_key = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("config_value");
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching platform setting: {}", key, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return defaultValue;
    }
}
