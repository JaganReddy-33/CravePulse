package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.OrderMessageDao;
import com.foodplatform.model.OrderMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class OrderMessageDaoImpl implements OrderMessageDao {

    private static final Logger logger = LoggerFactory.getLogger(OrderMessageDaoImpl.class);

    @Override
    public Long saveMessage(OrderMessage message) {
        String sql = "INSERT INTO order_messages (order_id, sender_user_id, sender_role, recipient_role, message_text) " +
                "VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, message.getOrderId());
            ps.setLong(2, message.getSenderUserId());
            ps.setString(3, message.getSenderRole());
            ps.setString(4, message.getRecipientRole() != null ? message.getRecipientRole() : "ALL");
            ps.setString(5, message.getMessageText());
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    message.setId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            logger.error("Error saving order message for order: {}", message.getOrderId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public List<OrderMessage> getOrderMessages(long orderId) {
        List<OrderMessage> list = new ArrayList<>();
        String sql = "SELECT m.*, u.full_name AS sender_name " +
                "FROM order_messages m " +
                "JOIN users u ON m.sender_user_id = u.id " +
                "WHERE m.order_id = ? " +
                "ORDER BY m.created_at ASC, m.id ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderMessage m = new OrderMessage();
                    m.setId(rs.getLong("id"));
                    m.setOrderId(rs.getLong("order_id"));
                    m.setSenderUserId(rs.getLong("sender_user_id"));
                    m.setSenderRole(rs.getString("sender_role"));
                    m.setRecipientRole(rs.getString("recipient_role"));
                    m.setMessageText(rs.getString("message_text"));
                    m.setCreatedAt(rs.getTimestamp("created_at"));
                    m.setSenderName(rs.getString("sender_name"));
                    list.add(m);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching order messages for order: {}", orderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public boolean isUserAllowedInOrderChat(long orderId, long userId, String role) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return true;
        }

        String sql = "SELECT o.customer_id, r.user_id AS rest_owner_id, rd.user_id AS rider_user_id " +
                "FROM orders o " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "LEFT JOIN rider_profiles rd ON o.rider_id = rd.id " +
                "WHERE o.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    long customerId = rs.getLong("customer_id");
                    long restOwnerId = rs.getLong("rest_owner_id");
                    long riderUserId = rs.getLong("rider_user_id");

                    if ("CUSTOMER".equalsIgnoreCase(role) && customerId == userId) {
                        return true;
                    }
                    if ("RESTAURANT".equalsIgnoreCase(role) && restOwnerId == userId) {
                        return true;
                    }
                    if ("RIDER".equalsIgnoreCase(role) && riderUserId == userId) {
                        return true;
                    }
                }
            }
        } catch (SQLException e) {
            logger.error("Error verifying user participation in order chat: orderId={}, userId={}", orderId, userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return false;
    }
}
