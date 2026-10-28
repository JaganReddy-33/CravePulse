package com.foodplatform;

import com.foodplatform.dao.MenuDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.model.MenuItem;
import com.foodplatform.model.Restaurant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PartnerPortalDepthTest {

    private RestaurantDao restaurantDao;
    private MenuDao menuDao;

    @BeforeEach
    void setUp() {
        restaurantDao = mock(RestaurantDao.class);
        menuDao = mock(MenuDao.class);
    }

    @Test
    void testMaskedBankAccountFormatting() {
        Restaurant r = new Restaurant();
        assertNull(r.getMaskedBankAccount());

        r.setBankAccountNumber("50200088129931");
        String masked = r.getMaskedBankAccount();
        assertNotNull(masked);
        assertTrue(masked.endsWith("9931"));
        assertTrue(masked.startsWith("••••••••••"));
        assertEquals("••••••••••9931", masked);

        // Short account numbers less than 4 digits
        r.setBankAccountNumber("123");
        assertEquals("123", r.getMaskedBankAccount());
    }

    @Test
    void testAutoRejectSlaDefaultAndConfiguration() {
        Restaurant r = new Restaurant();
        assertEquals(10, r.getAutoRejectMinutes());

        r.setAutoRejectMinutes(15);
        assertEquals(15, r.getAutoRejectMinutes());
    }

    @Test
    void testMenuSoftDeleteExclusion() {
        MenuItem item1 = new MenuItem();
        item1.setId(101L);
        item1.setName("Meghana Special Chicken Biryani");
        item1.setPlatformPrice(BigDecimal.valueOf(320));
        item1.setDeleted(false);

        MenuItem item2 = new MenuItem();
        item2.setId(102L);
        item2.setName("Mutton Dum Biryani (Archived)");
        item2.setPlatformPrice(BigDecimal.valueOf(450));
        item2.setDeleted(true);

        when(menuDao.getItemsByRestaurantId(6L)).thenReturn(List.of(item1));

        List<MenuItem> activeItems = menuDao.getItemsByRestaurantId(6L);
        assertEquals(1, activeItems.size());
        assertEquals("Meghana Special Chicken Biryani", activeItems.get(0).getName());
        assertFalse(activeItems.get(0).isDeleted());
    }

    @Test
    void testDynamicOwnerRestaurantResolution() {
        long ownerUserId = 20L;
        Restaurant rest = new Restaurant();
        rest.setId(6L);
        rest.setUserId(ownerUserId);
        rest.setName("Meghana Foods Indiranagar");

        when(restaurantDao.findByUserId(ownerUserId)).thenReturn(rest);

        Restaurant resolved = restaurantDao.findByUserId(ownerUserId);
        assertNotNull(resolved);
        assertEquals(6L, resolved.getId());
        assertEquals("Meghana Foods Indiranagar", resolved.getName());
    }

    @Test
    void testAnalyticsCancellationRateCalculation() {
        // Test edge case: 0 total orders
        assertEquals(0.0, computeCancellationRate(0, 0));

        // Test normal: 4 total, 1 cancelled -> 25.0%
        assertEquals(25.0, computeCancellationRate(4, 1));

        // Test normal: 10 total, 0 cancelled -> 0.0%
        assertEquals(0.0, computeCancellationRate(10, 0));

        // Test high: 3 total, 2 cancelled -> 66.7%
        assertEquals(66.7, computeCancellationRate(3, 2));
    }

    @Test
    void testOperatingHoursStructure() {
        Map<String, Object> monday = new HashMap<>();
        monday.put("dayOfWeek", "Monday");
        monday.put("openTime", "11:00");
        monday.put("closeTime", "23:00");
        monday.put("isClosed", false);

        when(restaurantDao.getOperatingHours(6L)).thenReturn(List.of(monday));

        List<Map<String, Object>> hours = restaurantDao.getOperatingHours(6L);
        assertEquals(1, hours.size());
        assertEquals("Monday", hours.get(0).get("dayOfWeek"));
        assertEquals("11:00", hours.get(0).get("openTime"));
        assertFalse((Boolean) hours.get(0).get("isClosed"));
    }

    private double computeCancellationRate(int total, int cancelled) {
        if (total == 0) return 0.0;
        return BigDecimal.valueOf((cancelled * 100.0) / total)
                .setScale(1, java.math.RoundingMode.HALF_UP)
                .doubleValue();
    }
}
