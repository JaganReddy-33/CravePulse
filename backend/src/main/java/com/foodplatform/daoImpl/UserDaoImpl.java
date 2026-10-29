package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.UserDao;
import com.foodplatform.model.Address;
import com.foodplatform.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserDaoImpl implements UserDao {

    private static final Logger logger = LoggerFactory.getLogger(UserDaoImpl.class);

    @Override
    public User findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding user by email: {}", email, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public User findByPhone(String phone) {
        String sql = "SELECT * FROM users WHERE phone = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, phone);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding user by phone: {}", phone, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public User findById(long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding user by id: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public User findByIdWithLock(Connection conn, long id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ? FOR UPDATE";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        }
        return null;
    }

    @Override
    public Long createUser(User user) {
        String sql = "INSERT INTO users (full_name, email, phone, password_hash, role, status, avatar_url, wallet_balance) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getFullName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPhone());
            ps.setString(4, user.getPasswordHash());
            ps.setString(5, user.getRole());
            ps.setString(6, user.getStatus() != null ? user.getStatus() : "ACTIVE");
            ps.setString(7, user.getAvatarUrl());
            ps.setBigDecimal(8, user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO);

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        long generatedId = rs.getLong(1);
                        user.setId(generatedId);
                        return generatedId;
                    }
                }
            }
        } catch (SQLException e) {
            logger.error("Error creating user: {}", user.getEmail(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void updateFailedAttempts(long userId, int attempts, Timestamp lockedUntil) {
        String sql = "UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, attempts);
            ps.setTimestamp(2, lockedUntil);
            ps.setLong(3, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating failed attempts for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void resetFailedAttempts(long userId) {
        String sql = "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error resetting failed attempts for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void storeRefreshToken(long userId, String token, Timestamp expiresAt) {
        String sql = "INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setString(2, token);
            ps.setTimestamp(3, expiresAt);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error storing refresh token for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public Long findUserIdByValidRefreshToken(String token) {
        String sql = "SELECT user_id FROM user_tokens WHERE refresh_token = ? AND revoked = FALSE AND expires_at > CURRENT_TIMESTAMP";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("user_id");
                }
            }
        } catch (SQLException e) {
            logger.error("Error validating refresh token", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void revokeRefreshToken(String token) {
        String sql = "UPDATE user_tokens SET revoked = TRUE WHERE refresh_token = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error revoking refresh token", e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void revokeAllUserTokens(long userId) {
        String sql = "UPDATE user_tokens SET revoked = TRUE WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error revoking all refresh tokens for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateWalletBalance(Connection conn, long userId, BigDecimal newBalance) throws SQLException {
        String sql = "UPDATE users SET wallet_balance = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, newBalance);
            ps.setLong(2, userId);
            ps.executeUpdate();
        }
    }

    @Override
    public List<Address> getUserAddresses(long userId) {
        List<Address> list = new ArrayList<>();
        String sql = "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Address addr = new Address();
                    addr.setId(rs.getLong("id"));
                    addr.setUserId(rs.getLong("user_id"));
                    addr.setTitle(rs.getString("title"));
                    addr.setAddressLine(rs.getString("address_line"));
                    addr.setLandmark(rs.getString("landmark"));
                    addr.setCity(rs.getString("city"));
                    addr.setState(rs.getString("state"));
                    addr.setPostalCode(rs.getString("postal_code"));
                    addr.setLatitude(rs.getBigDecimal("latitude"));
                    addr.setLongitude(rs.getBigDecimal("longitude"));
                    addr.setDefault(rs.getBoolean("is_default"));
                    addr.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(addr);
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting addresses for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public Address getAddressById(long addressId) {
        String sql = "SELECT * FROM user_addresses WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, addressId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Address addr = new Address();
                    addr.setId(rs.getLong("id"));
                    addr.setUserId(rs.getLong("user_id"));
                    addr.setTitle(rs.getString("title"));
                    addr.setAddressLine(rs.getString("address_line"));
                    addr.setLandmark(rs.getString("landmark"));
                    addr.setCity(rs.getString("city"));
                    addr.setState(rs.getString("state"));
                    addr.setPostalCode(rs.getString("postal_code"));
                    addr.setLatitude(rs.getBigDecimal("latitude"));
                    addr.setLongitude(rs.getBigDecimal("longitude"));
                    addr.setDefault(rs.getBoolean("is_default"));
                    addr.setCreatedAt(rs.getTimestamp("created_at"));
                    return addr;
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting address by id: {}", addressId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public Long addAddress(Address addr) {
        String sql = "INSERT INTO user_addresses (user_id, title, address_line, landmark, city, state, postal_code, latitude, longitude, is_default) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, addr.getUserId());
            ps.setString(2, addr.getTitle());
            ps.setString(3, addr.getAddressLine());
            ps.setString(4, addr.getLandmark());
            ps.setString(5, addr.getCity());
            ps.setString(6, addr.getState());
            ps.setString(7, addr.getPostalCode());
            ps.setBigDecimal(8, addr.getLatitude());
            ps.setBigDecimal(9, addr.getLongitude());
            ps.setBoolean(10, addr.isDefault());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        } catch (SQLException e) {
            logger.error("Error adding address for user: {}", addr.getUserId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void deleteAddress(long addressId, long userId) {
        String sql = "DELETE FROM user_addresses WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, addressId);
            ps.setLong(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error deleting address {} for user {}", addressId, userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void setDefaultAddress(long addressId, long userId) {
        String resetSql = "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?";
        String setSql = "UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps1 = conn.prepareStatement(resetSql);
                 PreparedStatement ps2 = conn.prepareStatement(setSql)) {
                ps1.setLong(1, userId);
                ps1.executeUpdate();

                ps2.setLong(1, addressId);
                ps2.setLong(2, userId);
                ps2.executeUpdate();

                conn.commit();
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error setting default address {} for user {}", addressId, userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateProfile(long userId, String fullName, String phone, String avatarUrl) {
        String sql = "UPDATE users SET full_name = ?, phone = ?, avatar_url = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fullName);
            ps.setString(2, phone);
            ps.setString(3, avatarUrl);
            ps.setLong(4, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating profile for user {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<User> listAllUsers(int limit, int offset) {
        return searchUsers(null, null, null, limit, offset);
    }

    @Override
    public List<User> searchUsers(String query, String role, String status, int limit, int offset) {
        List<User> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM users WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append("AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?) ");
            String q = "%" + query.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
        }
        if (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role)) {
            sql.append("AND role = ? ");
            params.add(role.trim().toUpperCase());
        }
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            sql.append("AND status = ? ");
            params.add(status.trim().toUpperCase());
        }

        sql.append("ORDER BY id DESC LIMIT ? OFFSET ?");
        params.add(limit > 0 ? limit : 50);
        params.add(Math.max(offset, 0));

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof String) ps.setString(i + 1, (String) p);
                else if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapUser(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error searching users with query: {}, role: {}, status: {}", query, role, status, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public void updateUserStatus(long userId, String status) {
        String sql = "UPDATE users SET status = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setLong(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating user status: {} for user: {}", status, userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void incrementFraudFlag(long userId) {
        String sql = "UPDATE users SET fraud_flag_count = fraud_flag_count + 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error incrementing fraud flag for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public int getFraudFlagCount(long userId) {
        String sql = "SELECT fraud_flag_count FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("fraud_flag_count");
                }
            }
        } catch (SQLException e) {
            logger.error("Error reading fraud flag count for user: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return 0;
    }

    private User mapUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getLong("id"));
        u.setFullName(rs.getString("full_name"));
        u.setEmail(rs.getString("email"));
        u.setPhone(rs.getString("phone"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setRole(rs.getString("role"));
        u.setStatus(rs.getString("status"));
        u.setFailedAttempts(rs.getInt("failed_attempts"));
        u.setLockedUntil(rs.getTimestamp("locked_until"));
        u.setAvatarUrl(rs.getString("avatar_url"));
        u.setWalletBalance(rs.getBigDecimal("wallet_balance"));
        u.setCreatedAt(rs.getTimestamp("created_at"));
        u.setUpdatedAt(rs.getTimestamp("updated_at"));
        try {
            u.setFraudFlagCount(rs.getInt("fraud_flag_count"));
        } catch (SQLException ignored) {}
        return u;
    }
}
