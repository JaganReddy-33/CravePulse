package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.PayoutRequestDao;
import com.foodplatform.model.User;
import com.foodplatform.model.WalletTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.util.*;

public class PayoutRequestDaoImpl implements PayoutRequestDao {
    private static final Logger logger = LoggerFactory.getLogger(PayoutRequestDaoImpl.class);
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal GST_RATE = new BigDecimal("0.18");

    @Override
    public Map<String, Object> getRiderPayoutSummary(long userId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            BigDecimal balance = getUserBalance(conn, userId, false);
            BigDecimal pending = getPendingAmount(conn, userId, "RIDER", null);
            return summary(balance.subtract(pending).max(ZERO), pending, listRequests(conn, userId, "RIDER", null));
        } catch (SQLException e) {
            logger.error("Could not load rider payout summary for user {}", userId, e);
            throw new IllegalStateException("Could not load payout balance", e);
        }
    }

    @Override
    public Map<String, Object> getRestaurantPayoutSummary(long restaurantId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            BigDecimal netEarned = getRestaurantNetEarned(conn, restaurantId);
            BigDecimal alreadyPaid = getRestaurantPaid(conn, restaurantId);
            BigDecimal pending = getPendingAmount(conn, null, "RESTAURANT", restaurantId);
            BigDecimal available = netEarned.subtract(alreadyPaid).subtract(pending).max(ZERO);
            Map<String, Object> result = summary(available, pending, listRequests(conn, null, "RESTAURANT", restaurantId));
            result.put("lifetimeNetEarnings", netEarned);
            result.put("alreadyPaid", alreadyPaid);
            return result;
        } catch (SQLException e) {
            logger.error("Could not load restaurant payout summary for restaurant {}", restaurantId, e);
            throw new IllegalStateException("Could not load payout balance", e);
        }
    }

    @Override
    public Map<String, Object> createRiderRequest(long userId, BigDecimal amount, String payoutDestination) {
        validateRequest(amount, payoutDestination);
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                BigDecimal balance = getUserBalance(conn, userId, true);
                BigDecimal pending = getPendingAmount(conn, userId, "RIDER", null);
                ensureAvailable(amount, balance.subtract(pending));
                long id = insertRequest(conn, userId, "RIDER", null, amount, payoutDestination);
                conn.commit();
                return getRequestById(id);
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Could not create rider payout request for user {}", userId, e);
            throw new IllegalStateException("Could not create payout request", e);
        }
    }

    @Override
    public Map<String, Object> createRestaurantRequest(long userId, long restaurantId, BigDecimal amount, String payoutDestination) {
        validateRequest(amount, payoutDestination);
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                lockRestaurant(conn, restaurantId);
                BigDecimal available = getRestaurantNetEarned(conn, restaurantId)
                        .subtract(getRestaurantPaid(conn, restaurantId))
                        .subtract(getPendingAmount(conn, null, "RESTAURANT", restaurantId))
                        .max(ZERO);
                ensureAvailable(amount, available);
                long id = insertRequest(conn, userId, "RESTAURANT", restaurantId, amount, payoutDestination);
                conn.commit();
                return getRequestById(id);
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Could not create restaurant payout request for restaurant {}", restaurantId, e);
            throw new IllegalStateException("Could not create payout request", e);
        }
    }

    @Override
    public List<Map<String, Object>> listAdminRequests(String status) {
        String normalized = status == null || status.isBlank() ? null : status.trim().toUpperCase(Locale.ROOT);
        if (normalized != null && !Set.of("PENDING", "PAID", "REJECTED").contains(normalized)) {
            throw new IllegalArgumentException("Invalid payout request status");
        }
        String sql = "SELECT pr.*, u.full_name, u.email, r.name AS restaurant_name " +
                "FROM payout_requests pr JOIN users u ON u.id = pr.requester_user_id " +
                "LEFT JOIN restaurant_profiles r ON r.id = pr.restaurant_id " +
                (normalized == null ? "" : "WHERE pr.status = ? ") +
                "ORDER BY CASE WHEN pr.status = 'PENDING' THEN 0 ELSE 1 END, pr.created_at DESC LIMIT 200";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (normalized != null) ps.setString(1, normalized);
            try (ResultSet rs = ps.executeQuery()) {
                List<Map<String, Object>> requests = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> row = mapRequest(rs);
                    row.put("accountOwnerName", rs.getString("full_name"));
                    row.put("accountOwnerEmail", rs.getString("email"));
                    row.put("restaurantName", rs.getString("restaurant_name"));
                    requests.add(row);
                }
                return requests;
            }
        } catch (SQLException e) {
            logger.error("Could not load admin payout requests", e);
            throw new IllegalStateException("Could not load payout requests", e);
        }
    }

    @Override
    public Map<String, Object> updateAdminRequest(long requestId, long adminId, String status, String paymentReference, String adminNote) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("PAID", "REJECTED").contains(normalized)) throw new IllegalArgumentException("Status must be PAID or REJECTED");
        String reference = paymentReference == null ? "" : paymentReference.trim();
        if ("PAID".equals(normalized) && reference.isEmpty()) throw new IllegalArgumentException("Payment reference is required before marking a payout as paid");
        String note = adminNote == null ? "" : adminNote.trim();
        if (reference.length() > 120 || note.length() > 1000) throw new IllegalArgumentException("Payment reference or note is too long");

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Map<String, Object> request = lockRequest(conn, requestId);
                if (request == null) throw new IllegalArgumentException("Payout request not found");
                if (!"PENDING".equals(request.get("status"))) throw new PayoutRequestConflictException("Only pending requests can be processed");
                if ("PAID".equals(normalized) && "RIDER".equals(request.get("accountType"))) {
                    debitRiderWallet(conn, ((Number) request.get("requesterUserId")).longValue(),
                            (BigDecimal) request.get("amount"), requestId);
                } else if ("PAID".equals(normalized) && "RESTAURANT".equals(request.get("accountType"))) {
                    validateRestaurantRequestPayable(conn, request);
                }
                String sql = "UPDATE payout_requests SET status = ?, payment_reference = ?, admin_note = ?, processed_by_user_id = ? WHERE id = ? AND status = 'PENDING'";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, normalized);
                    ps.setString(2, "PAID".equals(normalized) ? reference : null);
                    ps.setString(3, note.isEmpty() ? null : note);
                    ps.setLong(4, adminId);
                    ps.setLong(5, requestId);
                    if (ps.executeUpdate() != 1) throw new IllegalStateException("Payout request was already processed");
                }
                conn.commit();
                return getRequestById(requestId);
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Could not process payout request {}", requestId, e);
            throw new IllegalStateException("Could not process payout request", e);
        }
    }

    private Map<String, Object> summary(BigDecimal available, BigDecimal pending, List<Map<String, Object>> requests) {
        Map<String, Object> result = new HashMap<>();
        result.put("availableBalance", available.max(ZERO));
        result.put("pendingAmount", pending);
        result.put("requests", requests);
        return result;
    }

    private List<Map<String, Object>> listRequests(Connection conn, Long userId, String accountType, Long restaurantId) throws SQLException {
        String sql = "SELECT * FROM payout_requests WHERE account_type = ? AND " +
                (restaurantId == null ? "requester_user_id = ?" : "restaurant_id = ?") +
                " ORDER BY created_at DESC LIMIT 50";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, accountType);
            ps.setLong(2, restaurantId == null ? userId : restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                List<Map<String, Object>> requests = new ArrayList<>();
                while (rs.next()) requests.add(mapRequest(rs));
                return requests;
            }
        }
    }

    private BigDecimal getUserBalance(Connection conn, long userId, boolean lock) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT wallet_balance FROM users WHERE id = ?" + (lock ? " FOR UPDATE" : ""))) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) throw new IllegalArgumentException("Rider account not found");
                BigDecimal value = rs.getBigDecimal(1);
                return value == null ? ZERO : value;
            }
        }
    }

    private BigDecimal getPendingAmount(Connection conn, Long userId, String accountType, Long restaurantId) throws SQLException {
        String sql = "SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE account_type = ? AND status = 'PENDING' AND " +
                (restaurantId == null ? "requester_user_id = ?" : "restaurant_id = ?");
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, accountType);
            ps.setLong(2, restaurantId == null ? userId : restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getBigDecimal(1).setScale(2, RoundingMode.HALF_UP);
            }
        }
    }

    private BigDecimal getRestaurantNetEarned(Connection conn, long restaurantId) throws SQLException {
        String sql = "SELECT COALESCE(SUM(ROUND(GREATEST(0, COALESCE(o.subtotal, 0) - " +
                "(COALESCE(o.subtotal, 0) * COALESCE(r.commission_rate, 15) / 100 * 1.18)), 2)), 0) " +
                "FROM orders o JOIN restaurant_profiles r ON r.id = o.restaurant_id " +
                "WHERE o.restaurant_id = ? AND o.status = 'DELIVERED' AND o.payment_status = 'PAID'";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getBigDecimal(1).setScale(2, RoundingMode.HALF_UP);
            }
        }
    }

    private BigDecimal getRestaurantPaid(Connection conn, long restaurantId) throws SQLException {
        String sql = "SELECT " +
                "(SELECT COALESCE(SUM(net_payout), 0) FROM restaurant_payouts WHERE restaurant_id = ? AND status = 'PAID') + " +
                "(SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE restaurant_id = ? AND account_type = 'RESTAURANT' AND status = 'PAID')";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            ps.setLong(2, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getBigDecimal(1).setScale(2, RoundingMode.HALF_UP);
            }
        }
    }

    private void lockRestaurant(Connection conn, long restaurantId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT id FROM restaurant_profiles WHERE id = ? FOR UPDATE")) {
            ps.setLong(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) throw new IllegalArgumentException("Restaurant account not found");
            }
        }
    }

    private void ensureAvailable(BigDecimal amount, BigDecimal available) {
        if (amount.compareTo(available) > 0) throw new IllegalArgumentException("Requested amount exceeds the available balance");
    }

    private void validateRequest(BigDecimal amount, String destination) {
        if (amount == null || amount.scale() > 2 || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Enter a positive payout amount with up to 2 decimal places");
        }
        String upi = destination == null ? "" : destination.trim();
        if (upi.length() > 200 || !upi.matches("[A-Za-z0-9._+-]{2,100}@[A-Za-z0-9.-]{2,100}")) {
            throw new IllegalArgumentException("Enter a valid UPI ID for manual settlement");
        }
    }

    private long insertRequest(Connection conn, long userId, String type, Long restaurantId, BigDecimal amount, String destination) throws SQLException {
        String sql = "INSERT INTO payout_requests (requester_user_id, account_type, restaurant_id, amount, payout_destination) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, userId);
            ps.setString(2, type);
            if (restaurantId == null) ps.setNull(3, Types.BIGINT); else ps.setLong(3, restaurantId);
            ps.setBigDecimal(4, amount.setScale(2, RoundingMode.UNNECESSARY));
            ps.setString(5, destination.trim());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getLong(1);
            }
        }
        throw new SQLException("Payout request insert returned no ID");
    }

    private Map<String, Object> lockRequest(Connection conn, long id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM payout_requests WHERE id = ? FOR UPDATE")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRequest(rs) : null;
            }
        }
    }

    private void debitRiderWallet(Connection conn, long userId, BigDecimal amount, long requestId) throws SQLException {
        UserDaoImpl userDao = new UserDaoImpl();
        User user = userDao.findByIdWithLock(conn, userId);
        if (user == null) throw new IllegalArgumentException("Rider account not found");
        BigDecimal balance = user.getWalletBalance() == null ? ZERO : user.getWalletBalance();
        if (balance.compareTo(amount) < 0) throw new PayoutRequestConflictException("Rider wallet no longer has enough funds to complete this payout");
        BigDecimal newBalance = balance.subtract(amount);
        userDao.updateWalletBalance(conn, userId, newBalance);
        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(userId);
        tx.setAmount(amount);
        tx.setTransactionType("DEBIT");
        tx.setReason("Manual payout request #" + requestId + " paid");
        tx.setBalanceAfter(newBalance);
        new WalletDaoImpl().recordTransaction(conn, tx);
    }

    private void validateRestaurantRequestPayable(Connection conn, Map<String, Object> request) throws SQLException {
        long restaurantId = ((Number) request.get("restaurantId")).longValue();
        BigDecimal amount = (BigDecimal) request.get("amount");
        lockRestaurant(conn, restaurantId);
        BigDecimal pending = getPendingAmount(conn, null, "RESTAURANT", restaurantId).subtract(amount);
        BigDecimal availableForRequest = getRestaurantNetEarned(conn, restaurantId)
                .subtract(getRestaurantPaid(conn, restaurantId))
                .subtract(pending);
        if (amount.compareTo(availableForRequest) > 0) {
            throw new PayoutRequestConflictException("Eligible restaurant earnings changed; review the balance before marking this request paid");
        }
    }

    private Map<String, Object> getRequestById(long id) {
        String sql = "SELECT * FROM payout_requests WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) throw new IllegalStateException("Payout request was not found after saving");
                return mapRequest(rs);
            }
        } catch (SQLException e) {
            logger.error("Could not reload payout request {}", id, e);
            throw new IllegalStateException("Could not reload payout request", e);
        }
    }

    private Map<String, Object> mapRequest(ResultSet rs) throws SQLException {
        Map<String, Object> row = new HashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("requesterUserId", rs.getLong("requester_user_id"));
        row.put("accountType", rs.getString("account_type"));
        long restaurantId = rs.getLong("restaurant_id");
        if (!rs.wasNull()) row.put("restaurantId", restaurantId);
        row.put("amount", rs.getBigDecimal("amount"));
        row.put("payoutDestination", rs.getString("payout_destination"));
        row.put("status", rs.getString("status"));
        row.put("paymentReference", rs.getString("payment_reference"));
        row.put("adminNote", rs.getString("admin_note"));
        row.put("createdAt", rs.getTimestamp("created_at"));
        row.put("updatedAt", rs.getTimestamp("updated_at"));
        return row;
    }
}
