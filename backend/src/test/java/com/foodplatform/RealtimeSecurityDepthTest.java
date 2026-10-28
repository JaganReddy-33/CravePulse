package com.foodplatform;

import com.foodplatform.dao.OrderMessageDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.model.OrderMessage;
import com.foodplatform.model.Restaurant;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.websocket.RealtimeEndpoint;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import jakarta.websocket.CloseReason;
import jakarta.websocket.RemoteEndpoint;
import jakarta.websocket.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RealtimeSecurityDepthTest {

    @Mock
    private RealtimeSessionRegistry registry;
    @Mock
    private RiderDao riderDao;
    @Mock
    private RestaurantDao restaurantDao;
    @Mock
    private OrderMessageDao orderMessageDao;
    @Mock
    private UserDao userDao;
    @Mock
    private Session session;
    @Mock
    private RemoteEndpoint.Basic basicRemote;

    private RealtimeEndpoint endpoint;
    private Map<String, Object> sessionProperties;

    @BeforeEach
    void setUp() {
        endpoint = new RealtimeEndpoint(registry, riderDao, restaurantDao, orderMessageDao, userDao);
        sessionProperties = new HashMap<>();
        lenient().when(session.getUserProperties()).thenReturn(sessionProperties);
        lenient().when(session.isOpen()).thenReturn(true);
        lenient().when(session.getBasicRemote()).thenReturn(basicRemote);
    }

    @Test
    @DisplayName("Admin Role is authorized for all realtime channels without restrictions")
    void testAdminAuthorizedForAnyChannel() {
        assertTrue(endpoint.isAuthorizedForChannel(1L, "ADMIN", "admin:feed"));
        assertTrue(endpoint.isAuthorizedForChannel(1L, "ADMIN", "user:99"));
        assertTrue(endpoint.isAuthorizedForChannel(1L, "ADMIN", "order:501"));
        assertTrue(endpoint.isAuthorizedForChannel(1L, "ADMIN", "rider:12"));
        assertTrue(endpoint.isAuthorizedForChannel(1L, "ADMIN", "restaurant:7"));
    }

    @Test
    @DisplayName("Customer subscription authorization is scoped to own user ID and allowed orders")
    void testCustomerChannelSubscriptionAuthorization() {
        long customerUserId = 10L;
        String role = "CUSTOMER";

        // Admin feed is forbidden to customer
        assertFalse(endpoint.isAuthorizedForChannel(customerUserId, role, "admin:feed"));

        // Own user channel allowed
        assertTrue(endpoint.isAuthorizedForChannel(customerUserId, role, "user:10"));

        // Another customer's user channel is forbidden
        assertFalse(endpoint.isAuthorizedForChannel(customerUserId, role, "user:11"));

        // Order subscription requires chat/order membership check
        when(orderMessageDao.isUserAllowedInOrderChat(501L, customerUserId, role)).thenReturn(true);
        when(orderMessageDao.isUserAllowedInOrderChat(502L, customerUserId, role)).thenReturn(false);

        assertTrue(endpoint.isAuthorizedForChannel(customerUserId, role, "order:501"));
        assertFalse(endpoint.isAuthorizedForChannel(customerUserId, role, "order:502"));
    }

    @Test
    @DisplayName("Rider channel subscription strictly verifies rider profile ownership")
    void testRiderChannelSubscriptionAuthorization() {
        long riderUserId = 20L;
        String role = "RIDER";

        RiderProfile ownProfile = new RiderProfile();
        ownProfile.setId(5L);
        ownProfile.setUserId(riderUserId);

        RiderProfile foreignProfile = new RiderProfile();
        foreignProfile.setId(8L);
        foreignProfile.setUserId(99L);

        when(riderDao.findById(5L)).thenReturn(ownProfile);
        when(riderDao.findById(8L)).thenReturn(foreignProfile);
        when(riderDao.findById(999L)).thenReturn(null);

        // Own rider channel
        assertTrue(endpoint.isAuthorizedForChannel(riderUserId, role, "rider:5"));

        // Foreign rider channel
        assertFalse(endpoint.isAuthorizedForChannel(riderUserId, role, "rider:8"));

        // Non-existent rider channel
        assertFalse(endpoint.isAuthorizedForChannel(riderUserId, role, "rider:999"));
    }

    @Test
    @DisplayName("Restaurant channel subscription strictly verifies restaurant ownership")
    void testRestaurantChannelSubscriptionAuthorization() {
        long partnerUserId = 30L;
        String role = "RESTAURANT";

        Restaurant ownRestaurant = new Restaurant();
        ownRestaurant.setId(14L);
        ownRestaurant.setUserId(partnerUserId);

        Restaurant foreignRestaurant = new Restaurant();
        foreignRestaurant.setId(15L);
        foreignRestaurant.setUserId(77L);

        when(restaurantDao.findById(14L)).thenReturn(ownRestaurant);
        when(restaurantDao.findById(15L)).thenReturn(foreignRestaurant);

        // Own restaurant channel
        assertTrue(endpoint.isAuthorizedForChannel(partnerUserId, role, "restaurant:14"));

        // Competitor restaurant channel
        assertFalse(endpoint.isAuthorizedForChannel(partnerUserId, role, "restaurant:15"));
    }

    @Test
    @DisplayName("WebSocket Rate Limiter permits 40 messages and throttles 41st message within 10s window")
    void testWebSocketRateLimiterSlidingWindow() throws IOException {
        for (int i = 1; i <= 40; i++) {
            boolean allowed = endpoint.checkRateLimit(session);
            assertTrue(allowed, "Message " + i + " should be allowed under 40 msg/10s limit");
        }

        // 41st message must be rejected and rate limit warning sent
        boolean blocked = endpoint.checkRateLimit(session);
        assertFalse(blocked, "41st message within 10s must be throttled");
        verify(basicRemote, atLeastOnce()).sendText(contains("rate_limited"));
    }

    @Test
    @DisplayName("Oversized WebSocket messages (>64KB) immediately close session with TOO_BIG")
    void testOversizedFrameRejected() throws IOException {
        StringBuilder largePayload = new StringBuilder(70000);
        for (int i = 0; i < 70000; i++) {
            largePayload.append("A");
        }

        endpoint.onMessage(largePayload.toString(), session);

        verify(session, times(1)).close(argThat(closeReason ->
                closeReason.getCloseCode().getCode() == CloseReason.CloseCodes.TOO_BIG.getCode()
        ));
    }

    @Test
    @DisplayName("OrderMessage model validates integrity of chat persistence fields")
    void testOrderChatMessageModelIntegrity() {
        OrderMessage msg = new OrderMessage();
        msg.setId(101L);
        msg.setOrderId(501L);
        msg.setSenderUserId(10L);
        msg.setSenderRole("CUSTOMER");
        msg.setRecipientRole("RIDER");
        msg.setMessageText("Please don't ring the bell, baby is sleeping");
        msg.setSenderName("Aarav Sharma");
        Timestamp now = Timestamp.from(Instant.now());
        msg.setCreatedAt(now);

        assertEquals(101L, msg.getId());
        assertEquals(501L, msg.getOrderId());
        assertEquals(10L, msg.getSenderUserId());
        assertEquals("CUSTOMER", msg.getSenderRole());
        assertEquals("RIDER", msg.getRecipientRole());
        assertEquals("Please don't ring the bell, baby is sleeping", msg.getMessageText());
        assertEquals("Aarav Sharma", msg.getSenderName());
        assertEquals(now, msg.getCreatedAt());
    }
}
