package com.foodplatform.util;

import com.foodplatform.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

public final class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    private static final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(
            AppProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8));

    private JwtUtil() {
    }

    public static String generateAccessToken(long userId, String email, String role, String fullName) {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        Date expiryDate = new Date(nowMillis + AppProperties.getJwtExpirationMillis());

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .claim("name", fullName)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(SECRET_KEY)
                .compact();
    }

    public static String generateRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
    }

    public static Claims validateAndExtractClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(SECRET_KEY)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("Invalid JWT token: {}", e.getMessage());
            return null;
        }
    }

    public static Long extractUserId(String token) {
        Claims claims = validateAndExtractClaims(token);
        if (claims != null) {
            try {
                return Long.parseLong(claims.getSubject());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public static String extractRole(String token) {
        Claims claims = validateAndExtractClaims(token);
        return claims != null ? (String) claims.get("role") : null;
    }
}
