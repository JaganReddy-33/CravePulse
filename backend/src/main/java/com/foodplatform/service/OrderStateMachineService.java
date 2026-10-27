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
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.Set;

public class OrderStateMachineService {

    private static final Logger logger = LoggerFactory.getLogger(OrderStateMachineService.class);

    private final OrderDao orderDao;
    private final RestaurantDao restaurantDao;
    private final RiderDao riderDao;
    private final UserDao userDao;
    private final WalletDao walletDao;
    private final RealtimeSessionRegistry registry;

    private static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            "PLACED", Set.of("ACCEPTED", "CANCELLED", "REJECTED"),
            "ACCEPTED", Set.of("PREPARING", "CANCELLED"),
            "PREPARING", Set.of("READY", "CANCELLED"),
            "READY", Set.of("PICKED_UP", "CANCELLED"),
            "PICKED_UP", Set.of("DELIVERED"),
            "DELIVERED", Set.of("REFUNDED"),
            "CANCELLED", Set.of("REFUNDED"),
            "REJECTED", Set.of("REFUNDED")
    );

    public OrderStateMachineService() {
        this(new OrderDaoImpl(), new RestaurantDaoImpl(), new RiderDaoImpl(), new UserDaoImpl(), new WalletDaoImpl(), RealtimeSessionRegistry.getInstance());
    }

    public OrderStateMachineService(OrderDao orderDao, RestaurantDao restaurantDao, RiderDao riderDao, UserDao userDao, WalletDao walletDao, RealtimeSessionRegistry registry) {
        this.orderDao = orderDao;
        this.restaurantDao = restaurantDao;
        this.riderDao = riderDao;
        this.userDao = userDao;
        this.walletDao = walletDao;
        this.registry = registry;
    }

    public Order transition(long orderId, String targetStatus, Long triggeredByUserId, String reason, Double currentLat, Double currentLng) {
        return transition(orderId, targetStatus, triggeredByUserId, null, null, reason, currentLat, currentLng);
    }

    public Order transition(long orderId, String targetStatus, Long triggeredByUserId, String actorRole, String deliveryOtp, String reason, Double currentLat, Double currentLng) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Order updated = transition(conn, orderId, targetStatus, triggeredByUserId, actorRole, deliveryOtp, reason, currentLat, currentLng);
                conn.commit();
                return updated;
            } catch (SQLException e) {
                conn.rollback();
                logger.error("Failed transition for order: {} to {}", orderId, targetStatus, e);
                throw new RuntimeException("Order state transition failed: " + e.getMessage(), e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error during order transition", e);
        }
    }

    public Order transition(Connection conn, long orderId, String targetStatus, Long triggeredByUserId, String actorRole, String deliveryOtp, String reason, Double currentLat, Double currentLng) throws SQLException {
        String newStatus = targetStatus.toUpperCase().trim();

        // 1. Row-lock order
        Order order = orderDao.findWithLock(conn, orderId);
        if (order == null) {
            throw new IllegalArgumentException("Order not found: " + orderId);
        }

        String currentStatus = order.getStatus();
        if (currentStatus.equals(newStatus)) {
            return orderDao.findById(orderId);
        }

        // 2. Validate generic state machine transition
        Set<String> allowed = ALLOWED_TRANSITIONS.get(currentStatus);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new IllegalStateException("Illegal state transition from " + currentStatus + " to " + newStatus);
        }

        // 3. Resolve actor role if not explicitly provided
        if (actorRole == null && triggeredByUserId != null) {
            User actor = userDao.findById(triggeredByUserId);
            if (actor != null) {
                actorRole = actor.getRole();
            }
        }

        // 4. Enforce strict role-based authorization matrix on transitions
        if ("CUSTOMER".equalsIgnoreCase(actorRole)) {
            if (!"CANCELLED".equals(newStatus)) {
                throw new IllegalStateException("Customers are only permitted to cancel their orders.");
            }
            if (order.getCustomerId() == null || !order.getCustomerId().equals(triggeredByUserId)) {
                throw new IllegalStateException("Access forbidden: you do not own this order.");
            }
            if (!"PLACED".equals(currentStatus) && !"ACCEPTED".equals(currentStatus)) {
                throw new IllegalStateException("Order cannot be cancelled once food preparation has begun.");
            }
        } else if ("RESTAURANT_OWNER".equalsIgnoreCase(actorRole)) {
            Set<String> restaurantAllowed = Set.of("ACCEPTED", "REJECTED", "PREPARING", "READY");
            if (!restaurantAllowed.contains(newStatus)) {
                throw new IllegalStateException("Restaurant owners may only transition orders to ACCEPTED, REJECTED, PREPARING, or READY.");
            }
            Restaurant rest = restaurantDao.findByUserId(triggeredByUserId);
            if (rest == null || order.getRestaurantId() == null || !order.getRestaurantId().equals(rest.getId())) {
                throw new IllegalStateException("Access forbidden: you do not own the restaurant fulfilling this order.");
            }
        } else if ("RIDER".equalsIgnoreCase(actorRole)) {
            Set<String> riderAllowed = Set.of("PICKED_UP", "DELIVERED");
            if (!riderAllowed.contains(newStatus)) {
                throw new IllegalStateException("Delivery riders may only transition orders to PICKED_UP or DELIVERED.");
            }
            RiderProfile rider = riderDao.findByUserId(triggeredByUserId);
            if (rider == null || order.getRiderId() == null || !order.getRiderId().equals(rider.getId())) {
                throw new IllegalStateException("Access forbidden: you are not the assigned rider for this order.");
            }
            if ("DELIVERED".equals(newStatus)) {
                if (deliveryOtp == null || order.getDeliveryOtp() == null ||
                        !deliveryOtp.trim().equals(order.getDeliveryOtp().trim())) {
                    throw new IllegalArgumentException("Invalid delivery OTP. Please verify the 4-digit OTP provided by the customer.");
                }
            }
        } else if (!"ADMIN".equalsIgnoreCase(actorRole)) {
            throw new IllegalStateException("Unauthorized actor role for order transition: " + actorRole);
        }

        Timestamp deliveryTimestamp = null;
        if ("DELIVERED".equals(newStatus)) {
            deliveryTimestamp = Timestamp.from(Instant.now());
        }

        // 5. Update Order Status
        orderDao.updateOrderStatus(conn, orderId, newStatus, deliveryTimestamp);

        // 6. Record audit event with actor role
        OrderEvent event = new OrderEvent();
        event.setOrderId(orderId);
        event.setPreviousStatus(currentStatus);
        event.setNewStatus(newStatus);
        event.setTriggeredByUserId(triggeredByUserId);
        event.setActorRole(actorRole != null ? actorRole : "SYSTEM");
        event.setReason(reason != null ? reason : "Transitioned to " + newStatus);
        if (currentLat != null) event.setLatitude(BigDecimal.valueOf(currentLat));
        if (currentLng != null) event.setLongitude(BigDecimal.valueOf(currentLng));
        orderDao.recordOrderEvent(conn, event);

        // 7. Concurrency & Capacity adjustments
        if ("DELIVERED".equals(newStatus) || "CANCELLED".equals(newStatus) || "REJECTED".equals(newStatus)) {
            restaurantDao.decrementCurrentLoad(conn, order.getRestaurantId());
            if (order.getRiderId() != null) {
                riderDao.updateRiderAvailability(conn, order.getRiderId(), true, null);
            }
        }

        // 8. Honest ETA Goodwill Guarantee Check
        if ("DELIVERED".equals(newStatus) && !order.isGoodwillCreditAwarded()) {
            long estimatedMillis = order.getEstimatedDeliveryAt() != null ? order.getEstimatedDeliveryAt().getTime() : 0;
            long actualMillis = deliveryTimestamp.getTime();
            long delayMillis = actualMillis - estimatedMillis;
            long delayMinutes = delayMillis / 60000;

            // If delivered more than 10 minutes past upper ETA SLA, trigger automatic goodwill refund
            if (delayMinutes > 10) {
                BigDecimal goodwillAmount = BigDecimal.valueOf(50.00);
                User customer = userDao.findById(order.getCustomerId());
                if (customer != null) {
                    BigDecimal updatedBalance = (customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO).add(goodwillAmount);
                    userDao.updateWalletBalance(conn, customer.getId(), updatedBalance);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(customer.getId());
                    tx.setAmount(goodwillAmount);
                    tx.setTransactionType("CREDIT");
                    tx.setReason("Automatic Goodwill Credit: ETA exceeded by " + delayMinutes + " mins");
                    tx.setReferenceOrderId(orderId);
                    tx.setBalanceAfter(updatedBalance);
                    walletDao.recordTransaction(conn, tx);

                    orderDao.setGoodwillCreditAwarded(conn, orderId, true);
                    logger.info("Goodwill ₹50 credit issued to customer {} for late order {}", customer.getId(), orderId);
                }
            }
        }

        // 9. Real-Time Broadcasts
        Order updated = orderDao.findById(orderId);
        if (updated != null) {
            Map<String, Object> payload = Map.of(
                    "orderId", orderId,
                    "orderNumber", updated.getOrderNumber() != null ? updated.getOrderNumber() : "ORD-" + orderId,
                    "previousStatus", currentStatus,
                    "status", newStatus,
                    "timestamp", System.currentTimeMillis()
            );
            registry.broadcastToOrder(orderId, "order_status_updated", payload);
            registry.broadcastToRestaurant(updated.getRestaurantId(), "order_status_updated", payload);
            registry.broadcastToUser(updated.getCustomerId(), "order_status_updated", payload);
            if (updated.getRiderId() != null) {
                registry.broadcastToRider(updated.getRiderId(), "order_status_updated", payload);
            }
            registry.broadcastToAdmin("order_status_updated", payload);
        }

        return updated != null ? updated : order;
    }
}
