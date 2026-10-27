package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.model.DeliveryDispatch;
import com.foodplatform.model.RiderProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

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
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error updating rider telemetry for rider: {}", riderId, e);
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
                "a.latitude AS cust_lat, a.longitude AS cust_lng " +
                "FROM delivery_dispatches d " +
                "JOIN orders o ON d.order_id = o.id " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "WHERE d.rider_id = ? AND d.dispatch_status IN ('OFFERED', 'ACCEPTED') " +
                "AND o.status NOT IN ('DELIVERED', 'CANCELLED', 'REJECTED') " +
                "ORDER BY d.id DESC LIMIT 1";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
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
                    return d;
                }
            }
        } catch (SQLException e) {
            logger.error("Error getting active dispatch for rider: {}", riderId, e);
        }
        return null;
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
}
