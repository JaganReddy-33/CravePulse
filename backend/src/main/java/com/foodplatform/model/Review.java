package com.foodplatform.model;

import java.sql.Timestamp;

public class Review {
    private Long id;
    private Long orderId;
    private Long customerId;
    private Long restaurantId;
    private Long riderId;
    private int foodRating;
    private int packagingRating;
    private int deliveryRating;
    private String reviewText;
    private String replyText;
    private Timestamp createdAt;

    // Joined fields
    private String customerName;
    private String customerAvatar;
    private String restaurantName;

    public Review() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }

    public int getFoodRating() { return foodRating; }
    public void setFoodRating(int foodRating) { this.foodRating = foodRating; }

    public int getPackagingRating() { return packagingRating; }
    public void setPackagingRating(int packagingRating) { this.packagingRating = packagingRating; }

    public int getDeliveryRating() { return deliveryRating; }
    public void setDeliveryRating(int deliveryRating) { this.deliveryRating = deliveryRating; }

    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }

    public String getReplyText() { return replyText; }
    public void setReplyText(String replyText) { this.replyText = replyText; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerAvatar() { return customerAvatar; }
    public void setCustomerAvatar(String customerAvatar) { this.customerAvatar = customerAvatar; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
}
