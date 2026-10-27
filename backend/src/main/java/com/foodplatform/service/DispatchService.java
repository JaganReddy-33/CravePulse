package com.foodplatform.service;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.*;
import com.foodplatform.model.*;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class DispatchService {

    private static final Logger logger = LoggerFactory.getLogger(DispatchService.class);

    private final OrderDao orderDao;
    private final RestaurantDao restaurantDao;
    private final RiderDao riderDao;
    private final UserDao userDao;
    private final WalletDao walletDao;
    private final RealtimeSessionRegistry registry;

    public DispatchService() {
        this(new OrderDaoImpl(), new RestaurantDaoImpl(), new RiderDaoImpl(), new UserDaoImpl(), new WalletDaoImpl(), RealtimeSessionRegistry.getInstance());
    }

    public DispatchService(OrderDao orderDao, RestaurantDao restaurantDao, RiderDao riderDao, UserDao userDao, WalletDao walletDao, RealtimeSessionRegistry registry) {
        this.orderDao = orderDao;
        this.restaurantDao = restaurantDao;
        this.riderDao = riderDao;
        this.userDao = userDao;
        this.walletDao = walletDao;
        this.registry = registry;
    }

    public boolean dispatchOrder(long orderId) {
        Order order = orderDao.findById(orderId);
        if (order == null || order.getRiderId() != null) {
            return false;
        }

        Restaurant restaurant = restaurantDao.findById(order.getRestaurantId());
        if (restaurant == null) {
            return false;
        }

        double restLat = restaurant.getLatitude().doubleValue();
        double restLng = restaurant.getLongitude().doubleValue();

        // 1. Search for nearest available riders within 10 km
        List<RiderProfile> candidates = riderDao.findNearestAvailableRiders(restLat, restLng, 10.0, 5);
        if (candidates.isEmpty()) {
            logger.warn("No available riders found for order {}", orderId);
            return false;
        }

        // Pick top candidate
        RiderProfile chosenRider = candidates.get(0);

        // 2. Upfront Fair-Pay calculation
        double deliveryDistance = order.getDeliveryLat() != null && order.getRestaurantLat() != null ?
                PricingService.calculateHaversineDistance(order.getRestaurantLat(), order.getRestaurantLng(), order.getDeliveryLat(), order.getDeliveryLng()) : 2.5;

        BigDecimal basePay = BigDecimal.valueOf(35.00);
        BigDecimal distancePay = BigDecimal.valueOf(Math.max(0.0, deliveryDistance - 1.5))
                .multiply(BigDecimal.valueOf(12.00))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal surgePay = BigDecimal.ZERO;
        BigDecimal tip = BigDecimal.ZERO;
        BigDecimal totalEarning = basePay.add(distancePay).add(surgePay).add(tip);

        DeliveryDispatch dispatch = new DeliveryDispatch();
        dispatch.setOrderId(orderId);
        dispatch.setRiderId(chosenRider.getId());
        dispatch.setBasePay(basePay);
        dispatch.setDistancePay(distancePay);
        dispatch.setSurgePay(surgePay);
        dispatch.setTipAmount(tip);
        dispatch.setTotalEarning(totalEarning);

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Long dispatchId = riderDao.createDispatchOffer(conn, dispatch);
                conn.commit();

                // 3. Real-Time WebSocket alert to rider
                Map<String, Object> offerPayload = new java.util.HashMap<>();
                offerPayload.put("dispatchId", dispatchId);
                offerPayload.put("orderId", orderId);
                offerPayload.put("orderNumber", order.getOrderNumber());
                offerPayload.put("restaurantName", restaurant.getName());
                offerPayload.put("restaurantAddress", restaurant.getAddress());
                offerPayload.put("customerAddress", order.getDeliveryAddressText() != null ? order.getDeliveryAddressText() : "");
                offerPayload.put("distanceKm", Math.round(deliveryDistance * 10.0) / 10.0);
                offerPayload.put("basePay", basePay);
                offerPayload.put("distancePay", distancePay);
                offerPayload.put("totalEarning", totalEarning);
                offerPayload.put("paymentMode", order.getPaymentMode());
                offerPayload.put("totalAmount", order.getTotalAmount());
                registry.broadcastToRider(chosenRider.getId(), "rider_job_offer", offerPayload);
                logger.info("Offered order {} to rider {} with payout ₹{}", orderId, chosenRider.getId(), totalEarning);
                return true;
            } catch (SQLException e) {
                conn.rollback();
                logger.error("Error creating dispatch offer for order {}", orderId, e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error in dispatch", e);
        }
        return false;
    }

    public boolean acceptDispatch(long dispatchId, long riderId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                DeliveryDispatch dispatch = riderDao.findDispatchOfferWithLock(conn, dispatchId);
                if (dispatch == null || !dispatch.getRiderId().equals(riderId) || !"OFFERED".equals(dispatch.getDispatchStatus())) {
                    conn.rollback();
                    return false;
                }

                Order order = orderDao.findWithLock(conn, dispatch.getOrderId());
                if (order == null || order.getRiderId() != null) {
                    riderDao.updateDispatchStatus(conn, dispatchId, "TIMED_OUT", "Order already taken or invalid");
                    conn.commit();
                    return false;
                }

                // Accept offer
                riderDao.updateDispatchStatus(conn, dispatchId, "ACCEPTED", null);
                orderDao.assignRiderToOrder(conn, order.getId(), riderId);
                riderDao.updateRiderAvailability(conn, riderId, false, order.getId());

                conn.commit();

                // Broadcast assignment
                Order updated = orderDao.findById(order.getId());
                registry.broadcastToOrder(order.getId(), "rider_assigned", Map.of(
                        "orderId", order.getId(),
                        "riderId", riderId,
                        "riderName", updated.getRiderName() != null ? updated.getRiderName() : "Delivery Partner",
                        "riderPhone", updated.getRiderPhone() != null ? updated.getRiderPhone() : ""
                ));
                return true;
            } catch (SQLException e) {
                conn.rollback();
                logger.error("Error accepting dispatch {}", dispatchId, e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error", e);
        }
        return false;
    }

    public boolean rejectDispatch(long dispatchId, long riderId, String reason) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                DeliveryDispatch dispatch = riderDao.findDispatchOfferWithLock(conn, dispatchId);
                if (dispatch == null || !dispatch.getRiderId().equals(riderId)) {
                    conn.rollback();
                    return false;
                }

                // Fair-Pay Protocol: No penalties for rejection!
                riderDao.updateDispatchStatus(conn, dispatchId, "REJECTED", reason != null ? reason : "Personal Emergency / Distance");
                conn.commit();

                // Re-dispatch to next candidate
                dispatchOrder(dispatch.getOrderId());
                return true;
            } catch (SQLException e) {
                conn.rollback();
                logger.error("Error rejecting dispatch {}", dispatchId, e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error", e);
        }
        return false;
    }

    public BigDecimal claimWaitTimeCompensation(long dispatchId, int waitMinutes) {
        if (waitMinutes <= 8) {
            return BigDecimal.ZERO;
        }

        int billableMinutes = waitMinutes - 8;
        BigDecimal compensation = BigDecimal.valueOf(billableMinutes * 2.00); // ₹2 per minute

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                DeliveryDispatch d = riderDao.findDispatchOfferWithLock(conn, dispatchId);
                if (d == null) {
                    conn.rollback();
                    return BigDecimal.ZERO;
                }

                riderDao.updateWaitTimeCompensation(conn, dispatchId, waitMinutes, compensation);

                RiderProfile rider = riderDao.findById(d.getRiderId());
                if (rider != null) {
                    User user = userDao.findById(rider.getUserId());
                    if (user != null) {
                        BigDecimal newBal = (user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO).add(compensation);
                        userDao.updateWalletBalance(conn, user.getId(), newBal);

                        WalletTransaction tx = new WalletTransaction();
                        tx.setUserId(user.getId());
                        tx.setAmount(compensation);
                        tx.setTransactionType("CREDIT");
                        tx.setReason("Restaurant Wait Compensation: " + billableMinutes + " mins at ₹2/min");
                        tx.setReferenceOrderId(d.getOrderId());
                        tx.setBalanceAfter(newBal);
                        walletDao.recordTransaction(conn, tx);
                    }
                }

                conn.commit();
                logger.info("Credited ₹{} wait-time compensation to rider {}", compensation, d.getRiderId());
                return compensation;
            } catch (SQLException e) {
                conn.rollback();
                logger.error("Error claiming wait-time compensation", e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error", e);
        }
        return BigDecimal.ZERO;
    }
}
