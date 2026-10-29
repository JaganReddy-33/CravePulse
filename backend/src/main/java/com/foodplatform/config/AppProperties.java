package com.foodplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.Properties;

public final class AppProperties {

    private static final Logger logger = LoggerFactory.getLogger(AppProperties.class);
    private static final Properties props = new Properties();

    static {
        try (InputStream is = AppProperties.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (is != null) {
                props.load(is);
                logger.info("Loaded configuration from application.properties");
            } else {
                logger.warn("application.properties not found on classpath, relying on environment variables");
            }
        } catch (Exception e) {
            logger.warn("Could not load application.properties: {}", e.getMessage());
        }
    }

    private static final AppProperties INSTANCE = new AppProperties();

    private AppProperties() {
    }

    public static AppProperties getInstance() {
        return INSTANCE;
    }

    private static String getProperty(String key, String envVar, String defaultValue) {
        String val = System.getenv(envVar);
        if (val != null && !val.isBlank()) {
            return val;
        }
        val = props.getProperty(key);
        if (val != null && !val.isBlank()) {
            return val;
        }
        return defaultValue;
    }

    public static String getDbUrl() {
        return getProperty("db.url", "DB_URL",
                "jdbc:mysql://localhost:3306/food_delivery_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8");
    }

    public static String getDbUser() {
        return getProperty("db.user", "DB_USER", "root");
    }

    public static String getDbPassword() {
        String pass = System.getenv("DB_PASSWORD");
        if (pass == null || pass.isBlank()) {
            pass = props.getProperty("db.password");
        }
        return (pass != null) ? pass : "";
    }

    public static String getJwtSecret() {
        String secret = getProperty("jwt.secret", "JWT_SECRET", "CravePulseSuperSecureProductionSecretKeyForSigning2026SigningKey!");
        if (secret == null || secret.trim().length() < 32) {
            return "CravePulseSuperSecureProductionSecretKeyForSigning2026SigningKey!";
        }
        return secret.trim();
    }

    public static long getJwtExpirationMillis() {
        String val = getProperty("jwt.expirationMillis", "JWT_EXPIRATION_MILLIS", "900000"); // 15 minutes
        try {
            return Long.parseLong(val);
        } catch (NumberFormatException e) {
            return 900000L;
        }
    }

    public static long getRefreshTokenExpirationMillis() {
        String val = getProperty("jwt.refreshTokenExpirationMillis", "JWT_REFRESH_EXPIRATION_MILLIS", "604800000");
        try {
            return Long.parseLong(val);
        } catch (NumberFormatException e) {
            return 604800000L;
        }
    }

    public static int getServerPort() {
        String portStr = getProperty("server.port", "PORT", "8081");
        try {
            return Integer.parseInt(portStr);
        } catch (NumberFormatException e) {
            return 8081;
        }
    }

    public static String getCorsAllowedOrigins() {
        return getProperty("cors.allowedOrigins", "CORS_ORIGINS",
                "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174");
    }

    public static String getRazorpayKeyId() {
        return getProperty("razorpay.keyId", "RAZORPAY_KEY_ID", "rzp_test_cravepulse_demo2026");
    }

    public static String getRazorpayKeySecret() {
        return getProperty("razorpay.keySecret", "RAZORPAY_KEY_SECRET", "rzp_secret_cravepulse_demo_secure987654");
    }

    public static String getRazorpayWebhookSecret() {
        return getProperty("razorpay.webhookSecret", "RAZORPAY_WEBHOOK_SECRET", "rzp_webhook_secret_cravepulse2026_demo");
    }

    public static java.math.BigDecimal getCodMaxLimit() {
        String val = getProperty("payment.cod.maxLimit", "PAYMENT_COD_MAX_LIMIT", "2000.00");
        try {
            return new java.math.BigDecimal(val.trim());
        } catch (Exception e) {
            return new java.math.BigDecimal("2000.00");
        }
    }

    public static int getRiderAcceptTimeoutSeconds() {
        String val = getProperty("dispatch.riderAcceptTimeoutSeconds", "DISPATCH_RIDER_ACCEPT_TIMEOUT_SECONDS", "30");
        try {
            return Integer.parseInt(val.trim());
        } catch (Exception e) {
            return 30;
        }
    }

    public static double getDispatchMaxSearchRadiusKm() {
        String val = getProperty("dispatch.maxSearchRadiusKm", "DISPATCH_MAX_SEARCH_RADIUS_KM", "15.0");
        try {
            return Double.parseDouble(val.trim());
        } catch (Exception e) {
            return 15.0;
        }
    }

    public static java.math.BigDecimal getFairPayBaseFare() {
        String val = getProperty("dispatch.fairPayBaseFare", "DISPATCH_FAIR_PAY_BASE_FARE", "35.00");
        try {
            return new java.math.BigDecimal(val.trim());
        } catch (Exception e) {
            return new java.math.BigDecimal("35.00");
        }
    }

    public static java.math.BigDecimal getFairPayPerKmRate() {
        String val = getProperty("dispatch.fairPayPerKmRate", "DISPATCH_FAIR_PAY_PER_KM_RATE", "12.00");
        try {
            return new java.math.BigDecimal(val.trim());
        } catch (Exception e) {
            return new java.math.BigDecimal("12.00");
        }
    }
}
