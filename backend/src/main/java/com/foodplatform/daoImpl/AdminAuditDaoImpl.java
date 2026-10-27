package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.AdminAuditDao;
import com.foodplatform.model.AdminAuditLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AdminAuditDaoImpl implements AdminAuditDao {

    private static final Logger logger = LoggerFactory.getLogger(AdminAuditDaoImpl.class);

    @Override
    public void logAction(long adminUserId, String adminName, String action, String targetType, String targetId, String details, String ipAddress) {
        String sql = "INSERT INTO admin_audit_logs (admin_user_id, admin_name, action, target_type, target_id, details, ip_address) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, adminUserId);
            ps.setString(2, adminName);
            ps.setString(3, action);
            ps.setString(4, targetType);
            ps.setString(5, targetId);
            ps.setString(6, details);
            ps.setString(7, ipAddress);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error writing admin audit log: action={}, target={}", action, targetId, e);
        }
    }

    @Override
    public List<AdminAuditLog> listRecentLogs(int limit, int offset) {
        List<AdminAuditLog> logs = new ArrayList<>();
        String sql = "SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ps.setInt(2, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    AdminAuditLog log = new AdminAuditLog();
                    log.setId(rs.getLong("id"));
                    log.setAdminUserId(rs.getLong("admin_user_id"));
                    log.setAdminName(rs.getString("admin_name"));
                    log.setAction(rs.getString("action"));
                    log.setTargetType(rs.getString("target_type"));
                    log.setTargetId(rs.getString("target_id"));
                    log.setDetails(rs.getString("details"));
                    log.setIpAddress(rs.getString("ip_address"));
                    log.setCreatedAt(rs.getTimestamp("created_at"));
                    logs.add(log);
                }
            }
        } catch (SQLException e) {
            logger.error("Error retrieving admin audit logs", e);
        }
        return logs;
    }
}
