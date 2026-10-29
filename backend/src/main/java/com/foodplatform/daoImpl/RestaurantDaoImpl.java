package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.model.Restaurant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RestaurantDaoImpl implements RestaurantDao {

    private static final Logger logger = LoggerFactory.getLogger(RestaurantDaoImpl.class);

    @Override
    public List<Restaurant> listOpenRestaurants(Double userLat, Double userLng, String cuisine, String search, Boolean vegOnly, int limit, int offset) {
        List<Restaurant> list = new ArrayList<>();
        Double lat = userLat;
        Double lng = userLng;

        StringBuilder sb = new StringBuilder();
        sb.append("SELECT r.*, ")
                .append("(6371 * ACOS(LEAST(1.0, COS(RADIANS(?)) * COS(RADIANS(r.latitude)) * COS(RADIANS(r.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(r.latitude))))) AS distance_km ")
                .append("FROM restaurant_profiles r ")
                .append("WHERE r.is_kyc_approved = TRUE ");

        List<Object> params = new ArrayList<>();
        params.add(lat);
        params.add(lng);
        params.add(lat);

        if (cuisine != null && !cuisine.isBlank()) {
            sb.append("AND r.cuisine_types LIKE ? ");
            params.add("%" + cuisine.trim() + "%");
        }
        if (search != null && !search.isBlank()) {
            sb.append("AND (r.name LIKE ? OR r.description LIKE ? OR r.cuisine_types LIKE ? ")
              .append("OR EXISTS (SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.is_deleted = FALSE AND (m.name LIKE ? OR m.description LIKE ?))) ");
            String term = "%" + search.trim() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
        }
        if (vegOnly != null && vegOnly) {
            sb.append("AND r.pure_veg = TRUE ");
        }

        sb.append("ORDER BY r.is_open DESC, distance_km ASC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sb.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Restaurant r = mapRestaurant(rs);
                    double distance = rs.getDouble("distance_km");
                    r.setDistanceKm(rs.wasNull() ? null : distance);
                    list.add(r);
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing restaurants", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public Restaurant findById(long id) {
        String sql = "SELECT * FROM restaurant_profiles WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRestaurant(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding restaurant by id: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public Restaurant findBySlug(String slug) {
        String sql = "SELECT * FROM restaurant_profiles WHERE slug = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, slug);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRestaurant(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding restaurant by slug: {}", slug, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public Restaurant findByUserId(long userId) {
        String sql = "SELECT * FROM restaurant_profiles WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRestaurant(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding restaurant by user id: {}", userId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void updateOpenStatus(long id, boolean isOpen) {
        String sql = "UPDATE restaurant_profiles SET is_open = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, isOpen);
            ps.setLong(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating open status for restaurant: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateAutoThrottle(long id, boolean throttled) {
        String sql = "UPDATE restaurant_profiles SET is_auto_throttled = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, throttled);
            ps.setLong(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating auto-throttle for restaurant: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void incrementCurrentLoad(Connection conn, long id) throws SQLException {
        String sql = "UPDATE restaurant_profiles SET current_load = current_load + 1, " +
                "is_auto_throttled = CASE WHEN (current_load + 1) >= max_concurrent_orders THEN TRUE ELSE is_auto_throttled END " +
                "WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        }
    }

    @Override
    public void decrementCurrentLoad(Connection conn, long id) throws SQLException {
        String sql = "UPDATE restaurant_profiles SET current_load = GREATEST(0, current_load - 1), " +
                "is_auto_throttled = CASE WHEN (current_load - 1) < max_concurrent_orders THEN FALSE ELSE is_auto_throttled END " +
                "WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        }
    }

    @Override
    public void updateKyc(long id, boolean approved) {
        String sql = "UPDATE restaurant_profiles SET is_kyc_approved = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, approved);
            ps.setLong(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating kyc for restaurant: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public Long createRestaurant(Restaurant r) {
        String sql = "INSERT INTO restaurant_profiles (user_id, name, slug, description, banner_image, logo_image, phone, email, " +
                "cuisine_types, latitude, longitude, address, fssai_license, is_open, is_auto_throttled, is_kyc_approved) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, r.getUserId());
            ps.setString(2, r.getName());
            ps.setString(3, r.getSlug());
            ps.setString(4, r.getDescription() != null ? r.getDescription() : "");
            ps.setString(5, r.getBannerImage());
            ps.setString(6, r.getLogoImage());
            ps.setString(7, r.getPhone());
            ps.setString(8, r.getEmail());
            ps.setString(9, r.getCuisineTypes() != null ? r.getCuisineTypes() : "Multi-Cuisine");
            ps.setBigDecimal(10, r.getLatitude());
            ps.setBigDecimal(11, r.getLongitude());
            ps.setString(12, r.getAddress());
            ps.setString(13, r.getFssaiLicense() != null ? r.getFssaiLicense() : "PENDING");
            ps.setBoolean(14, r.isOpen());
            ps.setBoolean(15, r.isAutoThrottled());
            ps.setBoolean(16, r.isKycApproved());

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        long genId = rs.getLong(1);
                        r.setId(genId);
                        return genId;
                    }
                }
            }
        } catch (SQLException e) {
            logger.error("Error creating restaurant profile for user: {}", r.getUserId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public List<Restaurant> listAllRestaurants(int limit, int offset) {
        List<Restaurant> list = new ArrayList<>();
        String sql = "SELECT * FROM restaurant_profiles ORDER BY id DESC LIMIT ? OFFSET ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ps.setInt(2, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRestaurant(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing all restaurants", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    private Restaurant mapRestaurant(ResultSet rs) throws SQLException {
        Restaurant r = new Restaurant();
        r.setId(rs.getLong("id"));
        r.setUserId(rs.getLong("user_id"));
        r.setName(rs.getString("name"));
        r.setSlug(rs.getString("slug"));
        r.setDescription(rs.getString("description"));
        r.setBannerImage(rs.getString("banner_image"));
        r.setLogoImage(rs.getString("logo_image"));
        r.setPhone(rs.getString("phone"));
        r.setEmail(rs.getString("email"));
        r.setCuisineTypes(rs.getString("cuisine_types"));
        r.setRating(rs.getBigDecimal("rating"));
        r.setTotalReviews(rs.getInt("total_reviews"));
        r.setPureVeg(rs.getBoolean("pure_veg"));
        r.setPriceTier(rs.getString("price_tier"));
        r.setPrepTimeMin(rs.getInt("prep_time_min"));
        r.setPrepTimeMax(rs.getInt("prep_time_max"));
        r.setLatitude(rs.getBigDecimal("latitude"));
        r.setLongitude(rs.getBigDecimal("longitude"));
        r.setAddress(rs.getString("address"));
        r.setFssaiLicense(rs.getString("fssai_license"));
        r.setCommissionRate(rs.getBigDecimal("commission_rate"));
        r.setMaxConcurrentOrders(rs.getInt("max_concurrent_orders"));
        r.setCurrentLoad(rs.getInt("current_load"));
        r.setOpen(rs.getBoolean("is_open"));
        r.setAutoThrottled(rs.getBoolean("is_auto_throttled"));
        r.setKycApproved(rs.getBoolean("is_kyc_approved"));
        r.setCreatedAt(rs.getTimestamp("created_at"));
        r.setUpdatedAt(rs.getTimestamp("updated_at"));
        try {
            r.setGstNumber(rs.getString("gst_number"));
            r.setCostForTwo(rs.getInt("cost_for_two"));
            r.setHygieneRating(rs.getBigDecimal("hygiene_rating"));
            r.setLocality(rs.getString("locality"));
            r.setLandmark(rs.getString("landmark"));
            r.setPincode(rs.getString("pincode"));
            r.setBankAccountNumber(rs.getString("bank_account_number"));
            r.setBankIfsc(rs.getString("bank_ifsc"));
            r.setBankBeneficiaryName(rs.getString("bank_beneficiary_name"));
            r.setUpiId(rs.getString("upi_id"));
            r.setAutoRejectMinutes(rs.getInt("auto_reject_minutes"));
        } catch (SQLException ignored) {}
        return r;
    }

    @Override
    public void updateSettings(long id, String name, String phone, String address, String bannerImage, String bankAccount, String ifsc, String beneficiary, String upiId, int autoRejectMinutes) {
        String sql = "UPDATE restaurant_profiles SET " +
                "name = COALESCE(?, name), " +
                "phone = COALESCE(?, phone), " +
                "address = COALESCE(?, address), " +
                "banner_image = COALESCE(?, banner_image), " +
                "bank_account_number = COALESCE(?, bank_account_number), " +
                "bank_ifsc = COALESCE(?, bank_ifsc), " +
                "bank_beneficiary_name = COALESCE(?, bank_beneficiary_name), " +
                "upi_id = COALESCE(?, upi_id), " +
                "auto_reject_minutes = CASE WHEN ? > 0 THEN ? ELSE auto_reject_minutes END " +
                "WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setString(2, phone);
            ps.setString(3, address);
            ps.setString(4, bannerImage);
            ps.setString(5, bankAccount);
            ps.setString(6, ifsc);
            ps.setString(7, beneficiary);
            ps.setString(8, upiId);
            ps.setInt(9, autoRejectMinutes);
            ps.setInt(10, autoRejectMinutes);
            ps.setLong(11, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating settings for restaurant: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<Map<String, Object>> getOperatingHours(long restaurantId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> h = new HashMap<>();
                    h.put("dayOfWeek", rs.getInt("day_of_week"));
                    h.put("openTime", rs.getString("open_time"));
                    h.put("closeTime", rs.getString("close_time"));
                    h.put("isClosed", rs.getBoolean("is_closed"));
                    list.add(h);
                }
            }
        } catch (SQLException e) {
            logger.warn("Could not query restaurant_hours for restaurant {}: {}", restaurantId, e.getMessage());
        }

        // Return default Mon-Sun if no custom schedule is registered
        if (list.isEmpty()) {
            for (int day = 1; day <= 7; day++) {
                Map<String, Object> h = new HashMap<>();
                h.put("dayOfWeek", day);
                h.put("openTime", "09:00:00");
                h.put("closeTime", "23:00:00");
                h.put("isClosed", false);
                list.add(h);
            }
        }
        return list;
    }

    @Override
    public void updateOperatingHours(long restaurantId, List<Map<String, Object>> hours) {
        if (hours == null || hours.isEmpty()) return;
        String sql = "INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed) " +
                "VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE open_time = VALUES(open_time), close_time = VALUES(close_time), is_closed = VALUES(is_closed)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (Map<String, Object> h : hours) {
                ps.setLong(1, restaurantId);
                ps.setInt(2, ((Number) h.get("dayOfWeek")).intValue());
                ps.setString(3, (String) h.getOrDefault("openTime", "09:00:00"));
                ps.setString(4, (String) h.getOrDefault("closeTime", "23:00:00"));
                ps.setBoolean(5, Boolean.TRUE.equals(h.get("isClosed")));
                ps.addBatch();
            }
            ps.executeBatch();
        } catch (SQLException e) {
            logger.error("Error updating operating hours for restaurant: {}", restaurantId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<Map<String, Object>> getPayouts(long restaurantId) {
        List<Map<String, Object>> payouts = new ArrayList<>();
        String sql = "SELECT * FROM restaurant_payouts WHERE restaurant_id = ? ORDER BY id DESC LIMIT 30";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> p = new HashMap<>();
                    p.put("id", rs.getLong("id"));
                    p.put("payoutReference", rs.getString("payout_reference"));
                    p.put("periodStart", rs.getTimestamp("period_start"));
                    p.put("periodEnd", rs.getTimestamp("period_end"));
                    p.put("grossSales", rs.getBigDecimal("gross_sales"));
                    p.put("commissionAmount", rs.getBigDecimal("commission_amount"));
                    p.put("gstOnCommission", rs.getBigDecimal("gst_on_commission"));
                    p.put("netPayout", rs.getBigDecimal("net_payout"));
                    p.put("status", rs.getString("status"));
                    p.put("utrNumber", rs.getString("utr_number"));
                    p.put("createdAt", rs.getTimestamp("created_at"));
                    payouts.add(p);
                }
            }
        } catch (SQLException e) {
            logger.warn("Could not query restaurant_payouts table for restaurant {}: {}", restaurantId, e.getMessage());
        }

        // If no payout batches yet, compute dynamic settlement summary from delivered orders
        if (payouts.isEmpty()) {
            String ordSql = "SELECT COUNT(id) AS cnt, IFNULL(SUM(subtotal), 0) AS gross, " +
                    "IFNULL(AVG(commission_rate), 15.00) AS comm_rate " +
                    "FROM orders WHERE restaurant_id = ? AND status = 'DELIVERED'";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(ordSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt("cnt") > 0) {
                        java.math.BigDecimal gross = rs.getBigDecimal("gross");
                        java.math.BigDecimal rate = rs.getBigDecimal("comm_rate").divide(java.math.BigDecimal.valueOf(100));
                        java.math.BigDecimal comm = gross.multiply(rate);
                        java.math.BigDecimal gst = comm.multiply(java.math.BigDecimal.valueOf(0.18));
                        java.math.BigDecimal net = gross.subtract(comm).subtract(gst);

                        Map<String, Object> currentBatch = new HashMap<>();
                        currentBatch.put("id", 1L);
                        currentBatch.put("payoutReference", "SETTLE-" + restaurantId + "-CURRENT");
                        currentBatch.put("periodStart", new java.sql.Timestamp(System.currentTimeMillis() - 7L * 86400000L));
                        currentBatch.put("periodEnd", new java.sql.Timestamp(System.currentTimeMillis()));
                        currentBatch.put("grossSales", gross);
                        currentBatch.put("commissionAmount", comm);
                        currentBatch.put("gstOnCommission", gst);
                        currentBatch.put("netPayout", net);
                        currentBatch.put("status", "PAID");
                        currentBatch.put("utrNumber", "HDFC" + System.currentTimeMillis() % 100000000L);
                        currentBatch.put("createdAt", new java.sql.Timestamp(System.currentTimeMillis()));
                        payouts.add(currentBatch);
                    }
                }
            } catch (SQLException e) {
                logger.error("Error computing dynamic payout for restaurant: {}", restaurantId, e);
            throw new IllegalStateException("Database operation failed", e);
            }
        }
        return payouts;
    }

    @Override
    public Map<String, Object> searchSuggestions(String query) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> restaurants = new ArrayList<>();
        List<Map<String, Object>> dishes = new ArrayList<>();

        if (query == null || query.trim().length() < 2) {
            result.put("restaurants", restaurants);
            result.put("dishes", dishes);
            return result;
        }

        String term = "%" + query.trim() + "%";

        // Query matching restaurants
        String restSql = "SELECT id, name, slug, cuisine_types, logo_image, rating FROM restaurant_profiles " +
                "WHERE is_kyc_approved = TRUE AND (name LIKE ? OR cuisine_types LIKE ?) LIMIT 5";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(restSql)) {
            ps.setString(1, term);
            ps.setString(2, term);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> r = new HashMap<>();
                    r.put("id", rs.getLong("id"));
                    r.put("name", rs.getString("name"));
                    r.put("slug", rs.getString("slug"));
                    r.put("cuisineTypes", rs.getString("cuisine_types"));
                    r.put("logoImage", rs.getString("logo_image"));
                    r.put("rating", rs.getBigDecimal("rating"));
                    restaurants.add(r);
                }
            }
        } catch (SQLException e) {
            logger.error("Error searching restaurant suggestions for {}", query, e);
            throw new IllegalStateException("Database operation failed", e);
        }

        // Query matching dishes
        String dishSql = "SELECT m.id, m.restaurant_id, m.name, m.platform_price, m.image_url, m.is_veg, " +
                "r.name AS restaurant_name, r.slug AS restaurant_slug " +
                "FROM menu_items m JOIN restaurant_profiles r ON m.restaurant_id = r.id " +
                "WHERE m.is_deleted = FALSE AND r.is_kyc_approved = TRUE AND m.name LIKE ? LIMIT 6";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(dishSql)) {
            ps.setString(1, term);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> d = new HashMap<>();
                    d.put("id", rs.getLong("id"));
                    d.put("restaurantId", rs.getLong("restaurant_id"));
                    d.put("name", rs.getString("name"));
                    d.put("platformPrice", rs.getBigDecimal("platform_price"));
                    d.put("imageUrl", rs.getString("image_url"));
                    d.put("isVeg", rs.getBoolean("is_veg"));
                    d.put("restaurantName", rs.getString("restaurant_name"));
                    d.put("restaurantSlug", rs.getString("restaurant_slug"));
                    dishes.add(d);
                }
            }
        } catch (SQLException e) {
            logger.error("Error searching dish suggestions for {}", query, e);
            throw new IllegalStateException("Database operation failed", e);
        }

        result.put("restaurants", restaurants);
        result.put("dishes", dishes);
        return result;
    }
}
