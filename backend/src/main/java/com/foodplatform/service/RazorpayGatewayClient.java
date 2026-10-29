package com.foodplatform.service;

import com.foodplatform.config.AppProperties;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

public class RazorpayGatewayClient {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayGatewayClient.class);
    private static final String RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

    private final HttpClient httpClient;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;

    public RazorpayGatewayClient() {
        this(
                AppProperties.getRazorpayKeyId(),
                AppProperties.getRazorpayKeySecret(),
                AppProperties.getRazorpayWebhookSecret(),
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .build()
        );
    }

    public RazorpayGatewayClient(String keyId, String keySecret, String webhookSecret, HttpClient httpClient) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.httpClient = httpClient;
    }

    /**
     * Creates an order with Razorpay Orders API.
     * Converts rupees to paise (e.g. ₹250.50 -> 25050 paise).
     */
    public JsonObject createOrder(BigDecimal amountInRupees, String receipt, Map<String, String> notes) {
        long amountInPaise = amountInRupees.multiply(BigDecimal.valueOf(100)).longValue();

        JsonObject body = new JsonObject();
        body.addProperty("amount", amountInPaise);
        body.addProperty("currency", "INR");
        body.addProperty("receipt", receipt != null ? receipt : "receipt_" + System.currentTimeMillis());

        if (notes != null && !notes.isEmpty()) {
            JsonObject notesObj = new JsonObject();
            notes.forEach(notesObj::addProperty);
            body.add("notes", notesObj);
        }

        requireCredentials();

        try {
            String authHeader = "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RAZORPAY_API_BASE + "/orders"))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return JsonParser.parseString(response.body()).getAsJsonObject();
            } else {
                logger.warn("Razorpay API create order returned status {}: {}", response.statusCode(), response.body());
                throw new IllegalStateException("Payment gateway rejected the request");
            }
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new IllegalStateException("Payment gateway unavailable; payment has not been completed", e);
        }
    }

    /**
     * Verifies payment signature using HMAC-SHA256 with constant-time equality check.
     */
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
            return false;
        }

        try {
            String data = razorpayOrderId + "|" + razorpayPaymentId;
            String expected = calculateHmacSha256(data, keySecret);
            boolean matches = MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    razorpaySignature.trim().getBytes(StandardCharsets.UTF_8)
            );
            return matches;
        } catch (Exception e) {
            logger.error("Error verifying Razorpay signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifies webhook signature using HMAC-SHA256 with constant-time equality check.
     */
    public boolean verifyWebhookSignature(String payload, String signatureHeader) {
        if (payload == null || signatureHeader == null || webhookSecret == null || webhookSecret.isBlank()) {
            return false;
        }

        try {
            String expected = calculateHmacSha256(payload, webhookSecret);
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            logger.error("Error verifying Razorpay webhook signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Triggers a refund for a payment via Razorpay Refund API.
     */
    public JsonObject createRefund(String razorpayPaymentId, BigDecimal refundAmountInRupees, String reason) {
        long amountInPaise = refundAmountInRupees.multiply(BigDecimal.valueOf(100)).longValue();

        JsonObject body = new JsonObject();
        body.addProperty("amount", amountInPaise);
        body.addProperty("speed", "optimum");
        JsonObject notes = new JsonObject();
        notes.addProperty("reason", reason != null ? reason : "Order cancellation refund");
        body.add("notes", notes);

        requireCredentials();

        try {
            String authHeader = "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RAZORPAY_API_BASE + "/payments/" + razorpayPaymentId + "/refund"))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return JsonParser.parseString(response.body()).getAsJsonObject();
            } else {
                logger.warn("Razorpay Refund API returned status {}: {}", response.statusCode(), response.body());
                throw new IllegalStateException("Refund gateway rejected the request");
            }
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new IllegalStateException("Refund has not been processed; gateway unavailable", e);
        }
    }

    public static String calculateHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC-SHA256", e);
        }
    }

    private void requireCredentials() {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank() || keyId.contains("demo") || keyId.contains("placeholder") || keyId.contains("your_key")) {
            throw new IllegalStateException("Online payments are not configured");
        }
    }

    public String getKeyId() {
        return keyId;
    }
}
