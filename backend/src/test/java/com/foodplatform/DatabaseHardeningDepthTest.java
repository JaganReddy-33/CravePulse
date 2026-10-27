package com.foodplatform;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.config.DatabaseMigrationRunner;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.model.*;
import com.foodplatform.service.RetentionService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

public class DatabaseHardeningDepthTest {

    @BeforeAll
    static void initMigrations() {
        DatabaseMigrationRunner.runMigrations();
    }

    @Test
    @DisplayName("Monetary Validation: Order rejects negative subtotal and totalAmount")
    void testOrderRejectsNegativeAmounts() {
        Order order = new Order();
        assertThrows(IllegalArgumentException.class, () -> order.setSubtotal(new BigDecimal("-10.00")));
        assertThrows(IllegalArgumentException.class, () -> order.setTotalAmount(new BigDecimal("-0.01")));
        assertThrows(IllegalArgumentException.class, () -> order.setDeliveryFee(new BigDecimal("-5.00")));
        assertThrows(IllegalArgumentException.class, () -> order.setPackagingFee(new BigDecimal("-1.00")));
        assertThrows(IllegalArgumentException.class, () -> order.setPlatformFee(new BigDecimal("-0.50")));
        assertThrows(IllegalArgumentException.class, () -> order.setTipAmount(new BigDecimal("-20.00")));
        assertThrows(IllegalArgumentException.class, () -> order.setCouponDiscount(new BigDecimal("-10.00")));

        // Valid amounts must succeed
        assertDoesNotThrow(() -> {
            order.setSubtotal(new BigDecimal("250.00"));
            order.setTotalAmount(new BigDecimal("300.00"));
            order.setDeliveryFee(BigDecimal.ZERO);
            order.setTipAmount(new BigDecimal("30.00"));
        });
        assertEquals(new BigDecimal("250.00"), order.getSubtotal());
    }

    @Test
    @DisplayName("Monetary Validation: User rejects negative wallet balance")
    void testUserRejectsNegativeWallet() {
        User user = new User();
        assertThrows(IllegalArgumentException.class, () -> user.setWalletBalance(new BigDecimal("-50.00")));
        assertDoesNotThrow(() -> user.setWalletBalance(BigDecimal.ZERO));
        assertDoesNotThrow(() -> user.setWalletBalance(new BigDecimal("1500.00")));
        assertEquals(new BigDecimal("1500.00"), user.getWalletBalance());
    }

    @Test
    @DisplayName("Monetary Validation: Payment rejects negative amount")
    void testPaymentRejectsNegativeAmount() {
        Payment payment = new Payment();
        assertThrows(IllegalArgumentException.class, () -> payment.setAmount(new BigDecimal("-100.00")));
        assertDoesNotThrow(() -> payment.setAmount(new BigDecimal("499.00")));
        assertEquals(new BigDecimal("499.00"), payment.getAmount());
    }

    @Test
    @DisplayName("Monetary Validation: WalletTransaction rejects negative amount and negative balanceAfter")
    void testWalletTransactionRejectsNegative() {
        WalletTransaction tx = new WalletTransaction();
        assertThrows(IllegalArgumentException.class, () -> tx.setAmount(new BigDecimal("-20.00")));
        assertThrows(IllegalArgumentException.class, () -> tx.setBalanceAfter(new BigDecimal("-5.00")));
        assertDoesNotThrow(() -> {
            tx.setAmount(new BigDecimal("200.00"));
            tx.setBalanceAfter(new BigDecimal("1200.00"));
        });
    }

    @Test
    @DisplayName("Monetary Validation: RiderProfile rejects negative wallet and cash in hand")
    void testRiderProfileRejectsNegative() {
        RiderProfile rp = new RiderProfile();
        assertThrows(IllegalArgumentException.class, () -> rp.setWalletBalance(new BigDecimal("-10.00")));
        assertThrows(IllegalArgumentException.class, () -> rp.setCashInHand(new BigDecimal("-1.00")));
        assertDoesNotThrow(() -> {
            rp.setWalletBalance(BigDecimal.ZERO);
            rp.setCashInHand(new BigDecimal("250.00"));
        });
    }

    @Test
    @DisplayName("Monetary Validation: MenuItem rejects negative prices")
    void testMenuItemRejectsNegativePrices() {
        MenuItem item = new MenuItem();
        assertThrows(IllegalArgumentException.class, () -> item.setPlatformPrice(new BigDecimal("-50.00")));
        assertThrows(IllegalArgumentException.class, () -> item.setDineInPrice(new BigDecimal("-10.00")));
        assertDoesNotThrow(() -> {
            item.setPlatformPrice(new BigDecimal("320.00"));
            item.setDineInPrice(new BigDecimal("320.00"));
        });
    }

    @Test
    @DisplayName("Retention Policy: RetentionService executes telemetry purge successfully")
    void testTelemetryRetentionService() {
        RiderDao riderDao = new RiderDaoImpl();
        RetentionService retentionService = new RetentionService(riderDao);
        int purged = retentionService.executeRetentionSweep();
        assertTrue(purged >= 0, "Purged count should be non-negative");
    }

    @Test
    @DisplayName("Schema Integrity: Verify V11 tables exist in database")
    void testV11TablesExist() {
        String[] requiredTables = {
                "favorites",
                "support_tickets",
                "coupon_usages",
                "audit_logs",
                "payment_refunds",
                "rider_documents",
                "idempotency_keys",
                "delivery_zones"
        };

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String table : requiredTables) {
                try (ResultSet rs = stmt.executeQuery("SHOW TABLES LIKE '" + table + "'")) {
                    assertTrue(rs.next(), "Table " + table + " should exist in database");
                }
            }
        } catch (Exception e) {
            fail("Database check failed: " + e.getMessage());
        }
    }
}
