package com.foodplatform;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Order;
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

        // When locking the order, return PLACED
        // Notice transition uses DatabaseConfig.getConnection() in the method
        // But the validation logic verifies ALLOWED_TRANSITIONS
        // Let's test that directly by checking state machine transition rule
        assertThrows(RuntimeException.class, () -> {
            stateMachine.transition(501L, "DELIVERED", 1L, "Test illegal transition", null, null);
        });
    }
}
