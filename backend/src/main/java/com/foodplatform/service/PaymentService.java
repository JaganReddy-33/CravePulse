package com.foodplatform.service;

import com.foodplatform.config.AppProperties;
import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.PaymentDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.PaymentDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.model.Payment;
import com.foodplatform.model.User;
import com.foodplatform.model.WalletTransaction;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentDao paymentDao;
    private final OrderDao orderDao;
    private final UserDao userDao;
    private final WalletDao walletDao;
    private final RazorpayGatewayClient razorpayClient;
    private final RealtimeSessionRegistry sessionRegistry;

    public PaymentService() {
        this(
                new PaymentDaoImpl(),
                new OrderDaoImpl(),
                new UserDaoImpl(),
                new WalletDaoImpl(),
                new RazorpayGatewayClient(),
                RealtimeSessionRegistry.getInstance()
        );
    }

    public PaymentService(PaymentDao paymentDao, OrderDao orderDao, UserDao userDao, WalletDao walletDao,
                          RazorpayGatewayClient razorpayClient, RealtimeSessionRegistry sessionRegistry) {
        this.paymentDao = paymentDao;
        this.orderDao = orderDao;
        this.userDao = userDao;
        this.walletDao = walletDao;
        this.razorpayClient = razorpayClient;
        this.sessionRegistry = sessionRegistry;
    }

    /**
     * Validates that cart or order total complies with Cash On Delivery threshold.
     */
    public void validateCodOrder(BigDecimal totalAmount) {
        BigDecimal codLimit = AppProperties.getCodMaxLimit();
        if (totalAmount != null && totalAmount.compareTo(codLimit) > 0) {
            throw new IllegalArgumentException(
                    "Cash on Delivery is only available for orders up to ₹" + codLimit.setScale(2) +
                            ". Your cart total is ₹" + totalAmount.setScale(2) + ". Please select Online Payment or Wallet."
            );
        }
    }

    /**
     * Creates a Razorpay Order via REST API and records a pending payment row.
     */
    public Map<String, Object> createRazorpayOrder(long orderId, Long userId, String idempotencyKey) {
        Order order = orderDao.findById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("Order not found: " + orderId);
        }

        if (userId != null && order.getCustomerId() != null && !order.getCustomerId().equals(userId)) {
            throw new IllegalStateException("Access forbidden: you do not own order #" + orderId);
        }

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new IllegalStateException("Order #" + orderId + " is already paid.");
        }

        if (!"RAZORPAY".equals(order.getPaymentMode())) throw new IllegalArgumentException("This order does not use online payment");
        // Check if an active Razorpay payment already exists for this order
        Payment existing = paymentDao.findByOrderId(orderId);
        if (existing != null && "SUCCESS".equalsIgnoreCase(existing.getStatus())) {
            throw new IllegalStateException("A successful payment already exists for order #" + orderId);
        }

        String razorpayOrderId;
        if (existing != null && existing.getRazorpayOrderId() != null && "PENDING".equalsIgnoreCase(existing.getStatus())) {
            razorpayOrderId = existing.getRazorpayOrderId();
        } else {
            Map<String, String> notes = Map.of(
                    "orderId", String.valueOf(orderId),
                    "orderNumber", order.getOrderNumber() != null ? order.getOrderNumber() : "ORD-" + orderId
            );
            JsonObject rzpOrder = razorpayClient.createOrder(order.getTotalAmount(), "ORD_" + order.getOrderNumber(), notes);
            razorpayOrderId = rzpOrder.get("id").getAsString();

            try (Connection conn = DatabaseConfig.getConnection()) {
                conn.setAutoCommit(false);
                try {
                    Payment payment = new Payment();
                    payment.setOrderId(orderId);
                    payment.setPaymentMode("RAZORPAY");
                    payment.setRazorpayOrderId(razorpayOrderId);
                    payment.setAmount(order.getTotalAmount());
                    payment.setCurrency("INR");
                    payment.setStatus("PENDING");
                    payment.setIdempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString());
                    paymentDao.createPayment(conn, payment);
                    conn.commit();
                } catch (SQLException | RuntimeException e) {
                    conn.rollback();
                    throw e;
                } finally {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                logger.error("Failed to persist Razorpay payment record for order: {}", orderId, e);
                throw new RuntimeException("Could not initiate payment session", e);
            }
        }

        User customer = order.getCustomerId() != null ? userDao.findById(order.getCustomerId()) : null;

        Map<String, Object> response = new HashMap<>();
        response.put("razorpayOrderId", razorpayOrderId);
        response.put("keyId", razorpayClient.getKeyId());
        response.put("amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue()); // in paise
        response.put("currency", "INR");
        response.put("orderId", order.getId());
        response.put("orderNumber", order.getOrderNumber());
        response.put("customerName", customer != null ? customer.getFullName() : "Customer");
        response.put("customerPhone", customer != null ? customer.getPhone() : "");
        response.put("customerEmail", customer != null ? customer.getEmail() : "");
        return response;
    }

    /**
     * Verifies payment signature and marks order PAID inside a DB transaction.
     */
    public Map<String, Object> verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature, Long userId) {
        Payment ownedPayment = paymentDao.findByRazorpayOrderId(razorpayOrderId);
        Order ownedOrder = ownedPayment == null ? null : orderDao.findById(ownedPayment.getOrderId());
        if (userId == null || ownedOrder == null || !userId.equals(ownedOrder.getCustomerId())) {
            throw new IllegalArgumentException("Payment not found in your account");
        }
        if (!razorpayClient.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            Payment payment = paymentDao.findByRazorpayOrderId(razorpayOrderId);
            if (payment != null) {
                try (Connection conn = DatabaseConfig.getConnection()) {
                    paymentDao.updatePaymentStatus(conn, payment.getId(), "FAILED");
                } catch (SQLException ignored) {}
            }
            throw new IllegalArgumentException("Invalid Razorpay payment signature. Payment verification failed.");
        }

        Payment payment = paymentDao.findByRazorpayOrderId(razorpayOrderId);
        if (payment == null) {
            throw new IllegalArgumentException("Payment record not found for Razorpay order: " + razorpayOrderId);
        }

        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            return Map.of("success", true, "message", "Payment already verified", "orderId", payment.getOrderId());
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Update payment status to SUCCESS
                paymentDao.updateStatusAndDetails(
                        conn, payment.getId(), "SUCCESS", razorpayPaymentId, razorpaySignature,
                        "{\"status\":\"captured\",\"payment_id\":\"" + razorpayPaymentId + "\"}"
                );

                // 2. Update order payment status to PAID
                orderDao.updateOrderPaymentStatus(conn, payment.getOrderId(), "PAID");

                conn.commit();
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Failed to commit verified payment for order: {}", payment.getOrderId(), e);
            throw new RuntimeException("Database error verifying payment", e);
        }

        // Broadcast real-time SSE payment confirmation
        Map<String, Object> broadcastPayload = Map.of(
                "orderId", payment.getOrderId(),
                "paymentId", razorpayPaymentId,
                "status", "PAID",
                "timestamp", System.currentTimeMillis()
        );
        sessionRegistry.broadcastToOrder(payment.getOrderId(), "payment_success", broadcastPayload);

        return Map.of(
                "success", true,
                "orderId", payment.getOrderId(),
                "paymentId", razorpayPaymentId,
                "status", "PAID"
        );
    }

    /**
     * Processes atomic wallet debit inside a DB transaction with SELECT ... FOR UPDATE.
     */
    public Map<String, Object> processWalletPayment(long orderId, Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Authentication required for wallet payments.");
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Lock order
                Order order = orderDao.findWithLock(conn, orderId);
                if (order == null) {
                    throw new IllegalArgumentException("Order not found: " + orderId);
                }

                if (order.getCustomerId() == null || !order.getCustomerId().equals(userId)) {
                    throw new IllegalStateException("Access forbidden: you do not own order #" + orderId);
                }

                if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
                    conn.rollback();
                    return Map.of("success", true, "message", "Order already paid", "orderId", orderId);
                }

                if (!"WALLET".equals(order.getPaymentMode())) throw new IllegalArgumentException("This order does not use wallet payment");
                // 2. Lock user wallet row atomically
                User customer = userDao.findByIdWithLock(conn, userId);
                if (customer == null) {
                    throw new IllegalArgumentException("Customer account not found: " + userId);
                }

                BigDecimal currentBalance = customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO;
                BigDecimal orderTotal = order.getTotalAmount();

                if (currentBalance.compareTo(orderTotal) < 0) {
                    throw new IllegalStateException(
                            "Insufficient wallet balance. Required: ₹" + orderTotal.setScale(2) +
                                    ", Available: ₹" + currentBalance.setScale(2)
                    );
                }

                // 3. Deduct balance atomically
                BigDecimal newBalance = currentBalance.subtract(orderTotal);
                userDao.updateWalletBalance(conn, userId, newBalance);

                // 4. Record wallet transaction ledger
                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(userId);
                tx.setAmount(orderTotal);
                tx.setTransactionType("DEBIT");
                tx.setReason("Payment for Order " + (order.getOrderNumber() != null ? order.getOrderNumber() : "#" + orderId));
                tx.setReferenceOrderId(orderId);
                tx.setBalanceAfter(newBalance);
                walletDao.recordTransaction(conn, tx);

                // 5. Record payment row
                Payment payment = new Payment();
                payment.setOrderId(orderId);
                payment.setPaymentMode("WALLET");
                payment.setAmount(orderTotal);
                payment.setCurrency("INR");
                payment.setStatus("SUCCESS");
                payment.setIdempotencyKey("WALLET_" + orderId + "_" + System.currentTimeMillis());
                paymentDao.createPayment(conn, payment);

                // 6. Mark order payment status
                orderDao.updateOrderPaymentStatus(conn, orderId, "PAID");

                conn.commit();

                // Broadcast payment confirmation
                Map<String, Object> payload = Map.of(
                        "orderId", orderId,
                        "paymentMode", "WALLET",
                        "status", "PAID",
                        "newBalance", newBalance
                );
                sessionRegistry.broadcastToUser(userId, "wallet_updated", payload);
                sessionRegistry.broadcastToOrder(orderId, "payment_success", payload);

                return Map.of(
                        "success", true,
                        "orderId", orderId,
                        "paymentMode", "WALLET",
                        "balanceAfter", newBalance
                );
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database error executing wallet payment for order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Wallet payment failed: " + e.getMessage(), e);
        }
    }

    /**
     * Idempotent webhook handler for payment.captured, payment.failed, and refund.processed.
     */
    public Map<String, Object> handleWebhook(String rawPayload, String signatureHeader) {
        if (!razorpayClient.verifyWebhookSignature(rawPayload, signatureHeader)) {
            throw new IllegalArgumentException("Invalid Razorpay webhook signature.");
        }

        JsonObject event = JsonParser.parseString(rawPayload).getAsJsonObject();
        String eventId = event.has("id") ? event.get("id").getAsString() : null;
        String eventType = event.has("event") ? event.get("event").getAsString() : "unknown";

        if (eventId != null && paymentDao.hasWebhookEventBeenProcessed(eventId)) {
            logger.info("Ignoring duplicate webhook event: {}", eventId);
            return Map.of("status", "ignored", "reason", "duplicate_event", "eventId", eventId);
        }

        JsonObject payloadObj = event.has("payload") ? event.getAsJsonObject("payload") : null;
        if (payloadObj != null) {
            if ("payment.captured".equals(eventType) && payloadObj.has("payment")) {
                JsonObject paymentObj = payloadObj.getAsJsonObject("payment").getAsJsonObject("entity");
                String rzpOrderId = paymentObj.has("order_id") ? paymentObj.get("order_id").getAsString() : null;
                String rzpPaymentId = paymentObj.has("id") ? paymentObj.get("id").getAsString() : null;

                if (rzpOrderId != null) {
                    Payment payment = paymentDao.findByRazorpayOrderId(rzpOrderId);
                    if (payment != null && !"SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                        try (Connection conn = DatabaseConfig.getConnection()) {
                            conn.setAutoCommit(false);
                            try {
                                paymentDao.updateStatusAndDetails(conn, payment.getId(), "SUCCESS", rzpPaymentId, null, rawPayload);
                                orderDao.updateOrderPaymentStatus(conn, payment.getOrderId(), "PAID");
                                conn.commit();
                            } catch (SQLException | RuntimeException ex) {
                                conn.rollback();
                            } finally {
                                conn.setAutoCommit(true);
                            }
                        } catch (SQLException ignored) {}
                    }
                }
            } else if ("payment.failed".equals(eventType) && payloadObj.has("payment")) {
                JsonObject paymentObj = payloadObj.getAsJsonObject("payment").getAsJsonObject("entity");
                String rzpOrderId = paymentObj.has("order_id") ? paymentObj.get("order_id").getAsString() : null;
                if (rzpOrderId != null) {
                    Payment payment = paymentDao.findByRazorpayOrderId(rzpOrderId);
                    if (payment != null) {
                        try (Connection conn = DatabaseConfig.getConnection()) {
                            paymentDao.updatePaymentStatus(conn, payment.getId(), "FAILED");
                        } catch (SQLException ignored) {}
                    }
                }
            }
        }

        if (eventId != null) {
            paymentDao.recordWebhookEvent(eventId, eventType, rawPayload);
        }

        return Map.of("status", "processed", "eventId", eventId != null ? eventId : "none");
    }

    /**
     * Executes idempotent refund for cancelled / rejected orders.
     */
    public Map<String, Object> processRefund(long orderId, String reason) {
        Payment payment = paymentDao.findByOrderId(orderId);
        if (payment == null || !"SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            return Map.of("refunded", false, "message", "No successful payment row found for refund.");
        }

        if (payment.getRefundId() != null) {
            return Map.of("refunded", "PROCESSED".equals(payment.getRefundStatus()), "status", payment.getRefundStatus(), "refundId", payment.getRefundId());
        }
        Order order = orderDao.findById(orderId);
        if (order == null) {
            return Map.of("refunded", false, "message", "Order not found");
        }

        if ("WALLET".equalsIgnoreCase(payment.getPaymentMode())) {
            try (Connection conn = DatabaseConfig.getConnection()) {
                conn.setAutoCommit(false);
                try {
                    try (var lock = conn.prepareStatement("SELECT refund_id,refund_status FROM payments WHERE id=? FOR UPDATE")) {
                        lock.setLong(1,payment.getId());
                        try(var rows=lock.executeQuery()) {
                            if(!rows.next()) throw new SQLException("Payment not found");
                            if(rows.getString(1)!=null) { conn.rollback(); return Map.of("refunded", "PROCESSED".equals(rows.getString(2)), "refundId", rows.getString(1)); }
                        }
                    }
                    User customer = userDao.findByIdWithLock(conn, order.getCustomerId());
                    if (customer != null) {
                        BigDecimal updatedBalance = (customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO).add(payment.getAmount());
                        userDao.updateWalletBalance(conn, customer.getId(), updatedBalance);

                        WalletTransaction tx = new WalletTransaction();
                        tx.setUserId(customer.getId());
                        tx.setAmount(payment.getAmount());
                        tx.setTransactionType("CREDIT");
                        tx.setReason("Refund for cancelled order " + (order.getOrderNumber() != null ? order.getOrderNumber() : "#" + orderId));
                        tx.setReferenceOrderId(orderId);
                        tx.setBalanceAfter(updatedBalance);
                        walletDao.recordTransaction(conn, tx);

                        paymentDao.recordRefund(conn, payment.getId(), "WALLET_REFUND_" + orderId, payment.getAmount(), "PROCESSED");
                    }
                    conn.commit();
                    return Map.of("refunded", true, "mode", "WALLET", "amount", payment.getAmount());
                } catch (SQLException | RuntimeException e) {
                    conn.rollback();
                    throw e;
                } finally {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                logger.error("Failed to refund wallet payment for order {}: {}", orderId, e.getMessage());
                throw new RuntimeException("Wallet refund failed", e);
            }
        } else if ("RAZORPAY".equalsIgnoreCase(payment.getPaymentMode())) {
            if (payment.getRazorpayPaymentId() != null) {
                JsonObject refundRes = razorpayClient.createRefund(payment.getRazorpayPaymentId(), payment.getAmount(), reason);
                if (!refundRes.has("id") || !refundRes.has("status")) throw new IllegalStateException("Gateway refund response incomplete; reconciliation required");
                String refundId = refundRes.get("id").getAsString();
                String refundStatus = "processed".equals(refundRes.get("status").getAsString()) ? "PROCESSED" : "PENDING";
                try (Connection conn = DatabaseConfig.getConnection()) {
                    paymentDao.recordRefund(conn, payment.getId(), refundId, payment.getAmount(), refundStatus);
                } catch (SQLException e) { throw new IllegalStateException("Gateway accepted refund but ledger update failed; reconciliation required",e); }
                return Map.of("refunded", "PROCESSED".equals(refundStatus), "status", refundStatus, "mode", "RAZORPAY", "refundId", refundId, "amount", payment.getAmount());
            }
        }

        return Map.of("refunded", false, "message", "Payment mode not eligible for automatic refund");
    }
}
