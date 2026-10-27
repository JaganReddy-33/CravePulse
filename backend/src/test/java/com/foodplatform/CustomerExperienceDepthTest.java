package com.foodplatform;

import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.model.Address;
import com.foodplatform.model.Order;
import com.foodplatform.model.User;
import com.foodplatform.service.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CustomerExperienceDepthTest {

    private RestaurantDao restaurantDao;
    private UserDao userDao;

    @BeforeEach
    void setUp() {
        restaurantDao = mock(RestaurantDao.class);
        userDao = mock(UserDao.class);
    }

    @Test
    void testPriceCalculationWithTipPassThrough() {
        PricingService.PriceCalculationResult calc = new PricingService.PriceCalculationResult();
        calc.subtotal = new BigDecimal("350.00");
        calc.deliveryFee = new BigDecimal("35.00");
        calc.packagingFee = new BigDecimal("15.00");
        calc.platformFee = new BigDecimal("5.00");
        calc.gstTax = new BigDecimal("18.25");
        calc.tipAmount = new BigDecimal("30.00");
        calc.totalAmount = calc.subtotal
                .add(calc.deliveryFee)
                .add(calc.packagingFee)
                .add(calc.platformFee)
                .add(calc.gstTax)
                .add(calc.tipAmount);

        assertEquals(new BigDecimal("30.00"), calc.tipAmount);
        assertEquals(new BigDecimal("453.25"), calc.totalAmount);
    }

    @Test
    void testSpecialCookingInstructionsAndTipInOrder() {
        Order order = new Order();
        order.setSpecialInstructions("Extra crisp chur chur naan, less spicy curry");
        order.setTipAmount(new BigDecimal("50.00"));

        assertEquals("Extra crisp chur chur naan, less spicy curry", order.getSpecialInstructions());
        assertEquals(new BigDecimal("50.00"), order.getTipAmount());
    }

    @Test
    void testSearchSuggestionsStructure() {
        Map<String, Object> mockResults = new HashMap<>();
        List<Map<String, Object>> restaurants = new ArrayList<>();
        Map<String, Object> r1 = new HashMap<>();
        r1.put("id", 1L);
        r1.put("name", "Spice Symphony & Grill");
        r1.put("cuisineTypes", "North Indian, Biryani");
        restaurants.add(r1);

        List<Map<String, Object>> dishes = new ArrayList<>();
        Map<String, Object> d1 = new HashMap<>();
        d1.put("id", 1002L);
        d1.put("name", "Hyderabadi Chicken Dum Biryani");
        d1.put("platformPrice", new BigDecimal("320.00"));
        d1.put("restaurantId", 1L);
        dishes.add(d1);

        mockResults.put("restaurants", restaurants);
        mockResults.put("dishes", dishes);

        when(restaurantDao.searchSuggestions("biryani")).thenReturn(mockResults);

        Map<String, Object> results = restaurantDao.searchSuggestions("biryani");
        assertNotNull(results);
        assertTrue(results.containsKey("restaurants"));
        assertTrue(results.containsKey("dishes"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> resRestaurants = (List<Map<String, Object>>) results.get("restaurants");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> resDishes = (List<Map<String, Object>>) results.get("dishes");

        assertEquals(1, resRestaurants.size());
        assertEquals("Spice Symphony & Grill", resRestaurants.get(0).get("name"));

        assertEquals(1, resDishes.size());
        assertEquals("Hyderabadi Chicken Dum Biryani", resDishes.get(0).get("name"));
    }

    @Test
    void testUserAddressModelAndDefaultStatus() {
        Address address = new Address();
        address.setId(10L);
        address.setUserId(42L);
        address.setTitle("Home");
        address.setAddressLine("Flat 402, Sunshine Heights, 12th Main");
        address.setCity("Bangalore");
        address.setPostalCode("560038");
        address.setDefault(true);

        assertEquals(10L, address.getId());
        assertEquals(42L, address.getUserId());
        assertEquals("Home", address.getTitle());
        assertTrue(address.isDefault());

        doNothing().when(userDao).setDefaultAddress(10L, 42L);
        userDao.setDefaultAddress(10L, 42L);
        verify(userDao, times(1)).setDefaultAddress(10L, 42L);

        doNothing().when(userDao).deleteAddress(10L, 42L);
        userDao.deleteAddress(10L, 42L);
        verify(userDao, times(1)).deleteAddress(10L, 42L);
    }

    @Test
    void testUserProfileUpdate() {
        User user = new User();
        user.setId(7L);
        user.setFullName("Aarav Patel");
        user.setPhone("+91 98490 99887");
        user.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150");

        assertEquals("Aarav Patel", user.getFullName());
        assertEquals("+91 98490 99887", user.getPhone());
        assertEquals("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", user.getAvatarUrl());

        doNothing().when(userDao).updateProfile(7L, "Aarav Patel", "+91 98490 99887", user.getAvatarUrl());
        userDao.updateProfile(7L, "Aarav Patel", "+91 98490 99887", user.getAvatarUrl());
        verify(userDao, times(1)).updateProfile(7L, "Aarav Patel", "+91 98490 99887", user.getAvatarUrl());
    }
}
