package com.foodplatform;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.service.MetricsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

public class ConcurrencyAndIdempotencyDepthTest {

    @Test
    @DisplayName("Concurrency: Simultaneous acceptance of same dispatch offer by two riders (Exactly one succeeds)")
    void testConcurrentDispatchAcceptance() throws Exception {
        long riderId = 1L;
        long orderId = 1L;

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement()) {
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM rider_profiles LIMIT 1")) {
                if (rs.next()) riderId = rs.getLong(1);
            }
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM orders LIMIT 1")) {
                if (rs.next()) orderId = rs.getLong(1);
            }
        }

        long dispatchTestId = 88888L;
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO delivery_dispatches (id, order_id, rider_id, dispatch_status, base_pay, distance_pay, total_earning) " +
                            "VALUES (?, ?, ?, 'OFFERED', 35.00, 15.00, 50.00) " +
                            "ON DUPLICATE KEY UPDATE dispatch_status = 'OFFERED'")) {
                ps.setLong(1, dispatchTestId);
                ps.setLong(2, orderId);
                ps.setLong(3, riderId);
                ps.executeUpdate();
            }
            conn.commit();
        }

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CyclicBarrier barrier = new CyclicBarrier(2);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        long finalDispatchId = dispatchTestId;
        Callable<Boolean> riderAcceptTask = () -> {
            barrier.await(); // ensure both threads execute concurrently
            try (Connection conn = DatabaseConfig.getConnection()) {
                conn.setAutoCommit(false);
                String selectLock = "SELECT id, dispatch_status FROM delivery_dispatches WHERE id = ? FOR UPDATE";
                try (PreparedStatement psLock = conn.prepareStatement(selectLock)) {
                    psLock.setLong(1, finalDispatchId);
                    try (ResultSet rs = psLock.executeQuery()) {
                        if (rs.next() && "OFFERED".equals(rs.getString("dispatch_status"))) {
                            try (PreparedStatement psUpd = conn.prepareStatement(
                                    "UPDATE delivery_dispatches SET dispatch_status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP WHERE id = ?")) {
                                psUpd.setLong(1, finalDispatchId);
                                psUpd.executeUpdate();
                            }
                            conn.commit();
                            successCount.incrementAndGet();
                            return true;
                        } else {
                            conn.rollback();
                            conflictCount.incrementAndGet();
                            return false;
                        }
                    }
                }
            } catch (Exception e) {
                conflictCount.incrementAndGet();
                return false;
            }
        };

        Future<Boolean> f1 = executor.submit(riderAcceptTask);
        Future<Boolean> f2 = executor.submit(riderAcceptTask);

        f1.get(5, TimeUnit.SECONDS);
        f2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one rider wins the dispatch!
        assertEquals(1, successCount.get(), "Exactly one rider must successfully accept the dispatch");
        assertEquals(1, conflictCount.get(), "The competing rider must encounter a conflict or already accepted status");
    }

    @Test
    @DisplayName("Idempotency: Double-submit order creation with duplicate idempotency_key is rejected")
    void testOrderCreationIdempotency() throws SQLException {
        long customerId = 1L;
        long restaurantId = 1L;
        long addressId = 1L;

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement()) {
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1")) {
                if (rs.next()) customerId = rs.getLong(1);
            }
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM restaurant_profiles LIMIT 1")) {
                if (rs.next()) restaurantId = rs.getLong(1);
            }
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM user_addresses LIMIT 1")) {
                if (rs.next()) addressId = rs.getLong(1);
            }
        }

        String testKey = "idemp_test_" + System.currentTimeMillis();
        OrderDao orderDao = new OrderDaoImpl();

        Order order1 = new Order();
        order1.setOrderNumber("ORD-IDEMP-01-" + System.currentTimeMillis());
        order1.setCustomerId(customerId);
        order1.setRestaurantId(restaurantId);
        order1.setDeliveryAddressId(addressId);
        order1.setStatus("PLACED");
        order1.setSubtotal(new BigDecimal("280.00"));
        order1.setTotalAmount(new BigDecimal("335.00"));
        order1.setPaymentMode("COD");
        order1.setPaymentStatus("PENDING");
        order1.setIdempotencyKey(testKey);

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            Long id1 = orderDao.createOrder(conn, order1);
            conn.commit();
            assertNotNull(id1, "First order creation must succeed");

            // Attempt duplicate submission with the same idempotency key
            Order order2 = new Order();
            order2.setOrderNumber("ORD-IDEMP-02-" + System.currentTimeMillis());
            order2.setCustomerId(customerId);
            order2.setRestaurantId(restaurantId);
            order2.setDeliveryAddressId(addressId);
            order2.setStatus("PLACED");
            order2.setSubtotal(new BigDecimal("280.00"));
            order2.setTotalAmount(new BigDecimal("335.00"));
            order2.setPaymentMode("COD");
            order2.setPaymentStatus("PENDING");
            order2.setIdempotencyKey(testKey);

            Connection conn2 = DatabaseConfig.getConnection();
            conn2.setAutoCommit(false);
            try {
                assertThrows(SQLException.class, () -> orderDao.createOrder(conn2, order2),
                        "Duplicate idempotency key must violate unique constraint and throw SQLException");
            } finally {
                conn2.rollback();
                conn2.close();
            }
        }
    }

    @Test
    @DisplayName("Observability: MetricsService snapshot reflects orders per minute and counter increments")
    void testMetricsServiceObservability() {
        MetricsService metrics = MetricsService.getInstance();
        metrics.incrementOrdersPlaced();
        metrics.incrementOrdersDelivered();
        metrics.incrementFailedPayments();
        metrics.incrementDispatchTimeouts();

        var snapshot = metrics.getSnapshot();
        assertNotNull(snapshot);
        assertTrue((Long) snapshot.get("ordersPlaced") >= 1);
        assertTrue((Long) snapshot.get("ordersDelivered") >= 1);
        assertTrue((Long) snapshot.get("failedPayments") >= 1);
        assertTrue((Long) snapshot.get("dispatchTimeouts") >= 1);
        assertTrue((Integer) snapshot.get("ordersPerMinute") >= 1);
    }
}
