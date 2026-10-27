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
import java.util.List;

public class RestaurantDaoImpl implements RestaurantDao {

    private static final Logger logger = LoggerFactory.getLogger(RestaurantDaoImpl.class);

    @Override
    public List<Restaurant> listOpenRestaurants(Double userLat, Double userLng, String cuisine, String search, Boolean vegOnly, int limit, int offset) {
        List<Restaurant> list = new ArrayList<>();
        double lat = userLat != null ? userLat : 12.9715987;
        double lng = userLng != null ? userLng : 77.5945627;

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
            sb.append("AND (r.name LIKE ? OR r.description LIKE ? OR r.cuisine_types LIKE ?) ");
            String term = "%" + search.trim() + "%";
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
                    r.setDistanceKm(rs.getDouble("distance_km"));
                    list.add(r);
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing restaurants", e);
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
            ps.setString(5, r.getBannerImage() != null ? r.getBannerImage() : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800");
            ps.setString(6, r.getLogoImage() != null ? r.getLogoImage() : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200");
            ps.setString(7, r.getPhone());
            ps.setString(8, r.getEmail());
            ps.setString(9, r.getCuisineTypes() != null ? r.getCuisineTypes() : "Multi-Cuisine");
            ps.setBigDecimal(10, r.getLatitude() != null ? r.getLatitude() : java.math.BigDecimal.valueOf(12.9715987));
            ps.setBigDecimal(11, r.getLongitude() != null ? r.getLongitude() : java.math.BigDecimal.valueOf(77.5945627));
            ps.setString(12, r.getAddress() != null ? r.getAddress() : "Bengaluru");
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
        } catch (SQLException ignored) {}
        return r;
    }
}
