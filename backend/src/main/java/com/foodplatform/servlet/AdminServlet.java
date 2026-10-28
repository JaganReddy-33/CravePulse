package com.foodplatform.servlet;

import com.foodplatform.dao.*;
import com.foodplatform.daoImpl.*;
import com.foodplatform.model.*;
import com.foodplatform.service.AnalyticsService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@WebServlet("/api/admin/*")
public class AdminServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final AnalyticsService analyticsService = new AnalyticsService();
    private final UserDao userDao = new UserDaoImpl();
    private final RestaurantDao restaurantDao = new RestaurantDaoImpl();
    private final RiderDao riderDao = new RiderDaoImpl();
    private final OrderDao orderDao = new OrderDaoImpl();
    private final DisputeDao disputeDao = new DisputeDaoImpl();
    private final CouponDao couponDao = new CouponDaoImpl();
    private final PlatformSettingDao platformSettingDao = new PlatformSettingDaoImpl();
    private final AdminAuditDao adminAuditDao = new AdminAuditDaoImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "ADMIN")) return;

        // 1. CSV Data Exports
        if ("/export".equals(path)) {
            handleCsvExport(req, res);
            return;
        }

        switch (path) {
            case "/metrics" -> {
                Map<String, Object> metrics = analyticsService.getAdminPlatformMetrics();
                JsonUtil.sendSuccess(res, 200, "Platform metrics", metrics);
            }
            case "/users" -> {
                String query = req.getParameter("query");
                String role = req.getParameter("role");
                String status = req.getParameter("status");
                int limit = parseIntOrDefault(req.getParameter("limit"), 50);
                int offset = parseIntOrDefault(req.getParameter("offset"), 0);
                List<User> users = userDao.searchUsers(query, role, status, limit, offset);
                JsonUtil.sendSuccess(res, 200, "User directory", users);
            }
            case "/restaurants" -> {
                List<Restaurant> list = restaurantDao.listAllRestaurants(100, 0);
                JsonUtil.sendSuccess(res, 200, "Restaurant partners", list);
            }
            case "/riders" -> {
                List<RiderProfile> list = riderDao.listAllRiders(100, 0);
                JsonUtil.sendSuccess(res, 200, "Delivery riders", list);
            }
            case "/orders" -> {
                List<Order> list = orderDao.listAllOrders(100, 0);
                JsonUtil.sendSuccess(res, 200, "Platform orders", list);
            }
            case "/live-map" -> {
                List<Restaurant> rests = restaurantDao.listAllRestaurants(100, 0);
                List<RiderProfile> riders = riderDao.listAllRiders(100, 0);
                List<Order> activeOrders = orderDao.listAllOrders(100, 0).stream()
                        .filter(o -> "ACCEPTED".equalsIgnoreCase(o.getStatus())
                                || "PREPARING".equalsIgnoreCase(o.getStatus())
                                || "READY".equalsIgnoreCase(o.getStatus())
                                || "PICKED_UP".equalsIgnoreCase(o.getStatus()))
                        .collect(Collectors.toList());

                Map<String, Object> mapData = new HashMap<>();
                mapData.put("restaurants", rests);
                mapData.put("riders", riders);
                mapData.put("activeOrders", activeOrders);
                JsonUtil.sendSuccess(res, 200, "Live ops map telemetry", mapData);
            }
            case "/approvals/pending", "/pending-approvals" -> {
                List<Restaurant> pendingRestaurants = restaurantDao.listAllRestaurants(100, 0).stream()
                        .filter(r -> !r.isKycApproved())
                        .collect(Collectors.toList());
                List<RiderProfile> pendingRiders = riderDao.listAllRiders(100, 0).stream()
                        .filter(r -> !r.isKycApproved())
                        .collect(Collectors.toList());
                Map<String, Object> pending = new HashMap<>();
                pending.put("restaurants", pendingRestaurants);
                pending.put("riders", pendingRiders);
                JsonUtil.sendSuccess(res, 200, "Pending KYC approvals", pending);
            }
            case "/coupons" -> {
                List<Coupon> coupons = couponDao.listAllCoupons();
                JsonUtil.sendSuccess(res, 200, "Coupons list", coupons);
            }
            case "/settings" -> {
                List<PlatformSetting> settings = platformSettingDao.listAllSettings();
                JsonUtil.sendSuccess(res, 200, "Platform dynamic settings", settings);
            }
            case "/audit-logs" -> {
                int limit = parseIntOrDefault(req.getParameter("limit"), 50);
                int offset = parseIntOrDefault(req.getParameter("offset"), 0);
                List<AdminAuditLog> logs = adminAuditDao.listRecentLogs(limit, offset);
                JsonUtil.sendSuccess(res, 200, "Admin audit trail", logs);
            }
            default -> JsonUtil.sendError(res, 404, "Admin endpoint not found: " + path);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "ADMIN")) return;

        Long adminId = getAuthenticatedUserId(req);
        User adminUser = adminId != null ? userDao.findById(adminId) : null;
        String adminName = adminUser != null ? adminUser.getFullName() : "Admin Ops";
        String ip = req.getRemoteAddr();

        // 1. Restaurant KYC Approval / Revocation
        if ((path.startsWith("/restaurant/") && path.endsWith("/kyc")) || path.startsWith("/approvals/restaurant/")) {
            Long restId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean approved = body == null || !body.has("approved") || body.get("approved").getAsBoolean();
            String reason = body != null && body.has("reason") ? body.get("reason").getAsString() : "KYC compliance verification";

            restaurantDao.updateKyc(restId, approved);
            adminAuditDao.logAction(adminId, adminName, approved ? "APPROVE_RESTAURANT_KYC" : "REVOKE_RESTAURANT_KYC",
                    "RESTAURANT", String.valueOf(restId), reason, ip);

            JsonUtil.sendSuccess(res, 200, "Restaurant KYC " + (approved ? "approved" : "revoked"),
                    Map.of("restaurantId", restId, "isKycApproved", approved));
            return;
        }

        // 2. Rider KYC Approval / Revocation
        if ((path.startsWith("/rider/") && path.endsWith("/kyc")) || path.startsWith("/approvals/rider/")) {
            Long riderId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean approved = body == null || !body.has("approved") || body.get("approved").getAsBoolean();
            String reason = body != null && body.has("reason") ? body.get("reason").getAsString() : "License and RC verification";

            riderDao.updateKyc(riderId, approved);
            adminAuditDao.logAction(adminId, adminName, approved ? "APPROVE_RIDER_KYC" : "REVOKE_RIDER_KYC",
                    "RIDER", String.valueOf(riderId), reason, ip);

            JsonUtil.sendSuccess(res, 200, "Rider KYC " + (approved ? "approved" : "revoked"),
                    Map.of("riderId", riderId, "isKycApproved", approved));
            return;
        }

        // 3. User Suspension / Status Moderation
        if (path.startsWith("/users/") && path.endsWith("/status")) {
            Long userId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("status")) {
                JsonUtil.sendError(res, 400, "status is required (ACTIVE or SUSPENDED)");
                return;
            }
            String newStatus = body.get("status").getAsString().toUpperCase();
            String reason = body.has("reason") ? body.get("reason").getAsString() : "Admin moderation action";

            userDao.updateUserStatus(userId, newStatus);
            adminAuditDao.logAction(adminId, adminName, "UPDATE_USER_STATUS", "USER",
                    String.valueOf(userId), "Status updated to " + newStatus + ". Reason: " + reason, ip);

            JsonUtil.sendSuccess(res, 200, "User status updated to " + newStatus, Map.of("userId", userId, "status", newStatus));
            return;
        }

        // 4. User Fraud Flag Increment
        if (path.startsWith("/users/") && path.endsWith("/fraud-flag")) {
            Long userId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            String reason = body != null && body.has("reason") ? body.get("reason").getAsString() : "Suspicious claim / chargeback risk";

            userDao.incrementFraudFlag(userId);
            int newCount = userDao.getFraudFlagCount(userId);
            adminAuditDao.logAction(adminId, adminName, "INCREMENT_FRAUD_FLAG", "USER",
                    String.valueOf(userId), "Fraud flag incremented to " + newCount + ". Reason: " + reason, ip);

            JsonUtil.sendSuccess(res, 200, "User fraud flag incremented", Map.of("userId", userId, "fraudFlagCount", newCount));
            return;
        }

        // 5. Coupon Creation
        if ("/coupons".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("code") || !body.has("description") || !body.has("discountValue")) {
                JsonUtil.sendError(res, 400, "code, description, and discountValue are required");
                return;
            }

            Coupon c = new Coupon();
            c.setCode(body.get("code").getAsString());
            c.setDescription(body.get("description").getAsString());
            c.setDiscountType(body.has("discountType") ? body.get("discountType").getAsString() : "PERCENTAGE");
            c.setDiscountValue(body.get("discountValue").getAsBigDecimal());
            c.setMinOrderAmount(body.has("minOrderAmount") ? body.get("minOrderAmount").getAsBigDecimal() : BigDecimal.ZERO);
            c.setMaxDiscountAmount(body.has("maxDiscountAmount") ? body.get("maxDiscountAmount").getAsBigDecimal() : BigDecimal.valueOf(500.00));
            c.setUsageLimit(body.has("usageLimit") ? body.get("usageLimit").getAsInt() : 1000);
            c.setActive(!body.has("isActive") || body.get("isActive").getAsBoolean());
            c.setFirstOrderOnly(body.has("firstOrderOnly") && body.get("firstOrderOnly").getAsBoolean());
            if (body.has("validUntil") && !body.get("validUntil").isJsonNull()) {
                try {
                    c.setValidUntil(Timestamp.valueOf(body.get("validUntil").getAsString()));
                } catch (Exception ignored) {}
            }

            Long couponId = couponDao.createCoupon(c);
            adminAuditDao.logAction(adminId, adminName, "CREATE_COUPON", "COUPON",
                    c.getCode(), "Created coupon " + c.getCode() + " (" + c.getDiscountValue() + " " + c.getDiscountType() + ")", ip);

            JsonUtil.sendSuccess(res, 201, "Coupon created successfully", c);
            return;
        }

        // 6. Coupon Update
        if (path.startsWith("/coupons/") && path.endsWith("/update")) {
            Long couponId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            Coupon c = couponDao.findById(couponId);
            if (c == null) {
                JsonUtil.sendError(res, 404, "Coupon not found: " + couponId);
                return;
            }

            if (body != null) {
                if (body.has("description")) c.setDescription(body.get("description").getAsString());
                if (body.has("discountType")) c.setDiscountType(body.get("discountType").getAsString());
                if (body.has("discountValue")) c.setDiscountValue(body.get("discountValue").getAsBigDecimal());
                if (body.has("minOrderAmount")) c.setMinOrderAmount(body.get("minOrderAmount").getAsBigDecimal());
                if (body.has("maxDiscountAmount")) c.setMaxDiscountAmount(body.get("maxDiscountAmount").getAsBigDecimal());
                if (body.has("usageLimit")) c.setUsageLimit(body.get("usageLimit").getAsInt());
                if (body.has("isActive")) c.setActive(body.get("isActive").getAsBoolean());
                if (body.has("firstOrderOnly")) c.setFirstOrderOnly(body.get("firstOrderOnly").getAsBoolean());
            }

            couponDao.updateCoupon(c);
            adminAuditDao.logAction(adminId, adminName, "UPDATE_COUPON", "COUPON",
                    c.getCode(), "Updated coupon parameters for " + c.getCode(), ip);

            JsonUtil.sendSuccess(res, 200, "Coupon updated successfully", c);
            return;
        }

        // 7. Coupon Toggle
        if (path.startsWith("/coupons/") && path.endsWith("/toggle")) {
            Long couponId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean active = body == null || !body.has("isActive") || body.get("isActive").getAsBoolean();

            couponDao.toggleCoupon(couponId, active);
            adminAuditDao.logAction(adminId, adminName, active ? "ACTIVATE_COUPON" : "DEACTIVATE_COUPON",
                    "COUPON", String.valueOf(couponId), "Toggled coupon active status to " + active, ip);

            JsonUtil.sendSuccess(res, 200, "Coupon status updated", Map.of("couponId", couponId, "isActive", active));
            return;
        }

        // 8. Platform Dynamic Settings Update
        if ("/settings".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("key") || !body.has("value")) {
                JsonUtil.sendError(res, 400, "key and value are required");
                return;
            }

            String key = body.get("key").getAsString();
            String value = body.get("value").getAsString();
            String desc = body.has("description") ? body.get("description").getAsString() : "Updated by ops supervisor";

            platformSettingDao.updateSetting(key, value, desc);
            adminAuditDao.logAction(adminId, adminName, "UPDATE_PLATFORM_SETTING", "SETTINGS",
                    key, "Setting " + key + " updated to " + value, ip);

            JsonUtil.sendSuccess(res, 200, "Platform setting updated", Map.of("key", key, "value", value));
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";
        if (!requireRole(req, res, "ADMIN")) return;

        Long adminId = getAuthenticatedUserId(req);
        User adminUser = adminId != null ? userDao.findById(adminId) : null;
        String adminName = adminUser != null ? adminUser.getFullName() : "Admin Ops";
        String ip = req.getRemoteAddr();

        if (path.startsWith("/coupons/")) {
            Long couponId = parseIdFromPath(req);
            couponDao.deleteCoupon(couponId);
            adminAuditDao.logAction(adminId, adminName, "DELETE_COUPON", "COUPON",
                    String.valueOf(couponId), "Deleted coupon ID " + couponId, ip);
            JsonUtil.sendSuccess(res, 200, "Coupon deleted successfully", Map.of("couponId", couponId));
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    private void handleCsvExport(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String type = req.getParameter("type");
        if (type == null) type = "orders";

        res.setContentType("text/csv; charset=UTF-8");
        res.setHeader("Content-Disposition", "attachment; filename=\"cravepulse_" + type + "_export.csv\"");

        PrintWriter writer = res.getWriter();

        switch (type.toLowerCase()) {
            case "orders" -> {
                writer.println("Order ID,Order Number,Customer ID,Restaurant ID,Rider ID,Status,Subtotal,Delivery Fee,Platform Fee,GST,Total Amount,Payment Mode,Payment Status,Created At");
                List<Order> orders = orderDao.listAllOrders(1000, 0);
                for (Order o : orders) {
                    writer.printf("%d,\"%s\",%d,%d,%s,\"%s\",%.2f,%.2f,%.2f,%.2f,%.2f,\"%s\",\"%s\",\"%s\"%n",
                            o.getId(),
                            escapeCsv(o.getOrderNumber()),
                            o.getCustomerId(),
                            o.getRestaurantId(),
                            o.getRiderId() != null ? String.valueOf(o.getRiderId()) : "",
                            o.getStatus(),
                            o.getSubtotal() != null ? o.getSubtotal().doubleValue() : 0.0,
                            o.getDeliveryFee() != null ? o.getDeliveryFee().doubleValue() : 0.0,
                            o.getPlatformFee() != null ? o.getPlatformFee().doubleValue() : 0.0,
                            o.getGstTax() != null ? o.getGstTax().doubleValue() : 0.0,
                            o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0.0,
                            o.getPaymentMode(),
                            o.getPaymentStatus(),
                            o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
                }
            }
            case "users" -> {
                writer.println("User ID,Full Name,Email,Phone,Role,Status,Wallet Balance,Fraud Flags,Created At");
                List<User> users = userDao.listAllUsers(1000, 0);
                for (User u : users) {
                    writer.printf("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%d,\"%s\"%n",
                            u.getId(),
                            escapeCsv(u.getFullName()),
                            escapeCsv(u.getEmail()),
                            escapeCsv(u.getPhone()),
                            u.getRole(),
                            u.getStatus(),
                            u.getWalletBalance() != null ? u.getWalletBalance().doubleValue() : 0.0,
                            u.getFraudFlagCount(),
                            u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
                }
            }
            case "disputes" -> {
                writer.println("Dispute ID,Order ID,Customer ID,Issue Type,Requested Refund,Auto Approved,Admin Status,Resolution Notes,Created At");
                List<Dispute> disputes = disputeDao.listAllDisputes(null, 1000, 0);
                for (Dispute d : disputes) {
                    writer.printf("%d,%d,%d,\"%s\",%.2f,%s,\"%s\",\"%s\",\"%s\"%n",
                            d.getId(),
                            d.getOrderId(),
                            d.getCustomerId(),
                            d.getIssueType(),
                            d.getRequestedRefundAmount() != null ? d.getRequestedRefundAmount().doubleValue() : 0.0,
                            d.isAutoRefundApproved() ? "YES" : "NO",
                            d.getAdminStatus(),
                            escapeCsv(d.getResolutionNotes()),
                            d.getCreatedAt() != null ? d.getCreatedAt().toString() : "");
                }
            }
            case "audit-logs", "audit" -> {
                writer.println("Log ID,Admin ID,Admin Name,Action,Target Type,Target ID,Details,IP Address,Created At");
                List<AdminAuditLog> logs = adminAuditDao.listRecentLogs(1000, 0);
                for (AdminAuditLog l : logs) {
                    writer.printf("%d,%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                            l.getId(),
                            l.getAdminUserId(),
                            escapeCsv(l.getAdminName()),
                            l.getAction(),
                            l.getTargetType(),
                            escapeCsv(l.getTargetId()),
                            escapeCsv(l.getDetails()),
                            l.getIpAddress(),
                            l.getCreatedAt() != null ? l.getCreatedAt().toString() : "");
                }
            }
            default -> writer.println("Unknown export type: " + type);
        }
        writer.flush();
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }

    private int parseIntOrDefault(String param, int defaultValue) {
        if (param == null || param.trim().isEmpty()) return defaultValue;
        try {
            return Integer.parseInt(param.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
