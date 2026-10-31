package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.model.DeliveryDispatch;
import com.foodplatform.model.RiderCodSettlement;
import com.foodplatform.model.RiderProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RiderDaoImpl implements RiderDao {

    private static final Logger logger = LoggerFactory.getLogger(RiderDaoImpl.class);

    @Override
    public RiderProfile findByUserId(long userId) {
        String sql = "SELECT rp.*, u.full_name AS rd_name, u.phone AS rd_phone, u.email AS rd_email, u.avatar_url " +
                "FROM rider_profiles rp " +
                "JOIN users u ON rp.user_id = u.id " +
                "WHERE rp.user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRider(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding rider by user id: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public RiderProfile findById(long riderId) {
        String sql = "SELECT rp.*, u.full_name AS rd_name, u.phone AS rd_phone, u.email AS rd_email, u.avatar_url " +
                "FROM rider_profiles rp " +
                "JOIN users u ON rp.user_id = u.id " +
                "WHERE rp.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRider(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding rider by id: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public List<RiderProfile> findNearestAvailableRiders(double restLat, double restLng, double maxDistanceKm, int limit) {
        List<RiderProfile> list = new ArrayList<>();
        String sql = "SELECT rp.*, u.full_name AS rd_name, u.phone AS rd_phone, u.email AS rd_email, u.avatar_url, " +
                "(6371 * ACOS(LEAST(1.0, COS(RADIANS(?)) * COS(RADIANS(rp.current_latitude)) * COS(RADIANS(rp.current_longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(rp.current_latitude))))) AS distance_km " +
                "FROM rider_profiles rp " +
                "JOIN users u ON rp.user_id = u.id " +
                "WHERE rp.is_online = TRUE AND rp.is_available = TRUE AND rp.is_kyc_approved = TRUE " +
                "HAVING distance_km <= ? " +
                "ORDER BY distance_km ASC LIMIT ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, restLat);
            ps.setDouble(2, restLng);
            ps.setDouble(3, restLat);
            ps.setDouble(4, maxDistanceKm);
            ps.setInt(5, limit);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRider(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding nearest riders", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public List<RiderProfile> findNearestAvailableRidersExcluding(double restLat, double restLng, double maxDistanceKm, int limit, List<Long> excludedRiderIds) {
        if (excludedRiderIds == null || excludedRiderIds.isEmpty()) {
            return findNearestAvailableRiders(restLat, restLng, maxDistanceKm, limit);
        }

        List<RiderProfile> list = new ArrayList<>();
        StringBuilder inClause = new StringBuilder();
        for (int i = 0; i < excludedRiderIds.size(); i++) {
            if (i > 0) inClause.append(",");
            inClause.append("?");
        }

        String sql = "SELECT rp.*, u.full_name AS rd_name, u.phone AS rd_phone, u.email AS rd_email, u.avatar_url, " +
                "(6371 * ACOS(LEAST(1.0, COS(RADIANS(?)) * COS(RADIANS(rp.current_latitude)) * COS(RADIANS(rp.current_longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(rp.current_latitude))))) AS distance_km " +
                "FROM rider_profiles rp " +
                "JOIN users u ON rp.user_id = u.id " +
                "WHERE rp.is_online = TRUE AND rp.is_available = TRUE AND rp.is_kyc_approved = TRUE " +
                "AND rp.id NOT IN (" + inClause + ") " +
                "HAVING distance_km <= ? " +
                "ORDER BY distance_km ASC LIMIT ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            int idx = 1;
            ps.setDouble(idx++, restLat);
            ps.setDouble(idx++, restLng);
            ps.setDouble(idx++, restLat);
            for (Long excludedId : excludedRiderIds) {
                ps.setLong(idx++, excludedId);
            }
            ps.setDouble(idx++, maxDistanceKm);
            ps.setInt(idx++, limit);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRider(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding nearest riders with exclusions", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public void updateOnlineStatus(long riderId, boolean isOnline) {
        String sql = "UPDATE rider_profiles SET is_online = ?, is_available = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, isOnline);
            ps.setBoolean(2, isOnline);
            ps.setLong(3, riderId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating online status for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateRiderLocation(long riderId, double lat, double lng, double speed, double heading, Long orderId) {
        String updateRider = "UPDATE rider_profiles SET current_latitude = ?, current_longitude = ?, last_ping_time = CURRENT_TIMESTAMP WHERE id = ?";
        String insertLog = "INSERT INTO rider_location_logs (rider_id, order_id, latitude, longitude, speed, heading) VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps1 = conn.prepareStatement(updateRider)) {
                    ps1.setBigDecimal(1, BigDecimal.valueOf(lat));
                    ps1.setBigDecimal(2, BigDecimal.valueOf(lng));
                    ps1.setLong(3, riderId);
                    ps1.executeUpdate();
                }

                try (PreparedStatement ps2 = conn.prepareStatement(insertLog)) {
                    ps2.setLong(1, riderId);
                    if (orderId != null) ps2.setLong(2, orderId);
                    else ps2.setNull(2, Types.BIGINT);
                    ps2.setBigDecimal(3, BigDecimal.valueOf(lat));
                    ps2.setBigDecimal(4, BigDecimal.valueOf(lng));
                    ps2.setBigDecimal(5, BigDecimal.valueOf(speed));
                    ps2.setBigDecimal(6, BigDecimal.valueOf(heading));
                    ps2.executeUpdate();
                }

                conn.commit();
            } catch (SQLException | RuntimeException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error updating rider telemetry for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateRiderAvailability(Connection conn, long riderId, boolean isAvailable, Long activeOrderId) throws SQLException {
        String sql = "UPDATE rider_profiles SET is_available = ?, active_order_id = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, isAvailable);
            if (activeOrderId != null) ps.setLong(2, activeOrderId);
            else ps.setNull(2, Types.BIGINT);
            ps.setLong(3, riderId);
            ps.executeUpdate();
        }
    }

    @Override
    public Long createDispatchOffer(Connection conn, DeliveryDispatch dispatch) throws SQLException {
        String sql = "INSERT INTO delivery_dispatches (order_id, rider_id, dispatch_status, base_pay, distance_pay, surge_pay, tip_amount, total_earning) " +
                "VALUES (?, ?, 'OFFERED', ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, dispatch.getOrderId());
            ps.setLong(2, dispatch.getRiderId());
            ps.setBigDecimal(3, dispatch.getBasePay());
            ps.setBigDecimal(4, dispatch.getDistancePay());
            ps.setBigDecimal(5, dispatch.getSurgePay());
            ps.setBigDecimal(6, dispatch.getTipAmount());
            ps.setBigDecimal(7, dispatch.getTotalEarning());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    dispatch.setId(id);
                    return id;
                }
            }
        }
        return null;
    }

    @Override
    public DeliveryDispatch findDispatchOfferWithLock(Connection conn, long dispatchId) throws SQLException {
        String sql = "SELECT * FROM delivery_dispatches WHERE id = ? FOR UPDATE";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, dispatchId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    DeliveryDispatch d = new DeliveryDispatch();
                    d.setId(rs.getLong("id"));
                    d.setOrderId(rs.getLong("order_id"));
                    d.setRiderId(rs.getLong("rider_id"));
                    d.setDispatchStatus(rs.getString("dispatch_status"));
                    d.setOfferedAt(rs.getTimestamp("offered_at"));
                    d.setRespondedAt(rs.getTimestamp("responded_at"));
                    d.setBasePay(rs.getBigDecimal("base_pay"));
                    d.setDistancePay(rs.getBigDecimal("distance_pay"));
                    d.setSurgePay(rs.getBigDecimal("surge_pay"));
                    d.setTipAmount(rs.getBigDecimal("tip_amount"));
                    d.setTotalEarning(rs.getBigDecimal("total_earning"));
                    d.setWaitTimeMinutes(rs.getInt("wait_time_minutes"));
                    d.setWaitTimePay(rs.getBigDecimal("wait_time_pay"));
                    d.setRejectionReason(rs.getString("rejection_reason"));
                    return d;
                }
            }
        }
        return null;
    }

    @Override
    public void updateDispatchStatus(Connection conn, long dispatchId, String status, String reason) throws SQLException {
        String sql = "UPDATE delivery_dispatches SET dispatch_status = ?, responded_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, reason);
            ps.setLong(3, dispatchId);
            ps.executeUpdate();
        }
    }

    @Override
    public void updateWaitTimeCompensation(Connection conn, long dispatchId, int minutes, BigDecimal pay) throws SQLException {
        String sql = "UPDATE delivery_dispatches SET wait_time_minutes = ?, wait_time_pay = ?, total_earning = total_earning + ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, minutes);
            ps.setBigDecimal(2, pay);
            ps.setBigDecimal(3, pay);
            ps.setLong(4, dispatchId);
            ps.executeUpdate();
        }
    }

    @Override
    public DeliveryDispatch getRiderActiveDispatch(long riderId) {
        String sql = "SELECT d.*, o.order_number, o.total_amount, o.payment_mode, " +
                "r.name AS rest_name, r.address AS rest_addr, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS cust_addr, " +
                "a.latitude AS cust_lat, a.longitude AS cust_lng, a.maps_url AS cust_maps_url " +
                "FROM delivery_dispatches d " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "WHERE d.rider_id = ? AND d.dispatch_status = 'ACCEPTED' " +
                "AND o.status NOT IN ('DELIVERED', 'CANCELLED', 'REJECTED') " +
                "ORDER BY d.id DESC LIMIT 1";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapDispatch(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting active dispatch for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public List<Long> getExcludedRiderIdsForOrder(long orderId) {
        List<Long> ids = new ArrayList<>();
        String sql = "SELECT rider_id FROM delivery_dispatches WHERE order_id = ? AND dispatch_status IN ('REJECTED', 'TIMED_OUT')";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getLong("rider_id"));
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting excluded rider ids for order: {}", orderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return ids;
    }

    @Override
    public List<DeliveryDispatch> getTimedOutOffers(int timeoutSeconds) {
        List<DeliveryDispatch> list = new ArrayList<>();
        String sql = "SELECT * FROM delivery_dispatches WHERE dispatch_status = 'OFFERED' " +
                "AND offered_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? SECOND)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, timeoutSeconds);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    DeliveryDispatch d = new DeliveryDispatch();
                    d.setId(rs.getLong("id"));
                    d.setOrderId(rs.getLong("order_id"));
                    d.setRiderId(rs.getLong("rider_id"));
                    d.setDispatchStatus(rs.getString("dispatch_status"));
                    list.add(d);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding timed out offers", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public List<DeliveryDispatch> getActiveOffersForRider(long riderId) {
        List<DeliveryDispatch> list = new ArrayList<>();
        String sql = "SELECT d.*, o.order_number, o.total_amount, o.payment_mode, " +
                "r.name AS rest_name, r.address AS rest_addr, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS cust_addr, " +
                "a.latitude AS cust_lat, a.longitude AS cust_lng, a.maps_url AS cust_maps_url " +
                "FROM delivery_dispatches d " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "WHERE d.rider_id = ? AND d.dispatch_status = 'OFFERED' " +
                "AND o.status NOT IN ('DELIVERED', 'CANCELLED', 'REJECTED') " +
                "ORDER BY d.id DESC";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapDispatch(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting active offers for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public DeliveryDispatch findDispatchByOrderId(long orderId) {
        String sql = "SELECT d.*, o.order_number, o.total_amount, o.payment_mode, " +
                "r.name AS rest_name, r.address AS rest_addr, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS cust_addr, " +
                "a.latitude AS cust_lat, a.longitude AS cust_lng, a.maps_url AS cust_maps_url " +
                "FROM delivery_dispatches d " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "WHERE d.order_id = ? AND d.dispatch_status = 'ACCEPTED' " +
                "ORDER BY d.id DESC LIMIT 1";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapDispatch(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding dispatch by order id: {}", orderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void recordRiderMilestoneTimestamp(Connection conn, long dispatchId, String milestoneColumn) throws SQLException {
        if (!milestoneColumn.matches("^(arrived_at_restaurant_at|picked_up_at|arrived_at_customer_at|delivered_at)$")) {
            throw new IllegalArgumentException("Invalid milestone column: " + milestoneColumn);
        }
        String sql = "UPDATE delivery_dispatches SET " + milestoneColumn + " = CURRENT_TIMESTAMP WHERE id = ? AND " + milestoneColumn + " IS NULL";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, dispatchId);
            ps.executeUpdate();
        }
    }

    @Override
    public void updateRiderProfileDetails(long riderId, String vehicleType, String vehicleNumber, String drivingLicense) {
        String sql = "UPDATE rider_profiles SET vehicle_type = COALESCE(?, vehicle_type), " +
                "vehicle_number = COALESCE(?, vehicle_number), driving_license = COALESCE(?, driving_license) WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, vehicleType);
            ps.setString(2, vehicleNumber);
            ps.setString(3, drivingLicense);
            ps.setLong(4, riderId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating rider profile details: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void recordCodCollection(Connection conn, long riderId, long orderId, BigDecimal amount) throws SQLException {
        String updateCashSql = "UPDATE rider_profiles SET cash_in_hand = cash_in_hand + ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(updateCashSql)) {
            ps.setBigDecimal(1, amount);
            ps.setLong(2, riderId);
            ps.executeUpdate();
        }

        String ledgerSql = "INSERT INTO rider_cod_settlements (rider_id, order_id, amount, transaction_type, running_cash_in_hand, notes) " +
                "VALUES (?, ?, ?, 'COLLECTED', (SELECT cash_in_hand FROM rider_profiles WHERE id = ?), 'Cash collected on delivery')";
        try (PreparedStatement ps = conn.prepareStatement(ledgerSql)) {
            ps.setLong(1, riderId);
            ps.setLong(2, orderId);
            ps.setBigDecimal(3, amount);
            ps.setLong(4, riderId);
            ps.executeUpdate();
        }
    }

    @Override
    public BigDecimal recordCodDeposit(long riderId, BigDecimal amount, String referenceNumber, String notes) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String updateSql = "UPDATE rider_profiles SET cash_in_hand = GREATEST(0.00, cash_in_hand - ?) WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                    ps.setBigDecimal(1, amount);
                    ps.setLong(2, riderId);
                    ps.executeUpdate();
                }

                String ledgerSql = "INSERT INTO rider_cod_settlements (rider_id, order_id, amount, transaction_type, running_cash_in_hand, reference_number, notes) " +
                        "VALUES (?, NULL, ?, 'DEPOSITED', (SELECT cash_in_hand FROM rider_profiles WHERE id = ?), ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(ledgerSql)) {
                    ps.setLong(1, riderId);
                    ps.setBigDecimal(2, amount);
                    ps.setLong(3, riderId);
                    ps.setString(4, referenceNumber);
                    ps.setString(5, notes != null ? notes : "COD cash deposit to platform");
                    ps.executeUpdate();
                }

                BigDecimal newCash = BigDecimal.ZERO;
                String querySql = "SELECT cash_in_hand FROM rider_profiles WHERE id = ?";
                try (PreparedStatement ps = conn.prepareStatement(querySql)) {
                    ps.setLong(1, riderId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) newCash = rs.getBigDecimal("cash_in_hand");
                    }
                }

                conn.commit();
                return newCash;
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                logger.error("Error depositing COD cash for rider: {}", riderId, e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Connection error during COD deposit", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return BigDecimal.ZERO;
    }

    @Override
    public List<RiderCodSettlement> getCodSettlements(long riderId, int limit, int offset) {
        List<RiderCodSettlement> list = new ArrayList<>();
        String sql = "SELECT * FROM rider_cod_settlements WHERE rider_id = ? ORDER BY id DESC LIMIT ? OFFSET ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    RiderCodSettlement s = new RiderCodSettlement();
                    s.setId(rs.getLong("id"));
                    s.setRiderId(rs.getLong("rider_id"));
                    long ordId = rs.getLong("order_id");
                    if (!rs.wasNull()) s.setOrderId(ordId);
                    s.setAmount(rs.getBigDecimal("amount"));
                    s.setTransactionType(rs.getString("transaction_type"));
                    s.setRunningCashInHand(rs.getBigDecimal("running_cash_in_hand"));
                    s.setReferenceNumber(rs.getString("reference_number"));
                    s.setNotes(rs.getString("notes"));
                    s.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(s);
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting COD settlements for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public Map<String, Object> getRiderEarningsSummary(long riderId) {
        Map<String, Object> map = new HashMap<>();
        String sql = "SELECT " +
                "COALESCE(SUM(CASE WHEN DATE(DATE_ADD(d.delivered_at, INTERVAL 330 MINUTE)) = DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE)) THEN d.total_earning ELSE 0 END), 0) AS today_earned, " +
                "COALESCE(SUM(CASE WHEN YEARWEEK(DATE_ADD(d.delivered_at, INTERVAL 330 MINUTE), 1) = YEARWEEK(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE), 1) THEN d.total_earning ELSE 0 END), 0) AS week_earned, " +
                "COALESCE(SUM(d.tip_amount), 0) AS total_tips, " +
                "COALESCE(SUM(d.wait_time_pay), 0) AS total_wait_pay, " +
                "COUNT(CASE WHEN d.dispatch_status IN ('ACCEPTED','DELIVERED') AND d.delivered_at IS NOT NULL THEN 1 END) AS runs_completed " +
                "FROM delivery_dispatches d WHERE d.rider_id = ? AND d.dispatch_status IN ('ACCEPTED','DELIVERED') AND d.delivered_at IS NOT NULL";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    map.put("todayEarned", rs.getBigDecimal("today_earned"));
                    map.put("weekEarned", rs.getBigDecimal("week_earned"));
                    map.put("totalTips", rs.getBigDecimal("total_tips"));
                    map.put("totalWaitPay", rs.getBigDecimal("total_wait_pay"));
                    map.put("runsCompleted", rs.getInt("runs_completed"));
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting earnings summary for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return map;
    }

    @Override
    public List<DeliveryDispatch> getRiderCompletedTrips(long riderId, int limit, int offset) {
        List<DeliveryDispatch> list = new ArrayList<>();
        String sql = "SELECT d.*, o.order_number, o.total_amount, o.payment_mode, " +
                "r.name AS rest_name, r.address AS rest_addr, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS cust_addr, " +
                "a.latitude AS cust_lat, a.longitude AS cust_lng, a.maps_url AS cust_maps_url " +
                "FROM delivery_dispatches d " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "WHERE d.rider_id = ? AND d.dispatch_status IN ('ACCEPTED','DELIVERED') " +
                "ORDER BY d.id DESC LIMIT ? OFFSET ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapDispatch(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting completed trips for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    private DeliveryDispatch mapDispatch(ResultSet rs) throws SQLException {
        DeliveryDispatch d = new DeliveryDispatch();
        d.setId(rs.getLong("id"));
        d.setOrderId(rs.getLong("order_id"));
        d.setRiderId(rs.getLong("rider_id"));
        d.setDispatchStatus(rs.getString("dispatch_status"));
        d.setOfferedAt(rs.getTimestamp("offered_at"));
        d.setRespondedAt(rs.getTimestamp("responded_at"));
        d.setBasePay(rs.getBigDecimal("base_pay"));
        d.setDistancePay(rs.getBigDecimal("distance_pay"));
        d.setSurgePay(rs.getBigDecimal("surge_pay"));
        d.setTipAmount(rs.getBigDecimal("tip_amount"));
        d.setTotalEarning(rs.getBigDecimal("total_earning"));
        d.setWaitTimeMinutes(rs.getInt("wait_time_minutes"));
        d.setWaitTimePay(rs.getBigDecimal("wait_time_pay"));
        d.setRejectionReason(rs.getString("rejection_reason"));

        try {
            d.setArrivedAtRestaurantAt(rs.getTimestamp("arrived_at_restaurant_at"));
            d.setPickedUpAt(rs.getTimestamp("picked_up_at"));
            d.setArrivedAtCustomerAt(rs.getTimestamp("arrived_at_customer_at"));
            d.setDeliveredAt(rs.getTimestamp("delivered_at"));
            d.setWaitCompensationClaimed(rs.getBoolean("wait_compensation_claimed"));
        } catch (SQLException ignored) {}

        try {
            d.setOrderNumber(rs.getString("order_number"));
            d.setOrderTotal(rs.getBigDecimal("total_amount"));
            d.setPaymentMode(rs.getString("payment_mode"));
            d.setRestaurantName(rs.getString("rest_name"));
            d.setRestaurantAddress(rs.getString("rest_addr"));
            d.setRestaurantLat(rs.getDouble("rest_lat"));
            d.setRestaurantLng(rs.getDouble("rest_lng"));
            d.setCustomerName(rs.getString("cust_name"));
            d.setCustomerPhone(rs.getString("cust_phone"));
            d.setCustomerAddress(rs.getString("cust_addr"));
            d.setCustomerLat(rs.getDouble("cust_lat"));
            d.setCustomerLng(rs.getDouble("cust_lng"));
            d.setCustomerMapsUrl(rs.getString("cust_maps_url"));
        } catch (SQLException ignored) {}

        return d;
    }

    @Override
    public Long createRiderProfile(RiderProfile rp) {
        String sql = "INSERT INTO rider_profiles (user_id, vehicle_type, vehicle_number, driving_license, is_kyc_approved, " +
                "is_online, is_available, current_latitude, current_longitude, wallet_balance) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, rp.getUserId());
            ps.setString(2, rp.getVehicleType() != null ? rp.getVehicleType() : "Motorcycle");
            ps.setString(3, rp.getVehicleNumber() != null ? rp.getVehicleNumber() : "NEW-REG");
            ps.setString(4, rp.getDrivingLicense() != null ? rp.getDrivingLicense() : "PENDING-VERIFY");
            ps.setBoolean(5, rp.isKycApproved());
            ps.setBoolean(6, rp.isOnline());
            ps.setBoolean(7, rp.isAvailable());
            ps.setBigDecimal(8, rp.getCurrentLatitude());
            ps.setBigDecimal(9, rp.getCurrentLongitude());
            ps.setBigDecimal(10, rp.getWalletBalance() != null ? rp.getWalletBalance() : BigDecimal.ZERO);

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        long genId = rs.getLong(1);
                        rp.setId(genId);
                        return genId;
                    }
                }
            }
        } catch (SQLException e) {
            logger.error("Error creating rider profile for user: {}", rp.getUserId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void updateKyc(long riderId, boolean approved) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                long userId;
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE rider_profiles SET is_kyc_approved = ? WHERE id = ?")) {
                    ps.setBoolean(1, approved);
                    ps.setLong(2, riderId);
                    if (ps.executeUpdate() == 0) throw new IllegalArgumentException("Rider not found");
                }
                try (PreparedStatement ps = conn.prepareStatement("SELECT user_id FROM rider_profiles WHERE id = ?")) {
                    ps.setLong(1, riderId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) throw new IllegalArgumentException("Rider not found");
                        userId = rs.getLong("user_id");
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement("UPDATE users SET status = ? WHERE id = ?")) {
                    ps.setString(1, approved ? "ACTIVE" : "SUSPENDED");
                    ps.setLong(2, userId);
                    if (ps.executeUpdate() == 0) throw new IllegalStateException("Rider account not found");
                }
                conn.commit();
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error updating kyc for rider: {}", riderId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<RiderProfile> listAllRiders(int limit, int offset) {
        List<RiderProfile> list = new ArrayList<>();
        String sql = "SELECT rp.*, u.full_name AS rd_name, u.phone AS rd_phone, u.email AS rd_email, u.avatar_url " +
                "FROM rider_profiles rp " +
                "JOIN users u ON rp.user_id = u.id " +
                "ORDER BY rp.id DESC LIMIT ? OFFSET ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ps.setInt(2, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRider(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing all riders", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    private RiderProfile mapRider(ResultSet rs) throws SQLException {
        RiderProfile r = new RiderProfile();
        r.setId(rs.getLong("id"));
        r.setUserId(rs.getLong("user_id"));
        r.setVehicleType(rs.getString("vehicle_type"));
        r.setVehicleNumber(rs.getString("vehicle_number"));
        r.setDrivingLicense(rs.getString("driving_license"));
        r.setKycApproved(rs.getBoolean("is_kyc_approved"));
        r.setOnline(rs.getBoolean("is_online"));
        r.setAvailable(rs.getBoolean("is_available"));
        r.setCurrentLatitude(rs.getBigDecimal("current_latitude"));
        r.setCurrentLongitude(rs.getBigDecimal("current_longitude"));
        r.setLastPingTime(rs.getTimestamp("last_ping_time"));
        r.setTotalDeliveries(rs.getInt("total_deliveries"));
        r.setRating(rs.getBigDecimal("rating"));
        long activeId = rs.getLong("active_order_id");
        if (!rs.wasNull()) r.setActiveOrderId(activeId);
        r.setWalletBalance(rs.getBigDecimal("wallet_balance"));
        r.setCreatedAt(rs.getTimestamp("created_at"));
        r.setUpdatedAt(rs.getTimestamp("updated_at"));

        r.setRiderName(rs.getString("rd_name"));
        r.setRiderPhone(rs.getString("rd_phone"));
        r.setRiderEmail(rs.getString("rd_email"));
        r.setAvatarUrl(rs.getString("avatar_url"));
        return r;
    }

    @Override
    public int purgeOldLocationLogs(int retentionDays) {
        String sql = "DELETE FROM rider_location_logs WHERE logged_at < NOW() - INTERVAL ? DAY";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, Math.max(1, retentionDays));
            int deleted = ps.executeUpdate();
            logger.info("Purged {} expired rider location logs older than {} days", deleted, retentionDays);
            return deleted;
        } catch (SQLException e) {
            logger.error("Error purging old rider location logs with retention days {}", retentionDays, e);
            return 0;
        }
    }
}
