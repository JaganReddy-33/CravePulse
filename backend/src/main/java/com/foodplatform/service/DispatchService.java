package com.foodplatform.service;

import com.foodplatform.config.AppProperties;
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
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class DispatchService {

    private static final Logger logger = LoggerFactory.getLogger(DispatchService.class);

    private static final ScheduledExecutorService dispatchScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "CravePulse-Dispatch-Worker");
        t.setDaemon(true);
        return t;
    });

    private static final AtomicBoolean workerStarted = new AtomicBoolean(false);
    private static DispatchService defaultInstance;

    private final OrderDao orderDao;
    private final RestaurantDao restaurantDao;
    private final RiderDao riderDao;
    private final UserDao userDao;
    private final WalletDao walletDao;
    private final NotificationService notificationService;
    private final RealtimeSessionRegistry registry;

    public DispatchService() {
        this(new OrderDaoImpl(), new RestaurantDaoImpl(), new RiderDaoImpl(), new UserDaoImpl(), new WalletDaoImpl(),
                new NotificationService(), RealtimeSessionRegistry.getInstance());
    }

    public DispatchService(OrderDao orderDao, RestaurantDao restaurantDao, RiderDao riderDao, UserDao userDao,
                           WalletDao walletDao, RealtimeSessionRegistry registry) {
        this(orderDao, restaurantDao, riderDao, userDao, walletDao, new NotificationService(), registry);
    }

    public DispatchService(OrderDao orderDao, RestaurantDao restaurantDao, RiderDao riderDao, UserDao userDao,
                           WalletDao walletDao, NotificationService notificationService, RealtimeSessionRegistry registry) {
        this.orderDao = orderDao;
        this.restaurantDao = restaurantDao;
        this.riderDao = riderDao;
        this.userDao = userDao;
        this.walletDao = walletDao;
        this.notificationService = notificationService;
        this.registry = registry;
    }

    public static synchronized void startDispatchWorker() {
        if (defaultInstance == null) {
            defaultInstance = new DispatchService();
        }
        if (workerStarted.compareAndSet(false, true)) {
            logger.info("Starting Single Scheduled Dispatch Executor (30s SLA, progressive radius)...");
            dispatchScheduler.scheduleWithFixedDelay(() -> {
                try {
                    defaultInstance.runDispatchCycle();
                } catch (Throwable t) {
                    logger.error("Unexpected error in dispatch background cycle", t);
                }
            }, 3, 5, TimeUnit.SECONDS);
        }
    }

    public void runDispatchCycle() {
        // 1. Scan and process timed-out offers
        int timeoutSeconds = AppProperties.getRiderAcceptTimeoutSeconds();
        List<DeliveryDispatch> timedOut = riderDao.getTimedOutOffers(timeoutSeconds);
        for (DeliveryDispatch d : timedOut) {
            try (Connection conn = DatabaseConfig.getConnection()) {
                riderDao.updateDispatchStatus(conn, d.getId(), "TIMED_OUT", "Rider accept SLA window expired (" + timeoutSeconds + "s)");
                logger.info("Offer {} for order {} timed out after {}s", d.getId(), d.getOrderId(), timeoutSeconds);
            } catch (SQLException e) {
                logger.error("Error timing out dispatch offer {}", d.getId(), e);
            }
            if (registry != null) {
                registry.broadcastToRider(d.getRiderId(), "rider_offer_timed_out", Map.of(
                        "dispatchId", d.getId(),
                        "orderId", d.getOrderId()
                ));
            }
            // Trigger progressive retry for the timed-out order
            dispatchOrder(d.getOrderId());
        }

        // 2. Scan unassigned active orders needing riders
        List<Order> unassignedOrders = orderDao.findUnassignedOrders(15);
        for (Order o : unassignedOrders) {
            dispatchOrder(o.getId());
        }
    }

        public void scheduleDispatch(long orderId, long delayMillis) {
        dispatchScheduler.schedule(() -> {
            try {
                dispatchOrder(orderId);
            } catch (Exception e) {
                logger.error("Auto dispatch background task failed for order {}", orderId, e);
            }
        }, delayMillis, TimeUnit.MILLISECONDS);
    }

    public boolean dispatchOrder(long orderId) {
        Order order = orderDao.findById(orderId);
        if (order == null || order.getRiderId() != null) {
            return false;
        }

        if ("CANCELLED".equals(order.getStatus()) || "DELIVERED".equals(order.getStatus()) || "REJECTED".equals(order.getStatus())) {
            return false;
        }

        Restaurant restaurant = restaurantDao.findById(order.getRestaurantId());
        if (restaurant == null || restaurant.getLatitude() == null || restaurant.getLongitude() == null) {
            return false;
        }

        double restLat = restaurant.getLatitude().doubleValue();
        double restLng = restaurant.getLongitude().doubleValue();

        // 1. Skip riders who already declined or timed out for this order
        List<Long> excludedRiders = riderDao.getExcludedRiderIdsForOrder(orderId);
        int attempts = excludedRiders.size();

        // 2. Progressive radius expansion: 3.0km -> 6.0km -> 10.0km -> 15.0km
        double maxRadius = AppProperties.getDispatchMaxSearchRadiusKm();
        double searchRadius;
        if (attempts == 0) {
            searchRadius = 3.5;
        } else if (attempts == 1) {
            searchRadius = 6.5;
        } else if (attempts == 2) {
            searchRadius = 10.0;
        } else {
            searchRadius = maxRadius;
        }

        List<RiderProfile> candidates = riderDao.findNearestAvailableRidersExcluding(restLat, restLng, searchRadius, 5, excludedRiders);
        if (candidates.isEmpty() && searchRadius < maxRadius) {
            // Instant fallback expansion to max radius if no nearby riders exist
            searchRadius = maxRadius;
            candidates = riderDao.findNearestAvailableRidersExcluding(restLat, restLng, maxRadius, 5, excludedRiders);
        }

        if (candidates.isEmpty()) {
            logger.warn("No available riders found for order {} within {} km (attempt #{})", orderId, searchRadius, attempts + 1);
            if (attempts >= 3) {
                // Escalate to admin SLA breach
                notificationService.sendNotification(1L, "DISPATCH SLA ESCALATION",
                        "Order #" + order.getOrderNumber() + " has no available riders within " + maxRadius + " km after " + attempts + " attempts.",
                        "DISPATCH_ESCALATION", String.valueOf(orderId));
                if (registry != null) {
                    registry.broadcastToAdmin("dispatch_sla_breach", Map.of(
                            "orderId", orderId,
                            "orderNumber", order.getOrderNumber(),
                            "attempts", attempts,
                            "searchRadiusKm", maxRadius,
                            "message", "No available fleet partner found within SLA"
                    ));
                }
            }
            return false;
        }

        // Pick top candidate
        RiderProfile chosenRider = candidates.get(0);

        // 3. Upfront Fair-Pay calculation with 100% tip pass-through
        double deliveryDistance = order.getDeliveryLat() != null && order.getRestaurantLat() != null ?
                PricingService.calculateHaversineDistance(order.getRestaurantLat(), order.getRestaurantLng(), order.getDeliveryLat(), order.getDeliveryLng()) : 2.5;

        BigDecimal basePay = AppProperties.getFairPayBaseFare();
        BigDecimal distancePay = BigDecimal.valueOf(Math.max(0.0, deliveryDistance - 1.5))
                .multiply(AppProperties.getFairPayPerKmRate())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal surgePay = BigDecimal.ZERO;
        BigDecimal tip = order.getTipAmount() != null ? order.getTipAmount() : BigDecimal.ZERO;
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

                // 4. Real-Time alert to rider
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
                offerPayload.put("tipAmount", tip);
                offerPayload.put("totalEarning", totalEarning);
                offerPayload.put("paymentMode", order.getPaymentMode());
                offerPayload.put("totalAmount", order.getTotalAmount());
                offerPayload.put("expiresInSeconds", AppProperties.getRiderAcceptTimeoutSeconds());

                if (registry != null) {
                    registry.broadcastToRider(chosenRider.getId(), "rider_job_offer", offerPayload);
                }
                logger.info("Offered order {} to rider {} with payout ₹{} (Tip: ₹{}, Radius: {}km)",
                        orderId, chosenRider.getId(), totalEarning, tip, searchRadius);
                return true;
            } catch (SQLException | RuntimeException e) {
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
                    riderDao.updateDispatchStatus(conn, dispatchId, "TIMED_OUT", "Order already assigned to another partner");
                    conn.commit();
                    return false;
                }

                // Accept offer
                riderDao.updateDispatchStatus(conn, dispatchId, "ACCEPTED", null);
                orderDao.assignRiderToOrder(conn, order.getId(), riderId);
                riderDao.updateRiderAvailability(conn, riderId, false, order.getId());

                // Record event
                OrderEvent event = new OrderEvent();
                event.setOrderId(order.getId());
                event.setPreviousStatus(order.getStatus());
                event.setNewStatus(order.getStatus());
                event.setTriggeredByUserId(riderDao.findById(riderId).getUserId());
                event.setReason("Fleet partner assigned to delivery");
                orderDao.recordOrderEvent(conn, event);

                conn.commit();

                // Broadcast assignment
                Order updated = orderDao.findById(order.getId());
                if (registry != null) {
                    registry.broadcastToOrder(order.getId(), "rider_assigned", Map.of(
                            "orderId", order.getId(),
                            "riderId", riderId,
                            "riderName", updated.getRiderName() != null ? updated.getRiderName() : "Delivery Partner",
                            "riderPhone", updated.getRiderPhone() != null ? updated.getRiderPhone() : ""
                    ));
                }
                return true;
            } catch (SQLException | RuntimeException e) {
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

                // Fair-Pay Protocol: Zero penalty for rejection!
                riderDao.updateDispatchStatus(conn, dispatchId, "REJECTED", reason != null ? reason : "Personal Emergency / Distance");
                conn.commit();

                // Immediately trigger re-dispatch to next candidate
                dispatchOrder(dispatch.getOrderId());
                return true;
            } catch (SQLException | RuntimeException e) {
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
        BigDecimal calculatedCompensation = BigDecimal.valueOf(billableMinutes * 2.00);
        BigDecimal maxCap = BigDecimal.valueOf(100.00);
        return calculatedCompensation.min(maxCap);
    }

    public BigDecimal claimWaitTimeCompensation(long dispatchId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                DeliveryDispatch d = riderDao.findDispatchOfferWithLock(conn, dispatchId);
                if (d == null) {
                    conn.rollback();
                    return BigDecimal.ZERO;
                }

                if (Boolean.TRUE.equals(d.getWaitCompensationClaimed())) {
                    conn.rollback();
                    throw new IllegalStateException("Wait time compensation has already been claimed for this trip.");
                }

                Timestamp arrivedAt = d.getArrivedAtRestaurantAt();
                if (arrivedAt == null) {
                    conn.rollback();
                    throw new IllegalStateException("Rider has not marked arrival at kitchen yet.");
                }

                // Compute wait time purely from server timestamps
                Timestamp endTimestamp = d.getPickedUpAt() != null ? d.getPickedUpAt() : Timestamp.from(Instant.now());
                long diffMillis = Math.max(0L, endTimestamp.getTime() - arrivedAt.getTime());
                int waitMinutes = (int) (diffMillis / (1000 * 60));

                if (waitMinutes <= 8) {
                    conn.rollback();
                    return BigDecimal.ZERO; // Under 8 min grace period
                }

                int billableMinutes = waitMinutes - 8;
                BigDecimal calculatedCompensation = BigDecimal.valueOf(billableMinutes * 2.00); // ₹2 per minute
                BigDecimal maxCap = BigDecimal.valueOf(100.00); // Capped at ₹100 per order
                BigDecimal compensation = calculatedCompensation.min(maxCap);

                riderDao.updateWaitTimeCompensation(conn, dispatchId, waitMinutes, compensation);

                RiderProfile rider = riderDao.findById(d.getRiderId());
                if (rider != null) {
                    User user = userDao.findByIdWithLock(conn, rider.getUserId());
                    if (user != null) {
                        BigDecimal newBal = (user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO).add(compensation);
                        userDao.updateWalletBalance(conn, user.getId(), newBal);

                        WalletTransaction tx = new WalletTransaction();
                        tx.setUserId(user.getId());
                        tx.setAmount(compensation);
                        tx.setTransactionType("CREDIT");
                        tx.setReason("Kitchen Wait Compensation (Server Verified: " + waitMinutes + "m, 8m grace deducted, capped ₹100)");
                        tx.setReferenceOrderId(d.getOrderId());
                        tx.setBalanceAfter(newBal);
                        walletDao.recordTransaction(conn, tx);
                    }
                }

                conn.commit();
                logger.info("Credited verified ₹{} wait-time compensation to rider {} for dispatch {}", compensation, d.getRiderId(), dispatchId);
                return compensation;
            } catch (SQLException | RuntimeException e) {
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

    public boolean updateDispatchMilestone(long orderId, long riderId, String milestone) {
        String column;
        switch (milestone) {
            case "ARRIVED_AT_RESTAURANT" -> column = "arrived_at_restaurant_at";
            case "PICKED_UP" -> column = "picked_up_at";
            case "ARRIVED_AT_CUSTOMER" -> column = "arrived_at_customer_at";
            default -> {
                return false;
            }
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                DeliveryDispatch dispatch = riderDao.findDispatchByOrderId(orderId);
                if (dispatch == null || !dispatch.getRiderId().equals(riderId)) {
                    conn.rollback();
                    return false;
                }

                riderDao.recordRiderMilestoneTimestamp(conn, dispatch.getId(), column);

                if ("PICKED_UP".equals(milestone)) {
                    Order current=orderDao.findWithLock(conn,orderId);
                    if(current==null || !"READY".equals(current.getStatus())) { conn.rollback();return false; }
                    orderDao.updateOrderStatus(conn, orderId, "PICKED_UP", null);
                    OrderEvent event = new OrderEvent();
                    event.setOrderId(orderId);
                    event.setPreviousStatus("PREPARING");
                    event.setNewStatus("PICKED_UP");
                    event.setTriggeredByUserId(riderDao.findById(riderId).getUserId());
                    event.setReason("Fleet partner picked up package from restaurant");
                    orderDao.recordOrderEvent(conn, event);
                }

                conn.commit();

                if (registry != null) {
                    registry.broadcastToOrder(orderId, "order_status_updated", Map.of(
                            "orderId", orderId,
                            "status", "PICKED_UP".equals(milestone) ? "PICKED_UP" : milestone,
                            "milestone", milestone
                    ));
                }
                return true;
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                logger.error("Error updating milestone {} for order {}", milestone, orderId, e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error", e);
        }
        return false;
    }

    public boolean completeDelivery(long orderId, long riderId, String submittedOtp) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                DeliveryDispatch dispatch = riderDao.findDispatchByOrderId(orderId);
                if (dispatch == null || !dispatch.getRiderId().equals(riderId)) {
                    conn.rollback();
                    throw new IllegalArgumentException("No active dispatch found for rider and order");
                }

                Order order = orderDao.findWithLock(conn, orderId);
                if (order == null || !"PICKED_UP".equals(order.getStatus())) {
                    conn.rollback();
                    throw new IllegalStateException("Order is not in deliverable state");
                }

                // Verify 4-digit Delivery OTP
                if (order.getDeliveryOtp() != null && !order.getDeliveryOtp().isBlank()) {
                    if (submittedOtp == null || !order.getDeliveryOtp().trim().equals(submittedOtp.trim())) {
                        conn.rollback();
                        throw new IllegalArgumentException("Invalid 4-digit Delivery PIN. Please confirm with customer.");
                    }
                }

                Timestamp now = Timestamp.from(Instant.now());
                riderDao.recordRiderMilestoneTimestamp(conn, dispatch.getId(), "delivered_at");
                orderDao.updateOrderStatus(conn, orderId, "DELIVERED", now);
                riderDao.updateDispatchStatus(conn, dispatch.getId(), "DELIVERED", "Delivery successfully completed with PIN verification");

                // Record event
                OrderEvent event = new OrderEvent();
                event.setOrderId(orderId);
                event.setPreviousStatus(order.getStatus());
                event.setNewStatus("DELIVERED");
                event.setTriggeredByUserId(riderDao.findById(riderId).getUserId());
                event.setReason("Order handoff verified with customer 4-digit PIN");
                orderDao.recordOrderEvent(conn, event);

                // Credit Rider Earnings (Base + Distance + Surge + 100% Tip)
                RiderProfile rider = riderDao.findById(riderId);
                if (rider != null) {
                    User user = userDao.findByIdWithLock(conn, rider.getUserId());
                    if (user != null) {
                        BigDecimal payout = dispatch.getTotalEarning() != null ? dispatch.getTotalEarning() : BigDecimal.valueOf(35.00);
                        BigDecimal newBal = (user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO).add(payout);
                        userDao.updateWalletBalance(conn, user.getId(), newBal);

                        WalletTransaction tx = new WalletTransaction();
                        tx.setUserId(user.getId());
                        tx.setAmount(payout);
                        tx.setTransactionType("CREDIT");
                        tx.setReason("Trip Payout for Order #" + order.getOrderNumber() + " (Incl. ₹" + dispatch.getTipAmount() + " tip)");
                        tx.setReferenceOrderId(order.getId());
                        tx.setBalanceAfter(newBal);
                        walletDao.recordTransaction(conn, tx);
                    }

                    // Handle COD settlement collection
                    if ("COD".equalsIgnoreCase(order.getPaymentMode())) {
                        riderDao.recordCodCollection(conn, riderId, orderId, order.getTotalAmount());
                    }

                    // Release rider availability
                    riderDao.updateRiderAvailability(conn, riderId, true, null);
                }

                conn.commit();

                if (registry != null) {
                    registry.broadcastToOrder(orderId, "order_status_updated", Map.of(
                            "orderId", orderId,
                            "status", "DELIVERED",
                            "orderNumber", order.getOrderNumber()
                    ));
                }
                logger.info("Order {} successfully marked DELIVERED by rider {}", orderId, riderId);
                return true;
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                logger.error("Error completing delivery for order {}", orderId, e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error", e);
        }
        return false;
    }
}
