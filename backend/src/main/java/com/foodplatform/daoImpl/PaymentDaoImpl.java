package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.PaymentDao;
import com.foodplatform.model.Payment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.*;

public class PaymentDaoImpl implements PaymentDao {

    private static final Logger logger = LoggerFactory.getLogger(PaymentDaoImpl.class);

    @Override
    public Long createPayment(Connection conn, Payment payment) throws SQLException {
        String sql = "INSERT INTO payments (order_id, payment_mode, razorpay_order_id, razorpay_payment_id, " +
                "razorpay_signature, amount, currency, status, idempotency_key, raw_response) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, payment.getOrderId());
            ps.setString(2, payment.getPaymentMode() != null ? payment.getPaymentMode() : "RAZORPAY");
            ps.setString(3, payment.getRazorpayOrderId());
            ps.setString(4, payment.getRazorpayPaymentId());
            ps.setString(5, payment.getRazorpaySignature());
            ps.setBigDecimal(6, payment.getAmount());
            ps.setString(7, payment.getCurrency() != null ? payment.getCurrency() : "INR");
            ps.setString(8, payment.getStatus() != null ? payment.getStatus() : "PENDING");
            ps.setString(9, payment.getIdempotencyKey());
            ps.setString(10, payment.getRawResponse());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    payment.setId(id);
                    return id;
                }
            }
        }
        return null;
    }

    @Override
    public Payment findById(long id) {
        String sql = "SELECT * FROM payments WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPayment(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding payment by id: {}", id, e);
        }
        return null;
    }

    @Override
    public Payment findByIdempotencyKey(String idempotencyKey) {
        String sql = "SELECT * FROM payments WHERE idempotency_key = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, idempotencyKey);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPayment(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding payment by idempotency key: {}", idempotencyKey, e);
        }
        return null;
    }

    @Override
    public Payment findByOrderId(long orderId) {
        String sql = "SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPayment(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding payment by order id: {}", orderId, e);
        }
        return null;
    }

    @Override
    public Payment findByRazorpayOrderId(String razorpayOrderId) {
        String sql = "SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, razorpayOrderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPayment(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding payment by razorpay_order_id: {}", razorpayOrderId, e);
        }
        return null;
    }

    @Override
    public void updatePaymentStatus(Connection conn, long paymentId, String status) throws SQLException {
        String sql = "UPDATE payments SET status = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setLong(2, paymentId);
            ps.executeUpdate();
        }
    }

    @Override
    public void updateStatusAndDetails(Connection conn, long paymentId, String status, String paymentIdRzp, String signature, String rawResponse) throws SQLException {
        String sql = "UPDATE payments SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?, raw_response = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, paymentIdRzp);
            ps.setString(3, signature);
            ps.setString(4, rawResponse);
            ps.setLong(5, paymentId);
            ps.executeUpdate();
        }
    }

    @Override
    public void recordRefund(Connection conn, long paymentId, String refundId, BigDecimal refundAmount, String refundStatus) throws SQLException {
        String sql = "UPDATE payments SET status = 'REFUNDED', refund_id = ?, refund_amount = ?, refund_status = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, refundId);
            ps.setBigDecimal(2, refundAmount);
            ps.setString(3, refundStatus != null ? refundStatus : "PROCESSED");
            ps.setLong(4, paymentId);
            ps.executeUpdate();
        }
    }

    @Override
    public boolean hasWebhookEventBeenProcessed(String eventId) {
        String sql = "SELECT 1 FROM payment_webhook_events WHERE event_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, eventId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            logger.error("Error checking webhook event idempotency for {}: {}", eventId, e.getMessage());
            return false;
        }
    }

    @Override
    public void recordWebhookEvent(String eventId, String eventType, String payload) {
        String sql = "INSERT INTO payment_webhook_events (event_id, event_type, payload) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, eventId);
            ps.setString(2, eventType);
            ps.setString(3, payload != null ? payload : "{}");
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error saving webhook event {}: {}", eventId, e.getMessage());
        }
    }

    private Payment mapPayment(ResultSet rs) throws SQLException {
        Payment p = new Payment();
        p.setId(rs.getLong("id"));
        p.setOrderId(rs.getLong("order_id"));
        p.setPaymentMode(rs.getString("payment_mode"));
        p.setRazorpayOrderId(rs.getString("razorpay_order_id"));
        p.setRazorpayPaymentId(rs.getString("razorpay_payment_id"));
        p.setRazorpaySignature(rs.getString("razorpay_signature"));
        p.setAmount(rs.getBigDecimal("amount"));
        p.setCurrency(rs.getString("currency"));
        p.setStatus(rs.getString("status"));
        p.setIdempotencyKey(rs.getString("idempotency_key"));
        p.setRawResponse(rs.getString("raw_response"));

        try {
            p.setRefundId(rs.getString("refund_id"));
            p.setRefundStatus(rs.getString("refund_status"));
            p.setRefundAmount(rs.getBigDecimal("refund_amount"));
        } catch (SQLException ignored) {
            // In case columns were queried before migration
        }

        p.setCreatedAt(rs.getTimestamp("created_at"));
        p.setUpdatedAt(rs.getTimestamp("updated_at"));
        return p;
    }
}
