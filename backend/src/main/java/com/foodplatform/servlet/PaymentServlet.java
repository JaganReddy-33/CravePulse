package com.foodplatform.servlet;

import com.foodplatform.config.AppProperties;
import com.foodplatform.service.PaymentService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@WebServlet("/api/payments/*")
public class PaymentServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(PaymentServlet.class);

    private final PaymentService paymentService;

    public PaymentServlet() {
        this.paymentService = new PaymentService();
    }

    public PaymentServlet(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/config".equals(path) || "".equals(path)) {
            Map<String, Object> config = Map.of(
                    "razorpayKeyId", AppProperties.getRazorpayKeyId(),
                    "codMaxLimit", AppProperties.getCodMaxLimit()
            );
            JsonUtil.sendSuccess(res, 200, "Payment configuration loaded", config);
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        // 1. Webhook endpoint: POST /api/payments/webhook
        if ("/webhook".equals(path)) {
            String signature = req.getHeader("X-Razorpay-Signature");
            if (signature == null || signature.isBlank()) {
                JsonUtil.sendError(res, 400, "Missing X-Razorpay-Signature header");
                return;
            }

            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String rawPayload = sb.toString();

            try {
                Map<String, Object> result = paymentService.handleWebhook(rawPayload, signature);
                JsonUtil.sendSuccess(res, 200, "Webhook processed", result);
            } catch (IllegalArgumentException e) {
                logger.warn("Webhook verification rejected: {}", e.getMessage());
                JsonUtil.sendError(res, 400, e.getMessage());
            } catch (Exception e) {
                logger.error("Error processing webhook", e);
                JsonUtil.sendError(res, 500, "Webhook processing error");
            }
            return;
        }

        // All subsequent endpoints require authenticated user session
        if (!requireAuthenticated(req, res)) return;
        Long userId = getAuthenticatedUserId(req);

        // 2. Razorpay Order Creation: POST /api/payments/create
        if ("/create".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("orderId")) {
                JsonUtil.sendError(res, 400, "orderId is required");
                return;
            }

            long orderId = body.get("orderId").getAsLong();
            String idempotencyKey = body.has("idempotencyKey") && !body.get("idempotencyKey").isJsonNull()
                    ? body.get("idempotencyKey").getAsString() : null;

            try {
                Map<String, Object> rzpOrder = paymentService.createRazorpayOrder(orderId, userId, idempotencyKey);
                JsonUtil.sendSuccess(res, 200, "Razorpay order initiated", rzpOrder);
            } catch (IllegalArgumentException | IllegalStateException e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            } catch (Exception e) {
                logger.error("Failed to initiate Razorpay order for #{}", orderId, e);
                JsonUtil.sendError(res, 500, "Could not initiate payment session: " + e.getMessage());
            }
            return;
        }

        // 3. Payment Verification: POST /api/payments/verify
        if ("/verify".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("razorpayOrderId") || !body.has("razorpayPaymentId") || !body.has("razorpaySignature")) {
                JsonUtil.sendError(res, 400, "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required");
                return;
            }

            String razorpayOrderId = body.get("razorpayOrderId").getAsString();
            String razorpayPaymentId = body.get("razorpayPaymentId").getAsString();
            String razorpaySignature = body.get("razorpaySignature").getAsString();

            try {
                Map<String, Object> verification = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, userId);
                JsonUtil.sendSuccess(res, 200, "Payment verified successfully", verification);
            } catch (IllegalArgumentException e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            } catch (Exception e) {
                logger.error("Error verifying payment", e);
                JsonUtil.sendError(res, 500, "Internal error verifying payment: " + e.getMessage());
            }
            return;
        }

        // 4. Wallet Payment: POST /api/payments/wallet
        if ("/wallet".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("orderId")) {
                JsonUtil.sendError(res, 400, "orderId is required");
                return;
            }

            long orderId = body.get("orderId").getAsLong();
            try {
                Map<String, Object> walletResult = paymentService.processWalletPayment(orderId, userId);
                JsonUtil.sendSuccess(res, 200, "Wallet payment processed successfully", walletResult);
            } catch (IllegalArgumentException | IllegalStateException e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            } catch (Exception e) {
                logger.error("Error processing wallet payment", e);
                JsonUtil.sendError(res, 500, "Wallet payment error: " + e.getMessage());
            }
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
