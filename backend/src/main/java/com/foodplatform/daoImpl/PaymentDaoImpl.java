package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.PaymentDao;
import com.foodplatform.model.Payment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;

public class PaymentDaoImpl implements PaymentDao {

    private static final Logger logger = LoggerFactory.getLogger(PaymentDaoImpl.class);

    @Override
    public Long createPayment(Connection conn, Payment payment) throws SQLException {
        String sql = "INSERT INTO payments (order_id, payment_gateway, transaction_reference, idempotency_key, payment_status, amount, raw_gateway_response) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, payment.getOrderId());
            ps.setString(2, payment.getPaymentGateway());
            ps.setString(3, payment.getTransactionReference());
            ps.setString(4, payment.getIdempotencyKey());
            ps.setString(5, payment.getPaymentStatus());
            ps.setBigDecimal(6, payment.getAmount());
            ps.setString(7, payment.getRawGatewayResponse());
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
    public void updatePaymentStatus(Connection conn, long paymentId, String status) throws SQLException {
        String sql = "UPDATE payments SET payment_status = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setLong(2, paymentId);
            ps.executeUpdate();
        }
    }

    private Payment mapPayment(ResultSet rs) throws SQLException {
        Payment p = new Payment();
        p.setId(rs.getLong("id"));
        p.setOrderId(rs.getLong("order_id"));
        p.setPaymentGateway(rs.getString("payment_gateway"));
        p.setTransactionReference(rs.getString("transaction_reference"));
        p.setIdempotencyKey(rs.getString("idempotency_key"));
        p.setPaymentStatus(rs.getString("payment_status"));
        p.setAmount(rs.getBigDecimal("amount"));
        p.setRawGatewayResponse(rs.getString("raw_gateway_response"));
        p.setCreatedAt(rs.getTimestamp("created_at"));
        return p;
    }
}
