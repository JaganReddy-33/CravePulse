package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.CouponDao;
import com.foodplatform.model.Coupon;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CouponDaoImpl implements CouponDao {

    private static final Logger logger = LoggerFactory.getLogger(CouponDaoImpl.class);

    @Override
    public List<Coupon> listAllCoupons() {
        List<Coupon> list = new ArrayList<>();
        String sql = "SELECT * FROM coupons ORDER BY id DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapCoupon(rs));
            }
        } catch (SQLException e) {
            logger.error("Error listing all coupons", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public List<Coupon> listActiveCoupons() {
        List<Coupon> list = new ArrayList<>();
        String sql = "SELECT * FROM coupons WHERE is_active = TRUE AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP) ORDER BY id DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapCoupon(rs));
            }
        } catch (SQLException e) {
            logger.error("Error listing active coupons", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public Coupon findById(long id) {
        String sql = "SELECT * FROM coupons WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCoupon(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding coupon by id: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public Coupon findByCode(String code) {
        String sql = "SELECT * FROM coupons WHERE code = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, code);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCoupon(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding coupon by code: {}", code, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public Long createCoupon(Coupon coupon) {
        String sql = "INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, " +
                "max_discount_amount, valid_from, valid_until, usage_limit, is_active, first_order_only) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, coupon.getCode().toUpperCase().trim());
            ps.setString(2, coupon.getDescription());
            ps.setString(3, coupon.getDiscountType() != null ? coupon.getDiscountType() : "PERCENTAGE");
            ps.setBigDecimal(4, coupon.getDiscountValue());
            ps.setBigDecimal(5, coupon.getMinOrderAmount());
            ps.setBigDecimal(6, coupon.getMaxDiscountAmount());
            ps.setTimestamp(7, coupon.getValidFrom());
            ps.setTimestamp(8, coupon.getValidUntil());
            ps.setInt(9, coupon.getUsageLimit() > 0 ? coupon.getUsageLimit() : 1000);
            ps.setBoolean(10, coupon.isActive());
            ps.setBoolean(11, coupon.isFirstOrderOnly());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    coupon.setId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            logger.error("Error creating coupon: {}", coupon.getCode(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void updateCoupon(Coupon coupon) {
        String sql = "UPDATE coupons SET description = ?, discount_type = ?, discount_value = ?, min_order_amount = ?, " +
                "max_discount_amount = ?, valid_until = ?, usage_limit = ?, is_active = ?, first_order_only = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, coupon.getDescription());
            ps.setString(2, coupon.getDiscountType());
            ps.setBigDecimal(3, coupon.getDiscountValue());
            ps.setBigDecimal(4, coupon.getMinOrderAmount());
            ps.setBigDecimal(5, coupon.getMaxDiscountAmount());
            ps.setTimestamp(6, coupon.getValidUntil());
            ps.setInt(7, coupon.getUsageLimit());
            ps.setBoolean(8, coupon.isActive());
            ps.setBoolean(9, coupon.isFirstOrderOnly());
            ps.setLong(10, coupon.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating coupon: {}", coupon.getId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void toggleCoupon(long id, boolean isActive) {
        String sql = "UPDATE coupons SET is_active = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, isActive);
            ps.setLong(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error toggling coupon status: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void deleteCoupon(long id) {
        String sql = "DELETE FROM coupons WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error deleting coupon: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    private Coupon mapCoupon(ResultSet rs) throws SQLException {
        Coupon c = new Coupon();
        c.setId(rs.getLong("id"));
        c.setCode(rs.getString("code"));
        c.setDescription(rs.getString("description"));
        c.setDiscountType(rs.getString("discount_type"));
        c.setDiscountValue(rs.getBigDecimal("discount_value"));
        c.setMinOrderAmount(rs.getBigDecimal("min_order_amount"));
        c.setMaxDiscountAmount(rs.getBigDecimal("max_discount_amount"));
        c.setValidFrom(rs.getTimestamp("valid_from"));
        c.setValidUntil(rs.getTimestamp("valid_until"));
        c.setUsageLimit(rs.getInt("usage_limit"));
        c.setTimesUsed(rs.getInt("times_used"));
        c.setActive(rs.getBoolean("is_active"));
        c.setCreatedAt(rs.getTimestamp("created_at"));
        try {
            c.setFirstOrderOnly(rs.getBoolean("first_order_only"));
        } catch (SQLException ignored) {}
        return c;
    }
}
