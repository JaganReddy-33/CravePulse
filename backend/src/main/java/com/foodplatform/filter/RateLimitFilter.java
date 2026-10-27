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

    private static final int MAX_REQUESTS_PER_MINUTE = 200;
    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        long windowStart = System.currentTimeMillis();
        AtomicInteger count = new AtomicInteger(0);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Skip static or websocket upgrade
        if ("websocket".equalsIgnoreCase(req.getHeader("Upgrade"))) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = req.getRemoteAddr();
        long now = System.currentTimeMillis();

        RequestCounter counter = requestCounts.computeIfAbsent(clientIp, k -> new RequestCounter());
        synchronized (counter) {
            if (now - counter.windowStart > 60000) {
                counter.windowStart = now;
                counter.count.set(0);
            }
        }

        if (counter.count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
            JsonUtil.sendError(res, 429, "Rate limit exceeded. Too many requests. Please wait a moment.");
            return;
        }

        chain.doFilter(request, response);
    }
}
