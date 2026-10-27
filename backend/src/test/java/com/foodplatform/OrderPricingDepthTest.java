package com.foodplatform;

import com.foodplatform.dao.MenuDao;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.PlatformSettingDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Coupon;
import com.foodplatform.model.MenuItem;
import com.foodplatform.model.MenuItemAddon;
import com.foodplatform.model.Restaurant;
import com.foodplatform.service.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderPricingDepthTest {

    @Mock
    private MenuDao menuDao;

    @Mock
    private RestaurantDao restaurantDao;

    @Mock
    private WalletDao walletDao;

    @Mock
    private PlatformSettingDao platformSettingDao;

    @Mock
    private OrderDao orderDao;

    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        lenient().when(platformSettingDao.getSettingValue(anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(1));
        pricingService = new PricingService(menuDao, restaurantDao, walletDao, platformSettingDao, orderDao);
    }

    private Restaurant mockRestaurant(long id, double lat, double lng) {
        Restaurant r = new Restaurant();
        r.setId(id);
        r.setName("Brahmin's Coffee Bar");
        r.setLatitude(BigDecimal.valueOf(lat));
        r.setLongitude(BigDecimal.valueOf(lng));
        r.setCurrentLoad(1);
        when(restaurantDao.findById(id)).thenReturn(r);
        return r;
    }

    private MenuItem mockMenuItem(long id, long restaurantId, String name, double price) {
        MenuItem item = new MenuItem();
        item.setId(id);
        item.setRestaurantId(restaurantId);
        item.setName(name);
        item.setPlatformPrice(BigDecimal.valueOf(price));
        item.setDineInPrice(BigDecimal.valueOf(price));
        item.setAvailable(true);
        item.setPrepTimeMinutes(15);
        when(menuDao.getItemById(id)).thenReturn(item);
        return item;
    }

    @Test
    @DisplayName("Should reject item quantity below 1 or exceeding 20")
    void testQuantityBoundaryValidation() {
        mockRestaurant(1L, 12.9716, 77.6350);

        PricingService.CartInputItem itemZero = new PricingService.CartInputItem();
        itemZero.menuItemId = 101L;
        itemZero.quantity = 0;

        IllegalArgumentException exZero = assertThrows(IllegalArgumentException.class, () ->
                pricingService.calculateBill(1L, List.of(itemZero), 12.9750, 77.6400, null, 10L)
        );
        assertTrue(exZero.getMessage().contains("must be between 1 and 20"));

        PricingService.CartInputItem item21 = new PricingService.CartInputItem();
        item21.menuItemId = 101L;
        item21.quantity = 21;

        IllegalArgumentException ex21 = assertThrows(IllegalArgumentException.class, () ->
                pricingService.calculateBill(1L, List.of(item21), 12.9750, 77.6400, null, 10L)
        );
        assertTrue(ex21.getMessage().contains("must be between 1 and 20"));
    }

    @Test
    @DisplayName("Should reject item belonging to a different restaurant")
    void testItemBelongsToRestaurantValidation() {
        mockRestaurant(1L, 12.9716, 77.6350);
        mockMenuItem(101L, 2L, "Dosa from Rival Cafe", 120.00); // Restaurant ID 2 vs cart 1

        PricingService.CartInputItem item = new PricingService.CartInputItem();
        item.menuItemId = 101L;
        item.quantity = 1;

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                pricingService.calculateBill(1L, List.of(item), 12.9750, 77.6400, null, 10L)
        );
        assertTrue(ex.getMessage().contains("does not belong to the selected restaurant"));
    }

    @Test
    @DisplayName("Should reject order beyond restaurant maximum delivery radius")
    void testDeliveryRadiusExceededRejection() {
        mockRestaurant(1L, 12.9716, 77.6350); // Bangalore central

        // Override max delivery radius to 5.0 km for test
        when(platformSettingDao.getSettingValue("max_delivery_radius_km", "15.0")).thenReturn("5.0");

        PricingService.CartInputItem item = new PricingService.CartInputItem();
        item.menuItemId = 101L;
        item.quantity = 1;

        // User coordinates 50km away
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                pricingService.calculateBill(1L, List.of(item), 13.5000, 78.2000, null, 10L)
        );
        assertTrue(ex.getMessage().contains("outside restaurant delivery radius"));
    }

    @Test
    @DisplayName("Should multiply add-ons by item quantity")
    void testAddonMultiplicationByQuantity() {
        mockRestaurant(1L, 12.9716, 77.6350);
        MenuItem item = mockMenuItem(101L, 1L, "Butter Idli Vada", 100.00);
        
        MenuItemAddon addon = new MenuItemAddon();
        addon.setId(5L);
        addon.setMenuItemId(101L);
        addon.setAddonName("Extra Ghee Sambar Dip");
        addon.setPrice(BigDecimal.valueOf(25.00));
        item.setAddons(List.of(addon));

        PricingService.CartInputItem in = new PricingService.CartInputItem();
        in.menuItemId = 101L;
        in.quantity = 3; // 3 items
        in.addonIds = List.of(5L); // 25.00 each -> total addon = 75.00

        PricingService.PriceCalculationResult res = pricingService.calculateBill(
                1L, List.of(in), 12.9750, 77.6400, null, 10L);

        // Subtotal: (100 + 25) * 3 = 375.00
        assertEquals(0, new BigDecimal("375.00").compareTo(res.subtotal));
        assertEquals(1, res.itemisedBill.size());
        assertEquals(0, new BigDecimal("75.00").compareTo((BigDecimal) res.itemisedBill.get(0).get("addonTotal")));
    }

    @Test
    @DisplayName("Should apply free delivery above threshold and surge multiplier correctly")
    void testFreeDeliveryThresholdAndSurge() {
        mockRestaurant(1L, 12.9716, 77.6350);
        mockMenuItem(101L, 1L, "Royal Feast Platter", 600.00);

        when(platformSettingDao.getSettingValue("enable_free_delivery", "false")).thenReturn("true");
        when(platformSettingDao.getSettingValue("free_delivery_threshold", "499.00")).thenReturn("499.00");

        PricingService.CartInputItem in = new PricingService.CartInputItem();
        in.menuItemId = 101L;
        in.quantity = 1; // 600.00 >= 499.00

        PricingService.PriceCalculationResult res = pricingService.calculateBill(
                1L, List.of(in), 12.9750, 77.6400, null, 10L);

        // Free delivery applied
        assertEquals(0, BigDecimal.ZERO.compareTo(res.deliveryFee));
    }

    @Test
    @DisplayName("Should enforce first-order-only coupon rule")
    void testFirstOrderCouponRestriction() {
        mockRestaurant(1L, 12.9716, 77.6350);
        mockMenuItem(101L, 1L, "Filter Coffee Combo", 250.00);

        Coupon firstOrderCoupon = new Coupon();
        firstOrderCoupon.setId(10L);
        firstOrderCoupon.setCode("WELCOME50");
        firstOrderCoupon.setActive(true);
        firstOrderCoupon.setFirstOrderOnly(true);
        firstOrderCoupon.setMinOrderAmount(BigDecimal.valueOf(100.00));
        firstOrderCoupon.setDiscountType("FLAT");
        firstOrderCoupon.setDiscountValue(BigDecimal.valueOf(50.00));
        firstOrderCoupon.setMaxDiscountAmount(BigDecimal.valueOf(50.00));
        when(walletDao.getCouponByCode("WELCOME50")).thenReturn(firstOrderCoupon);

        // Customer has 2 previous orders
        when(orderDao.getCustomerOrderCount(99L)).thenReturn(2);

        PricingService.CartInputItem in = new PricingService.CartInputItem();
        in.menuItemId = 101L;
        in.quantity = 1;

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                pricingService.calculateBill(1L, List.of(in), 12.9750, 77.6400, "WELCOME50", 99L)
        );
        assertTrue(ex.getMessage().contains("valid only on your first order"));
    }

    @Test
    @DisplayName("Should enforce per-user coupon limit")
    void testCouponUserLimitRestriction() {
        mockRestaurant(1L, 12.9716, 77.6350);
        mockMenuItem(101L, 1L, "Filter Coffee Combo", 250.00);

        Coupon limitedCoupon = new Coupon();
        limitedCoupon.setId(20L);
        limitedCoupon.setCode("ONCEONLY");
        limitedCoupon.setActive(true);
        limitedCoupon.setPerUserLimit(1);
        limitedCoupon.setMinOrderAmount(BigDecimal.valueOf(100.00));
        limitedCoupon.setDiscountType("FLAT");
        limitedCoupon.setDiscountValue(BigDecimal.valueOf(30.00));
        limitedCoupon.setMaxDiscountAmount(BigDecimal.valueOf(30.00));
        when(walletDao.getCouponByCode("ONCEONLY")).thenReturn(limitedCoupon);

        // User already used it 1 time
        when(walletDao.getCouponUsageCountByUser(99L, 20L)).thenReturn(1);

        PricingService.CartInputItem in = new PricingService.CartInputItem();
        in.menuItemId = 101L;
        in.quantity = 1;

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                pricingService.calculateBill(1L, List.of(in), 12.9750, 77.6400, "ONCEONLY", 99L)
        );
        assertTrue(ex.getMessage().contains("maximum usage limit"));
    }
}
