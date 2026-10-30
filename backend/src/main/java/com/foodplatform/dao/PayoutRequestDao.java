package com.foodplatform.dao;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface PayoutRequestDao {
    Map<String, Object> getRiderPayoutSummary(long userId);

    Map<String, Object> getRestaurantPayoutSummary(long restaurantId);

    Map<String, Object> createRiderRequest(long userId, BigDecimal amount, String payoutDestination);

    Map<String, Object> createRestaurantRequest(long userId, long restaurantId, BigDecimal amount, String payoutDestination);

    List<Map<String, Object>> listAdminRequests(String status);

    Map<String, Object> updateAdminRequest(long requestId, long adminId, String status, String paymentReference, String adminNote);
}
