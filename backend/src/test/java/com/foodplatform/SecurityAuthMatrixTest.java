package com.foodplatform;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.filter.CorsFilter;
import com.foodplatform.filter.SecurityHeadersFilter;
import com.foodplatform.service.AuthService;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityAuthMatrixTest {

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
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
    }

    @Test
    @DisplayName("Password policy should enforce minimum 8 characters with letters and numbers")
    void testPasswordPolicyValidation() {
        // Valid passwords
        assertDoesNotThrow(() -> authService.validateCredentials("user@example.com", "SecurePass123", "+919876543210"));
        assertDoesNotThrow(() -> authService.validateCredentials("test@domain.in", "Abcd1234", "9876543210"));

        // Weak passwords (< 8 chars, no digit, or no letter)
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@example.com", "short1", "+919876543210"));
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@example.com", "alllettersnodigit", "+919876543210"));
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@example.com", "1234567890", "+919876543210"));
    }

    @Test
    @DisplayName("Phone validation should enforce Indian mobile formats (+91 optional, 10 digits starting 6-9)")
    void testPhoneValidation() {
        // Valid phone numbers
        assertDoesNotThrow(() -> authService.validateCredentials("user@example.com", "ValidPass1", "9876543210"));
        assertDoesNotThrow(() -> authService.validateCredentials("user@example.com", "ValidPass1", "+919876543210"));
        assertDoesNotThrow(() -> authService.validateCredentials("user@example.com", "ValidPass1", "+916301234567"));

        // Invalid phone numbers
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@example.com", "ValidPass1", "1234567890"));
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@example.com", "ValidPass1", "98765"));
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@example.com", "ValidPass1", "+14155552671"));
    }

    @Test
    @DisplayName("Email validation should reject invalid syntax")
    void testEmailValidation() {
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("invalid-email", "ValidPass1", "9876543210"));
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("@domain.com", "ValidPass1", "9876543210"));
        assertThrows(IllegalArgumentException.class, () ->
                authService.validateCredentials("user@domain", "ValidPass1", "9876543210"));
    }

    @Test
    @DisplayName("Public registration must reject role escalation attempts (ADMIN, RIDER, RESTAURANT_OWNER)")
    void testRegistrationRoleEscalationPrevention() {
        // Any attempt to pass ADMIN or RESTAURANT_OWNER to public registration endpoint must fail immediately
        assertThrows(IllegalArgumentException.class, () ->
                authService.register("Attacker", "attacker@test.com", "9876543210", "Pass1234", "ADMIN"));

        assertThrows(IllegalArgumentException.class, () ->
                authService.register("Partner Bypass", "partner@test.com", "9876543210", "Pass1234", "RESTAURANT_OWNER"));

        assertThrows(IllegalArgumentException.class, () ->
                authService.register("Rider Bypass", "rider@test.com", "9876543210", "Pass1234", "RIDER"));
    }

    @Test
    @DisplayName("CORS filter must grant allow headers only to configured origins and reject untrusted origins")
    void testCorsFilterOriginAllowlist() throws ServletException, IOException {
        CorsFilter filter = new CorsFilter();
        filter.init(null);

        // 1. Trusted origin: http://localhost:5173
        when(request.getHeader("Origin")).thenReturn("http://localhost:5173");
        filter.doFilter(request, response, filterChain);
        verify(response).setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        verify(response).setHeader("Access-Control-Allow-Credentials", "true");
        verify(response).setHeader("Vary", "Origin");

        // 2. Untrusted origin: https://malicious-site.com
        reset(response);
        when(request.getHeader("Origin")).thenReturn("https://malicious-site.com");
        filter.doFilter(request, response, filterChain);
        verify(response, never()).setHeader("Access-Control-Allow-Origin", "https://malicious-site.com");
        verify(response, never()).setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Test
    @DisplayName("SecurityHeadersFilter must set defensive headers and block oversized payloads")
    void testSecurityHeadersAndPayloadLimits() throws ServletException, IOException {
        SecurityHeadersFilter filter = new SecurityHeadersFilter();

        // 1. Normal request sets security headers
        when(request.getContentLengthLong()).thenReturn(1024L);
        filter.doFilter(request, response, filterChain);

        verify(response).setHeader("X-Content-Type-Options", "nosniff");
        verify(response).setHeader("X-Frame-Options", "DENY");
        verify(response).setHeader("X-XSS-Protection", "1; mode=block");
        verify(response).setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        verify(filterChain).doFilter(request, response);

        // 2. Oversized payload (> 10MB) returns HTTP 413
        reset(response, filterChain);
        StringWriter writer = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(writer));
        when(request.getContentLengthLong()).thenReturn(15 * 1024 * 1024L);

        filter.doFilter(request, response, filterChain);
        verify(response).setStatus(413);
        verify(filterChain, never()).doFilter(request, response);
    }
}
