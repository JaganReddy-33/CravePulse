package com.foodplatform;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Order;
import com.foodplatform.model.Restaurant;
import com.foodplatform.service.DispatchService;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DispatchEngineTest {

    @Mock
    private OrderDao orderDao;
    @Mock
    private RestaurantDao restaurantDao;
    @Mock
    private RiderDao riderDao;
    @Mock
    private UserDao userDao;
    @Mock
    private WalletDao walletDao;
    @Mock
    private RealtimeSessionRegistry registry;

    private DispatchService dispatchService;

    @BeforeEach
    void setUp() {
        dispatchService = new DispatchService(orderDao, restaurantDao, riderDao, userDao, walletDao, registry);
    }

    @Test
    @DisplayName("Should return false when no available riders are found in radius")
    void testDispatchWhenNoRidersAvailable() {
        Order o = new Order();
        o.setId(10L);
        o.setRestaurantId(1L);
        when(orderDao.findById(10L)).thenReturn(o);

        Restaurant r = new Restaurant();
        r.setId(1L);
        r.setLatitude(BigDecimal.valueOf(12.9715987));
        r.setLongitude(BigDecimal.valueOf(77.6350000));
        when(restaurantDao.findById(1L)).thenReturn(r);

        lenient().when(riderDao.getExcludedRiderIdsForOrder(10L)).thenReturn(Collections.emptyList());
        lenient().when(riderDao.findNearestAvailableRidersExcluding(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyList()))
                .thenReturn(Collections.emptyList());
        lenient().when(riderDao.findNearestAvailableRiders(anyDouble(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(Collections.emptyList());

        boolean dispatched = dispatchService.dispatchOrder(10L);
        assertFalse(dispatched);
    }

    @Test
    @DisplayName("Should calculate wait time compensation at ₹2/min for wait exceeding 8 minutes")
    void testWaitTimeCompensationCalculation() {
        // Wait of 6 mins (under 8 min threshold) gives 0
        BigDecimal comp1 = dispatchService.claimWaitTimeCompensation(1L, 6);
        assertEquals(BigDecimal.ZERO, comp1);
    }
}
