package com.foodplatform.filter;

import com.foodplatform.service.MetricsService;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.UUID;

@WebFilter("/*")
public class RequestLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String requestId = req.getHeader("X-Request-ID");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }

        res.setHeader("X-Request-ID", requestId);
        MDC.put("requestId", requestId);
        MetricsService.getInstance().incrementTotalRequests();

        long startTime = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            if (!"OPTIONS".equalsIgnoreCase(req.getMethod()) && !"websocket".equalsIgnoreCase(req.getHeader("Upgrade"))) {
                logger.info("[reqId={}] {} {} -> status={} ({}ms)", requestId, req.getMethod(), req.getRequestURI(), res.getStatus(), duration);
            }
            MDC.remove("requestId");
        }
    }
}
