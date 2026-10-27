package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.DisputeDao;
import com.foodplatform.model.Dispute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DisputeDaoImpl implements DisputeDao {

    private static final Logger logger = LoggerFactory.getLogger(DisputeDaoImpl.class);

    @Override
    public Long createDispute(Dispute dispute) {
        String sql = "INSERT INTO disputes (order_id, customer_id, issue_type, description, photo_evidence_url, " +
                "requested_refund_amount, auto_refund_approved, admin_status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, dispute.getOrderId());
            ps.setLong(2, dispute.getCustomerId());
            ps.setString(3, dispute.getIssueType());
            ps.setString(4, dispute.getDescription());
            ps.setString(5, dispute.getPhotoEvidenceUrl());
            ps.setBigDecimal(6, dispute.getRequestedRefundAmount());
            ps.setBoolean(7, dispute.isAutoRefundApproved());
            ps.setString(8, dispute.getAdminStatus());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    dispute.setId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            logger.error("Error creating dispute for order: {}", dispute.getOrderId(), e);
        }
        return null;
    }

    @Override
    public Dispute findById(long disputeId) {
        String sql = "SELECT d.*, u.full_name AS cust_name, o.order_number, r.name AS rest_name " +
                "FROM disputes d " +
                "JOIN users u ON d.customer_id = u.id " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "WHERE d.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, disputeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapDispute(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding dispute by id: {}", disputeId, e);
        }
        return null;
    }

    @Override
    public List<Dispute> listPendingDisputes() {
        List<Dispute> list = new ArrayList<>();
        String sql = "SELECT d.*, u.full_name AS cust_name, o.order_number, r.name AS rest_name " +
                "FROM disputes d " +
                "JOIN users u ON d.customer_id = u.id " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "ORDER BY d.id DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapDispute(rs));
            }
        } catch (SQLException e) {
            logger.error("Error listing disputes", e);
        }
        return list;
    }

    @Override
    public List<Dispute> listCustomerDisputes(long customerId) {
        List<Dispute> list = new ArrayList<>();
        String sql = "SELECT d.*, u.full_name AS cust_name, o.order_number, r.name AS rest_name " +
                "FROM disputes d " +
                "JOIN users u ON d.customer_id = u.id " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "WHERE d.customer_id = ? ORDER BY d.id DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapDispute(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing customer disputes: {}", customerId, e);
        }
        return list;
    }

    @Override
    public void resolveDispute(long disputeId, String adminStatus, String resolutionNotes, Long resolvedByUserId) {
        String sql = "UPDATE disputes SET admin_status = ?, resolution_notes = ?, resolved_by_user_id = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, adminStatus);
            ps.setString(2, resolutionNotes);
            if (resolvedByUserId != null) ps.setLong(3, resolvedByUserId);
            else ps.setNull(3, Types.BIGINT);
            ps.setLong(4, disputeId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error resolving dispute: {}", disputeId, e);
        }
    }

    private Dispute mapDispute(ResultSet rs) throws SQLException {
        Dispute d = new Dispute();
        d.setId(rs.getLong("id"));
        d.setOrderId(rs.getLong("order_id"));
        d.setCustomerId(rs.getLong("customer_id"));
        d.setIssueType(rs.getString("issue_type"));
        d.setDescription(rs.getString("description"));
        d.setPhotoEvidenceUrl(rs.getString("photo_evidence_url"));
        d.setRequestedRefundAmount(rs.getBigDecimal("requested_refund_amount"));
        d.setAutoRefundApproved(rs.getBoolean("auto_refund_approved"));
        d.setAdminStatus(rs.getString("admin_status"));
        d.setResolutionNotes(rs.getString("resolution_notes"));
        long resolvedBy = rs.getLong("resolved_by_user_id");
        if (!rs.wasNull()) d.setResolvedByUserId(resolvedBy);
        d.setCreatedAt(rs.getTimestamp("created_at"));
        d.setResolvedAt(rs.getTimestamp("resolved_at"));

        d.setCustomerName(rs.getString("cust_name"));
        d.setOrderNumber(rs.getString("order_number"));
        d.setRestaurantName(rs.getString("rest_name"));
        return d;
    }
}
