package com.foodplatform;

import com.foodplatform.dao.MenuDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Coupon;
import com.foodplatform.model.MenuItem;
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
public class PricingEngineTest {

    @Mock
    private MenuDao menuDao;

    @Mock
    private RestaurantDao restaurantDao;

    @Mock
    private WalletDao walletDao;

    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        pricingService = new PricingService(menuDao, restaurantDao, walletDao, null, mock(com.foodplatform.dao.OrderDao.class));
    }

    @Test
    @DisplayName("Should accurately calculate bill with price parity guarantee and honest ETA")
    void testCalculateBillWithPriceParity() {
        // Arrange Restaurant
        Restaurant rest = new Restaurant();
        rest.setId(1L);
        rest.setName("Spice Symphony & Grill");
        rest.setLatitude(BigDecimal.valueOf(12.9715987));
        rest.setLongitude(BigDecimal.valueOf(77.6350000));
        rest.setCurrentLoad(2);
        when(restaurantDao.findById(1L)).thenReturn(rest);

        // Arrange Menu Item with 0% Markup Parity
        MenuItem item = new MenuItem();
        item.setId(101L);
        item.setName("Paneer Butter Masala");
        item.setPlatformPrice(BigDecimal.valueOf(280.00));
        item.setDineInPrice(BigDecimal.valueOf(280.00));
        item.setPrepTimeMinutes(15);
        item.setAvailable(true);
        when(menuDao.getItemById(101L)).thenReturn(item);

        // Cart with 2 items
        PricingService.CartInputItem cartItem = new PricingService.CartInputItem();
        cartItem.menuItemId = 101L;
        cartItem.quantity = 2;

        // Act
        PricingService.PriceCalculationResult result = pricingService.calculateBill(
                1L, List.of(cartItem), 12.9783692, 77.6408356, null);

        // Assert Subtotal (280 * 2 = 560.00)
        assertEquals(0, new BigDecimal("560.00").compareTo(result.subtotal));
        assertEquals(0, new BigDecimal("560.00").compareTo(result.dineInSubtotal));

        // Assert 100% Price Parity
        assertTrue((Boolean) result.priceTransparency.get("isPurePriceParity"));

        // Packaging (15.00) + Platform fee (5.00) + Base Delivery (35.00)
        assertEquals(0, new BigDecimal("15.00").compareTo(result.packagingFee));
        assertEquals(0, new BigDecimal("5.00").compareTo(result.platformFee));
        assertEquals(0, new BigDecimal("35.00").compareTo(result.deliveryFee));

        // Taxable: 560 + 15 = 575; 5% GST = 28.75
        assertEquals(0, new BigDecimal("28.75").compareTo(result.gstTax));

        // Total: 560 + 15 + 35 + 5 + 28.75 = 643.75
        assertEquals(0, new BigDecimal("643.75").compareTo(result.totalAmount));

        // Honest ETA confidence interval
        assertTrue(result.etaMinMinutes >= 20);
        assertEquals(result.etaMinMinutes + 10, result.etaMaxMinutes);
    }

    @Test
    @DisplayName("Should apply coupon percentage discount up to max cap")
    void testCouponApplication() {
        Restaurant rest = new Restaurant();
        rest.setId(1L);
        rest.setLatitude(BigDecimal.valueOf(12.9715987));
        rest.setLongitude(BigDecimal.valueOf(77.6350000));
        when(restaurantDao.findById(1L)).thenReturn(rest);

        MenuItem item = new MenuItem();
        item.setId(102L);
        item.setPlatformPrice(BigDecimal.valueOf(400.00));
        item.setDineInPrice(BigDecimal.valueOf(400.00));
        item.setPrepTimeMinutes(20);
        item.setAvailable(true);
        when(menuDao.getItemById(102L)).thenReturn(item);

        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("FOOD50");
        coupon.setDiscountType("PERCENTAGE");
        coupon.setDiscountValue(BigDecimal.valueOf(50.00)); // 50%
        coupon.setMinOrderAmount(BigDecimal.valueOf(199.00));
        coupon.setMaxDiscountAmount(BigDecimal.valueOf(150.00)); // Cap at 150
        coupon.setActive(true);
        when(walletDao.getCouponByCode("FOOD50")).thenReturn(coupon);

        PricingService.CartInputItem in = new PricingService.CartInputItem();
        in.menuItemId = 102L;
        in.quantity = 1;

        PricingService.PriceCalculationResult res = pricingService.calculateBill(
                1L, List.of(in), 12.9783692, 77.6408356, "FOOD50");

        // 50% of 400 is 200, capped at 150
        assertEquals(0, BigDecimal.valueOf(150.00).compareTo(res.couponDiscount));
    }
}
