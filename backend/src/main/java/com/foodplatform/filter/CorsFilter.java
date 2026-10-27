package com.foodplatform.filter;

import com.foodplatform.config.AppProperties;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@WebFilter("/*")
public class CorsFilter implements Filter {

    private Set<String> allowedOrigins;

    @Override
    public void init(FilterConfig filterConfig) {
        loadAllowedOrigins();
    }

    private synchronized Set<String> getAllowedOrigins() {
        if (allowedOrigins == null) {
            loadAllowedOrigins();
        }
        return allowedOrigins;
    }

    private void loadAllowedOrigins() {
        String configured = AppProperties.getCorsAllowedOrigins();
        if (configured != null && !configured.isBlank()) {
            allowedOrigins = Arrays.stream(configured.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());
        } else {
            allowedOrigins = Set.of("http://localhost:5173", "http://127.0.0.1:5173");
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String origin = req.getHeader("Origin");
        boolean isAllowedOrigin = origin != null && getAllowedOrigins().contains(origin);

        if (isAllowedOrigin) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Vary", "Origin");
        }

        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With, X-Idempotency-Key");
        res.setHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, response);
    }
}
