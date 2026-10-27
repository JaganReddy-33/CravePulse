package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.ReviewDao;
import com.foodplatform.model.Review;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ReviewDaoImpl implements ReviewDao {

    private static final Logger logger = LoggerFactory.getLogger(ReviewDaoImpl.class);

    @Override
    public Long createReview(Review review) {
        String insertSql = "INSERT INTO reviews (order_id, customer_id, restaurant_id, rider_id, food_rating, packaging_rating, delivery_rating, review_text) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        String updateRestRatingSql = "UPDATE restaurant_profiles SET " +
                "rating = (SELECT ROUND(AVG(food_rating), 1) FROM reviews WHERE restaurant_id = ?), " +
                "total_reviews = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = ?) " +
                "WHERE id = ?";

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                long reviewId = 0;
                try (PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setLong(1, review.getOrderId());
                    ps.setLong(2, review.getCustomerId());
                    ps.setLong(3, review.getRestaurantId());
                    if (review.getRiderId() != null) ps.setLong(4, review.getRiderId());
                    else ps.setNull(4, Types.BIGINT);
                    ps.setInt(5, review.getFoodRating());
                    ps.setInt(6, review.getPackagingRating());
                    ps.setInt(7, review.getDeliveryRating());
                    ps.setString(8, review.getReviewText());
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            reviewId = rs.getLong(1);
                            review.setId(reviewId);
                        }
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(updateRestRatingSql)) {
                    ps.setLong(1, review.getRestaurantId());
                    ps.setLong(2, review.getRestaurantId());
                    ps.setLong(3, review.getRestaurantId());
                    ps.executeUpdate();
                }

                conn.commit();
                return reviewId;
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error creating review for order: {}", review.getOrderId(), e);
        }
        return null;
    }

    @Override
    public Review findByOrderId(long orderId) {
        String sql = "SELECT rw.*, u.full_name AS cust_name, u.avatar_url AS cust_avatar, r.name AS rest_name " +
                "FROM reviews rw " +
                "JOIN users u ON rw.customer_id = u.id " +
                "JOIN restaurant_profiles r ON rw.restaurant_id = r.id " +
                "WHERE rw.order_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapReview(rs);
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding review for order: {}", orderId, e);
        }
        return null;
    }

    @Override
    public List<Review> listRestaurantReviews(long restaurantId, int limit, int offset) {
        List<Review> list = new ArrayList<>();
        String sql = "SELECT rw.*, u.full_name AS cust_name, u.avatar_url AS cust_avatar, r.name AS rest_name " +
                "FROM reviews rw " +
                "JOIN users u ON rw.customer_id = u.id " +
                "JOIN restaurant_profiles r ON rw.restaurant_id = r.id " +
                "WHERE rw.restaurant_id = ? ORDER BY rw.id DESC LIMIT ? OFFSET ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapReview(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing reviews for restaurant: {}", restaurantId, e);
        }
        return list;
    }

    @Override
    public void replyToReview(long reviewId, String replyText) {
        String sql = "UPDATE reviews SET reply_text = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, replyText);
            ps.setLong(2, reviewId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error replying to review: {}", reviewId, e);
        }
    }

    private Review mapReview(ResultSet rs) throws SQLException {
        Review rw = new Review();
        rw.setId(rs.getLong("id"));
        rw.setOrderId(rs.getLong("order_id"));
        rw.setCustomerId(rs.getLong("customer_id"));
        rw.setRestaurantId(rs.getLong("restaurant_id"));
        long riderId = rs.getLong("rider_id");
        if (!rs.wasNull()) rw.setRiderId(riderId);
        rw.setFoodRating(rs.getInt("food_rating"));
        rw.setPackagingRating(rs.getInt("packaging_rating"));
        rw.setDeliveryRating(rs.getInt("delivery_rating"));
        rw.setReviewText(rs.getString("review_text"));
        rw.setReplyText(rs.getString("reply_text"));
        rw.setCreatedAt(rs.getTimestamp("created_at"));

        rw.setCustomerName(rs.getString("cust_name"));
        rw.setCustomerAvatar(rs.getString("cust_avatar"));
        rw.setRestaurantName(rs.getString("rest_name"));
        return rw;
    }
}
