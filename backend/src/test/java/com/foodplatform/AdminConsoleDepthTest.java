package com.foodplatform;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.*;
import com.foodplatform.daoImpl.*;
import com.foodplatform.model.AdminAuditLog;
import com.foodplatform.model.Coupon;
import com.foodplatform.model.Dispute;
import com.foodplatform.model.Order;
import com.foodplatform.model.PlatformSetting;
import com.foodplatform.model.User;
import com.foodplatform.service.AnalyticsService;
import com.foodplatform.service.DisputeService;
import com.foodplatform.config.DatabaseMigrationRunner;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdminConsoleDepthTest {

    @BeforeAll
    static void setup() {
        DatabaseMigrationRunner.runMigrations();
    }

    private final AnalyticsService analyticsService = new AnalyticsService();
    private final DisputeService disputeService = new DisputeService();
    private final OrderDao orderDao = new OrderDaoImpl();
    private final UserDao userDao = new UserDaoImpl();
    private final CouponDao couponDao = new CouponDaoImpl();
    private final PlatformSettingDao platformSettingDao = new PlatformSettingDaoImpl();
    private final AdminAuditDao adminAuditDao = new AdminAuditDaoImpl();

    private Long createTestOrder(Order order) {
        if (order.getRestaurantDiscount() == null) order.setRestaurantDiscount(BigDecimal.ZERO);
        if (order.getCouponDiscount() == null) order.setCouponDiscount(BigDecimal.ZERO);
        if (order.getPackagingFee() == null) order.setPackagingFee(BigDecimal.valueOf(15.00));
        if (order.getDeliveryFee() == null) order.setDeliveryFee(BigDecimal.valueOf(35.00));
        if (order.getPlatformFee() == null) order.setPlatformFee(BigDecimal.valueOf(5.00));
        if (order.getGstTax() == null) order.setGstTax(BigDecimal.valueOf(10.00));
        if (order.getTipAmount() == null) order.setTipAmount(BigDecimal.ZERO);
        if (order.getEtaMinMinutes() == 0) order.setEtaMinMinutes(25);
        if (order.getEtaMaxMinutes() == 0) order.setEtaMaxMinutes(35);

        try (Connection conn = DatabaseConfig.getConnection()) {
            return orderDao.createOrder(conn, order);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @org.junit.jupiter.api.Order(1)
    void testDisputeOnlyAllowedForDeliveredOrders() {
        // Create an order in PREPARING status
        Order order = new Order();
        order.setOrderNumber("ORD-TEST-UNDELIVERED-" + System.currentTimeMillis());
        order.setCustomerId(1L);
        order.setRestaurantId(1L);
        order.setDeliveryAddressId(1L);
        order.setStatus("PREPARING");
        order.setSubtotal(BigDecimal.valueOf(250.00));
        order.setTotalAmount(BigDecimal.valueOf(300.00));
        order.setPaymentMode("RAZORPAY");
        order.setPaymentStatus("PAID");
        Long orderId = createTestOrder(order);
        assertNotNull(orderId);

        // Attempt to raise dispute for non-delivered order -> Must fail
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                disputeService.raiseDispute(orderId, 1L, "MISSING_ITEM", "Food was missing", null, BigDecimal.valueOf(50.00)));
        assertTrue(ex.getMessage().contains("DELIVERED"));
    }

    @Test
    @org.junit.jupiter.api.Order(2)
    void testDisputeOncePerOrderRule() {
        // Create a DELIVERED order
        Order order = new Order();
        order.setOrderNumber("ORD-TEST-ONCE-" + System.currentTimeMillis());
        order.setCustomerId(1L);
        order.setRestaurantId(1L);
        order.setDeliveryAddressId(1L);
        order.setStatus("DELIVERED");
        order.setSubtotal(BigDecimal.valueOf(350.00));
        order.setTotalAmount(BigDecimal.valueOf(400.00));
        order.setPaymentMode("RAZORPAY");
        order.setPaymentStatus("PAID");
        order.setActualDeliveryAt(new Timestamp(System.currentTimeMillis()));
        Long orderId = createTestOrder(order);
        assertNotNull(orderId);

        // First dispute -> Should succeed
        Dispute d1 = disputeService.raiseDispute(orderId, 1L, "MISSING_ITEM", "Raita missing", null, BigDecimal.valueOf(40.00));
        assertNotNull(d1);
        assertNotNull(d1.getId());

        // Second dispute on same order -> Must fail
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                disputeService.raiseDispute(orderId, 1L, "SPOILED_FOOD", "Duplicate claim", null, BigDecimal.valueOf(60.00)));
        assertTrue(ex.getMessage().contains("already been submitted"));
    }

    @Test
    @org.junit.jupiter.api.Order(3)
    void testDisputeExceedingCapEscalatesToManualReview() {
        Order order = new Order();
        order.setOrderNumber("ORD-TEST-OVERCAP-" + System.currentTimeMillis());
        order.setCustomerId(1L);
        order.setRestaurantId(1L);
        order.setDeliveryAddressId(1L);
        order.setStatus("DELIVERED");
        order.setSubtotal(BigDecimal.valueOf(800.00));
        order.setTotalAmount(BigDecimal.valueOf(900.00));
        order.setPaymentMode("RAZORPAY");
        order.setPaymentStatus("PAID");
        order.setActualDeliveryAt(new Timestamp(System.currentTimeMillis()));
        Long orderId = createTestOrder(order);
        assertNotNull(orderId);

        // Requested refund of ₹300 exceeds default cap of ₹150
        Dispute d = disputeService.raiseDispute(orderId, 1L, "MISSING_ITEM", "Whole box missing", null, BigDecimal.valueOf(300.00));
        assertNotNull(d);
        assertFalse(d.isAutoRefundApproved(), "Should NOT auto-approve claims over cap");
        assertEquals("PENDING", d.getAdminStatus());
        assertTrue(d.getResolutionNotes().contains("exceeds"));
    }

    @Test
    @org.junit.jupiter.api.Order(4)
    void testDisputeFlaggedUserCannotAutoApprove() {
        // Customer 5: flag user for fraud
        userDao.incrementFraudFlag(5L);
        assertTrue(userDao.getFraudFlagCount(5L) > 0);

        Order order = new Order();
        order.setOrderNumber("ORD-TEST-FRAUDUSER-" + System.currentTimeMillis());
        order.setCustomerId(5L);
        order.setRestaurantId(1L);
        order.setDeliveryAddressId(1L);
        order.setStatus("DELIVERED");
        order.setSubtotal(BigDecimal.valueOf(200.00));
        order.setTotalAmount(BigDecimal.valueOf(250.00));
        order.setPaymentMode("RAZORPAY");
        order.setPaymentStatus("PAID");
        order.setActualDeliveryAt(new Timestamp(System.currentTimeMillis()));
        Long orderId = createTestOrder(order);
        assertNotNull(orderId);

        // Small claim (₹40) under cap, but customer has fraud flags
        Dispute d = disputeService.raiseDispute(orderId, 5L, "MISSING_ITEM", "Sauce missing", null, BigDecimal.valueOf(40.00));
        assertNotNull(d);
        assertFalse(d.isAutoRefundApproved(), "Flagged user must never qualify for auto-refund");
        assertEquals("PENDING", d.getAdminStatus());
        assertTrue(d.getResolutionNotes().contains("fraud risk flagged"));
    }

    @Test
    @org.junit.jupiter.api.Order(5)
    void testAdminPlatformMetricsCalculatedFromSql() {
        Map<String, Object> metrics = analyticsService.getAdminPlatformMetrics();
        assertNotNull(metrics);
        assertTrue(metrics.containsKey("grossMerchandiseValue"));
        assertTrue(metrics.containsKey("totalOrders"));
        assertTrue(metrics.containsKey("averageOrderValue"));
        assertTrue(metrics.containsKey("activeRiders"));
        assertTrue(metrics.containsKey("cancellationRate"));
        assertTrue(metrics.containsKey("totalRefunds"));
        assertTrue(metrics.containsKey("platformRevenue"));
        assertTrue(metrics.containsKey("pendingDisputes"));

        // Must be non-negative real numbers
        double gmv = ((Number) metrics.get("grossMerchandiseValue")).doubleValue();
        int orders = ((Number) metrics.get("totalOrders")).intValue();
        assertTrue(gmv >= 0.0);
        assertTrue(orders >= 0);
    }

    @Test
    @org.junit.jupiter.api.Order(6)
    void testCouponCrudLifecycle() {
        String testCode = "TESTPH8_" + (System.currentTimeMillis() % 10000);
        Coupon c = new Coupon();
        c.setCode(testCode);
        c.setDescription("Phase 8 Admin Promo discount");
        c.setDiscountType("FLAT");
        c.setDiscountValue(BigDecimal.valueOf(75.00));
        c.setMinOrderAmount(BigDecimal.valueOf(299.00));
        c.setMaxDiscountAmount(BigDecimal.valueOf(75.00));
        c.setUsageLimit(500);
        c.setActive(true);

        // 1. Create
        Long couponId = couponDao.createCoupon(c);
        assertNotNull(couponId);

        // 2. Read
        Coupon fetched = couponDao.findById(couponId);
        assertNotNull(fetched);
        assertEquals(testCode, fetched.getCode());
        assertEquals(0, BigDecimal.valueOf(75.00).compareTo(fetched.getDiscountValue()));

        // 3. Update
        fetched.setDescription("Updated Phase 8 Description");
        fetched.setDiscountValue(BigDecimal.valueOf(80.00));
        couponDao.updateCoupon(fetched);

        Coupon updated = couponDao.findById(couponId);
        assertEquals("Updated Phase 8 Description", updated.getDescription());
        assertEquals(0, BigDecimal.valueOf(80.00).compareTo(updated.getDiscountValue()));

        // 4. Toggle
        couponDao.toggleCoupon(couponId, false);
        Coupon toggled = couponDao.findById(couponId);
        assertFalse(toggled.isActive());

        // 5. Delete
        couponDao.deleteCoupon(couponId);
        assertNull(couponDao.findById(couponId));
    }

    @Test
    @org.junit.jupiter.api.Order(7)
    void testPlatformSettingsCrud() {
        String testKey = "test_config_radius_" + (System.currentTimeMillis() % 1000);
        platformSettingDao.updateSetting(testKey, "18.5", "Test radius limit");

        String val = platformSettingDao.getSettingValue(testKey, "10.0");
        assertEquals("18.5", val);

        List<PlatformSetting> all = platformSettingDao.listAllSettings();
        assertTrue(all.stream().anyMatch(s -> testKey.equals(s.getConfigKey())));
    }

    @Test
    @org.junit.jupiter.api.Order(8)
    void testAdminAuditLogTrail() {
        String action = "TEST_ADMIN_ACTION_" + System.currentTimeMillis();
        adminAuditDao.logAction(4L, "Admin User", action, "SYSTEM", "SYS-001", "Testing audit trail", "127.0.0.1");

        List<AdminAuditLog> logs = adminAuditDao.listRecentLogs(10, 0);
        assertNotNull(logs);
        assertFalse(logs.isEmpty());
        assertTrue(logs.stream().anyMatch(l -> action.equals(l.getAction())));
    }

    @Test
    @org.junit.jupiter.api.Order(9)
    void testUserDirectorySearchAndSuspend() {
        // Customer 1
        User u = userDao.findById(1L);
        assertNotNull(u);

        // Suspend user
        userDao.updateUserStatus(1L, "SUSPENDED");
        User suspended = userDao.findById(1L);
        assertEquals("SUSPENDED", suspended.getStatus());

        // Re-activate user
        userDao.updateUserStatus(1L, "ACTIVE");
        User active = userDao.findById(1L);
        assertEquals("ACTIVE", active.getStatus());

        // Search users
        List<User> searchResults = userDao.searchUsers(u.getEmail(), "CUSTOMER", "ACTIVE", 10, 0);
        assertFalse(searchResults.isEmpty());
        assertEquals(u.getEmail(), searchResults.get(0).getEmail());
    }
}
