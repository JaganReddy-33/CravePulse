package com.foodplatform;

import com.foodplatform.config.AppProperties;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.PaymentDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Order;
import com.foodplatform.model.Payment;
import com.foodplatform.model.User;
import com.foodplatform.service.PaymentService;
import com.foodplatform.service.RazorpayGatewayClient;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentEngineTest {

    @Mock
    private PaymentDao paymentDao;
    @Mock
    private OrderDao orderDao;
    @Mock
    private UserDao userDao;
    @Mock
    private WalletDao walletDao;
    @Mock
    private RazorpayGatewayClient razorpayClient;
    @Mock
    private RealtimeSessionRegistry sessionRegistry;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentDao,
                orderDao,
                userDao,
                walletDao,
                razorpayClient,
                sessionRegistry
        );
    }

    @Test
    @DisplayName("COD threshold enforcement should permit cart total <= ₹2,000 and reject totals > ₹2,000")
    void testCodThresholdEnforcement() {
        // ₹1,999.00 -> Allowed
        assertDoesNotThrow(() -> paymentService.validateCodOrder(new BigDecimal("1999.00")));
        // ₹2,000.00 -> Allowed
        assertDoesNotThrow(() -> paymentService.validateCodOrder(new BigDecimal("2000.00")));

        // ₹2,000.01 -> Rejected with 400 validation error
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.validateCodOrder(new BigDecimal("2000.01"))
        );
        assertTrue(ex.getMessage().contains("Cash on Delivery is only available for orders up to ₹2000"));

        // ₹3,500.00 -> Rejected
        assertThrows(IllegalArgumentException.class, () ->
                paymentService.validateCodOrder(new BigDecimal("3500.00"))
        );
    }

    @Test
    @DisplayName("Razorpay Order Creation should convert rupees to paise and store pending payment")
    void testCreateRazorpayOrder() {
        long orderId = 101L;
        Order order = new Order();
        order.setId(orderId);
        order.setOrderNumber("ORD-2026-101");
        order.setCustomerId(10L);
        order.setTotalAmount(new BigDecimal("450.50"));
        order.setPaymentStatus("PENDING");

        User customer = new User();
        customer.setId(10L);
        customer.setFullName("Ravi Sharma");
        customer.setEmail("ravi@example.com");
        customer.setPhone("+919876543210");

        JsonObject rzpJson = new JsonObject();
        rzpJson.addProperty("id", "order_MockRzp12345");
        rzpJson.addProperty("amount", 45050L);
        rzpJson.addProperty("currency", "INR");

        when(orderDao.findById(orderId)).thenReturn(order);
        when(userDao.findById(10L)).thenReturn(customer);
        when(razorpayClient.createOrder(eq(new BigDecimal("450.50")), any(), any())).thenReturn(rzpJson);
        when(razorpayClient.getKeyId()).thenReturn("rzp_test_mock");

        Map<String, Object> result = paymentService.createRazorpayOrder(orderId, 10L, "IDEMP-101");

        assertNotNull(result);
        assertEquals("order_MockRzp12345", result.get("razorpayOrderId"));
        assertEquals(45050L, result.get("amount")); // 450.50 * 100 paise
        assertEquals("INR", result.get("currency"));
        assertEquals("Ravi Sharma", result.get("customerName"));
        assertEquals("+919876543210", result.get("customerPhone"));
    }

    @Test
    @DisplayName("Payment signature verification should accept valid signature and reject tampered signature")
    void testVerifyPaymentSignatures() {
        String orderIdRzp = "order_rzp_98765";
        String paymentIdRzp = "pay_rzp_112233";
        String validSig = "correct_hmac_sha256_signature";
        String tamperedSig = "fake_tampered_signature";

        Payment pendingPayment = new Payment();
        pendingPayment.setId(55L);
        pendingPayment.setOrderId(102L);
        pendingPayment.setRazorpayOrderId(orderIdRzp);
        pendingPayment.setStatus("PENDING");

        when(razorpayClient.verifySignature(orderIdRzp, paymentIdRzp, validSig)).thenReturn(true);
        when(razorpayClient.verifySignature(orderIdRzp, paymentIdRzp, tamperedSig)).thenReturn(false);

        // 1. Tampered signature must fail immediately
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.verifyPayment(orderIdRzp, paymentIdRzp, tamperedSig, 10L)
        );
        assertTrue(ex.getMessage().contains("Invalid Razorpay payment signature"));

        // 2. Valid signature succeeds and updates status
        when(paymentDao.findByRazorpayOrderId(orderIdRzp)).thenReturn(pendingPayment);
        Map<String, Object> res = paymentService.verifyPayment(orderIdRzp, paymentIdRzp, validSig, 10L);
        assertNotNull(res);
        assertTrue((Boolean) res.get("success"));
        assertEquals("PAID", res.get("status"));
    }

    @Test
    @DisplayName("Webhook ingestion should process payment.captured and deduplicate duplicate events")
    void testWebhookIngestionAndDeduplication() {
        String payload = "{\"id\":\"evt_1001\",\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_777\",\"order_id\":\"order_rzp_777\"}}}}";
        String signature = "valid_webhook_sig";

        when(razorpayClient.verifyWebhookSignature(payload, signature)).thenReturn(true);
        when(paymentDao.hasWebhookEventBeenProcessed("evt_1001")).thenReturn(false).thenReturn(true);

        // 1. First time delivery: event is processed and recorded
        Map<String, Object> firstRes = paymentService.handleWebhook(payload, signature);
        assertEquals("processed", firstRes.get("status"));
        assertEquals("evt_1001", firstRes.get("eventId"));
        verify(paymentDao).recordWebhookEvent(eq("evt_1001"), eq("payment.captured"), eq(payload));

        // 2. Duplicate delivery (same event ID): event is ignored without double processing
        Map<String, Object> secondRes = paymentService.handleWebhook(payload, signature);
        assertEquals("ignored", secondRes.get("status"));
        assertEquals("duplicate_event", secondRes.get("reason"));
    }

    @Test
    @DisplayName("Wallet overdraft prevention should atomically reject debits exceeding available balance")
    void testWalletOverdraftPrevention() throws SQLException, InterruptedException {
        // Simulating atomic wallet overdraft protection
        // Initial balance: ₹500.00. 10 concurrent requests to debit ₹300.00 each.
        // Exactly 1 must succeed, 9 must be rejected, final balance must be ₹200.00 (never negative).

        final Object lock = new Object();
        final BigDecimal initialBalance = new BigDecimal("500.00");
        final BigDecimal debitAmount = new BigDecimal("300.00");
        final BigDecimal[] currentBalance = new BigDecimal[]{ initialBalance };

        int threadCount = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // synchronous start
                    synchronized (lock) { // simulates SELECT ... FOR UPDATE database row lock
                        if (currentBalance[0].compareTo(debitAmount) >= 0) {
                            currentBalance[0] = currentBalance[0].subtract(debitAmount);
                            successCount.incrementAndGet();
                        } else {
                            failureCount.incrementAndGet();
                        }
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await();
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one transaction should succeed");
        assertEquals(9, failureCount.get(), "Remaining 9 concurrent transactions must fail due to insufficient funds");
        assertEquals(new BigDecimal("200.00"), currentBalance[0], "Balance should never overdraft below zero");
    }

    @Test
    @DisplayName("Automatic refund engine should credit wallet for wallet orders on cancellation")
    void testWalletRefundEngine() {
        long orderId = 205L;
        Order order = new Order();
        order.setId(orderId);
        order.setCustomerId(15L);
        order.setOrderNumber("ORD-205");

        Payment payment = new Payment();
        payment.setId(88L);
        payment.setOrderId(orderId);
        payment.setPaymentMode("WALLET");
        payment.setAmount(new BigDecimal("320.00"));
        payment.setStatus("SUCCESS");

        when(paymentDao.findByOrderId(orderId)).thenReturn(payment);
        when(orderDao.findById(orderId)).thenReturn(order);

        Map<String, Object> refundRes = paymentService.processRefund(orderId, "Customer cancellation");
        assertNotNull(refundRes);
        assertTrue((Boolean) refundRes.get("refunded"));
        assertEquals("WALLET", refundRes.get("mode"));
        assertEquals(new BigDecimal("320.00"), refundRes.get("amount"));
    }
}
