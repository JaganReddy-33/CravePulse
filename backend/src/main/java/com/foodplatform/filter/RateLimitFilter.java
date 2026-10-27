package com.foodplatform.filter;

import com.foodplatform.util.JsonUtil;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@WebFilter("/*")
public class RateLimitFilter implements Filter {

    private static final int MAX_REQUESTS_PER_MINUTE = 300;
    private static final int MAX_LOGIN_REQUESTS_PER_MINUTE = 15;
    private static final int MAX_MAP_SIZE_BEFORE_CLEANUP = 2000;
    private static final long ENTRY_EXPIRY_MILLIS = 5 * 60 * 1000L; // 5 minutes

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, RequestCounter> loginAttempts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        volatile long windowStart;
        final AtomicInteger count;

        RequestCounter(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(0);
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Skip websocket upgrade
        if ("websocket".equalsIgnoreCase(req.getHeader("Upgrade"))) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(req);
        long now = System.currentTimeMillis();

        // 1. General IP Rate Limit
        if (!checkLimit(requestCounts, clientIp, now, MAX_REQUESTS_PER_MINUTE)) {
            cleanUpStaleEntries(requestCounts, now);
            JsonUtil.sendError(res, 429, "Rate limit exceeded. Too many requests. Please wait a moment.");
            return;
        }

        // 2. Strict Auth / Login Rate Limit per IP
        String uri = req.getRequestURI();
        if (uri != null && uri.endsWith("/auth/login") && "POST".equalsIgnoreCase(req.getMethod())) {
            if (!checkLimit(loginAttempts, clientIp, now, MAX_LOGIN_REQUESTS_PER_MINUTE)) {
                cleanUpStaleEntries(loginAttempts, now);
                JsonUtil.sendError(res, 429, "Too many login attempts. Please wait 1 minute before retrying.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean checkLimit(Map<String, RequestCounter> map, String key, long now, int maxRequests) {
        RequestCounter counter = map.computeIfAbsent(key, k -> new RequestCounter(now));
        synchronized (counter) {
            if (now - counter.windowStart > 60000) {
                counter.windowStart = now;
                counter.count.set(0);
            }
        }
        return counter.count.incrementAndGet() <= maxRequests;
    }

    private String extractClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            String first = parts[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return req.getRemoteAddr();
    }

    private void cleanUpStaleEntries(Map<String, RequestCounter> map, long now) {
        if (map.size() > MAX_MAP_SIZE_BEFORE_CLEANUP) {
            map.entrySet().removeIf(entry -> now - entry.getValue().windowStart > ENTRY_EXPIRY_MILLIS);
        }
    }
}
