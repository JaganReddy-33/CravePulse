package com.foodplatform.filter;

import com.foodplatform.util.JsonUtil;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebFilter("/*")
public class SecurityHeadersFilter implements Filter {

    private static final long MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Security response headers
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        res.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "frame-src https://api.razorpay.com; " +
                "frame-ancestors 'none';");

        // Request size limit enforcement
        long contentLength = req.getContentLengthLong();
        if (contentLength > MAX_REQUEST_SIZE_BYTES) {
            JsonUtil.sendError(res, 413, "Payload Too Large. Maximum allowed request size is 10MB.");
            return;
        }

        chain.doFilter(request, response);
    }
}
