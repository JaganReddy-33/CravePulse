package com.foodplatform.dao;

import com.foodplatform.model.Review;

import java.util.List;

public interface ReviewDao {

    Long createReview(Review review);

    Review findByOrderId(long orderId);

    Review findById(long reviewId);

    List<Review> listRestaurantReviews(long restaurantId, int limit, int offset);

    void replyToReview(long reviewId, String replyText);
}
