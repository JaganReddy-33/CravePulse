package com.foodplatform.filter;

import com.foodplatform.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

@WebFilter("/*")
public class JwtAuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String authHeader = req.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            Claims claims = JwtUtil.validateAndExtractClaims(token);
            if (claims != null) {
                try {
                    req.setAttribute("userId", Long.parseLong(claims.getSubject()));
                    req.setAttribute("role", claims.get("role"));
                    req.setAttribute("email", claims.get("email"));
                    req.setAttribute("fullName", claims.get("name"));
                } catch (Exception ignored) {
                }
            }
        }

        chain.doFilter(request, response);
    }
}
