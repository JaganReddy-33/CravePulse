package com.foodplatform;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Order;
import com.foodplatform.model.Restaurant;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.service.OrderStateMachineService;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderStateMachineTest {

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
    @Mock
    private Connection conn;

    private OrderStateMachineService stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new OrderStateMachineService(orderDao, restaurantDao, riderDao, userDao, walletDao, registry);
    }

    @Test
    @DisplayName("Should reject illegal state transition e.g. PLACED -> DELIVERED")
    void testIllegalStateTransition() throws SQLException {
        Order order = new Order();
        order.setId(501L);
        order.setStatus("PLACED");
        order.setRestaurantId(1L);

        when(orderDao.findWithLock(conn, 501L)).thenReturn(order);

        assertThrows(IllegalStateException.class, () -> {
            stateMachine.transition(conn, 501L, "DELIVERED", 1L, "ADMIN", null, "Test illegal transition", null, null);
        });
    }

    @Test
    @DisplayName("Customer can cancel order when status is PLACED or ACCEPTED")
    void testCustomerCancellationAllowed() throws SQLException {
        Order order = new Order();
        order.setId(101L);
        order.setOrderNumber("ORD-101");
        order.setStatus("PLACED");
        order.setCustomerId(10L);
        order.setRestaurantId(1L);

        when(orderDao.findWithLock(conn, 101L)).thenReturn(order);
        when(orderDao.findById(101L)).thenReturn(order);

        Order result = stateMachine.transition(conn, 101L, "CANCELLED", 10L, "CUSTOMER", null, "Changed mind", null, null);
        assertNotNull(result);
        verify(orderDao).updateOrderStatus(eq(conn), eq(101L), eq("CANCELLED"), any());
    }

    @Test
    @DisplayName("Customer cannot cancel order once preparation has started (PREPARING, READY, PICKED_UP)")
    void testCustomerCancellationForbiddenAfterPreparing() throws SQLException {
        Order order = new Order();
        order.setId(102L);
        order.setStatus("PREPARING");
        order.setCustomerId(10L);
        order.setRestaurantId(1L);

        when(orderDao.findWithLock(conn, 102L)).thenReturn(order);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            stateMachine.transition(conn, 102L, "CANCELLED", 10L, "CUSTOMER", null, "Try cancel late", null, null);
        });
        assertTrue(ex.getMessage().contains("Order cannot be cancelled once food preparation has begun"));
    }

    @Test
    @DisplayName("Customer cannot cancel someone else's order (IDOR check)")
    void testCustomerCannotCancelOthersOrder() throws SQLException {
        Order order = new Order();
        order.setId(103L);
        order.setStatus("PLACED");
        order.setCustomerId(10L); // Owner is customer 10
        order.setRestaurantId(1L);

        when(orderDao.findWithLock(conn, 103L)).thenReturn(order);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            stateMachine.transition(conn, 103L, "CANCELLED", 99L, "CUSTOMER", null, "Malicious attempt", null, null);
        });
        assertTrue(ex.getMessage().contains("Access forbidden: you do not own this order"));
    }

    @Test
    @DisplayName("Rider must provide valid delivery OTP to transition to DELIVERED")
    void testRiderDeliveryOtpVerification() throws SQLException {
        Order order = new Order();
        order.setId(104L);
        order.setOrderNumber("ORD-104");
        order.setStatus("PICKED_UP");
        order.setCustomerId(10L);
        order.setRestaurantId(1L);
        order.setRiderId(5L);
        order.setDeliveryOtp("4829");

        RiderProfile rider = new RiderProfile();
        rider.setId(5L);
        rider.setUserId(20L);

        when(orderDao.findWithLock(conn, 104L)).thenReturn(order);
        when(riderDao.findByUserId(20L)).thenReturn(rider);

        // 1. Wrong OTP should fail
        assertThrows(IllegalArgumentException.class, () -> {
            stateMachine.transition(conn, 104L, "DELIVERED", 20L, "RIDER", "1234", "Delivered food", 12.9, 77.6);
        });

        // 2. Missing OTP should fail
        assertThrows(IllegalArgumentException.class, () -> {
            stateMachine.transition(conn, 104L, "DELIVERED", 20L, "RIDER", null, "Delivered food", 12.9, 77.6);
        });

        // 3. Correct OTP succeeds
        when(orderDao.findById(104L)).thenReturn(order);
        Order updated = stateMachine.transition(conn, 104L, "DELIVERED", 20L, "RIDER", "4829", "Delivered food", 12.9, 77.6);
        assertNotNull(updated);
        verify(orderDao).updateOrderStatus(eq(conn), eq(104L), eq("DELIVERED"), any());
    }

    @Test
    @DisplayName("Restaurant Owner can only accept or prepare their own restaurant orders")
    void testRestaurantOwnerAuthorization() throws SQLException {
        Order order = new Order();
        order.setId(105L);
        order.setStatus("PLACED");
        order.setCustomerId(10L);
        order.setRestaurantId(1L); // Restaurant 1

        Restaurant ownerRest = new Restaurant();
        ownerRest.setId(2L); // Owner owns Restaurant 2, not 1
        ownerRest.setUserId(30L);

        when(orderDao.findWithLock(conn, 105L)).thenReturn(order);
        when(restaurantDao.findByUserId(30L)).thenReturn(ownerRest);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            stateMachine.transition(conn, 105L, "ACCEPTED", 30L, "RESTAURANT_OWNER", null, "Accept order", null, null);
        });
        assertTrue(ex.getMessage().contains("you do not own the restaurant fulfilling this order"));
    }
}
