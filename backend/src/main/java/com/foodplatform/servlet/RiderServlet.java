package com.foodplatform.servlet;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.model.DeliveryDispatch;
import com.foodplatform.model.OrderItem;
import com.foodplatform.model.RiderCodSettlement;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.service.DispatchService;
import com.foodplatform.util.JsonUtil;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/rider/*")
public class RiderServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final RiderDao riderDao = new RiderDaoImpl();
    private final OrderDao orderDao = new OrderDaoImpl();
    private final DispatchService dispatchService = new DispatchService();
    private final RealtimeSessionRegistry registry = RealtimeSessionRegistry.getInstance();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "RIDER", "ADMIN")) return;
        Long userId = getAuthenticatedUserId(req);
        RiderProfile profile = riderDao.findByUserId(userId);
        if (profile == null) {
            JsonUtil.sendError(res, HttpServletResponse.SC_NOT_FOUND, "Rider profile not found for authenticated user");
            return;
        }

        switch (path) {
            case "/profile" -> JsonUtil.sendSuccess(res, 200, "Rider profile", profile);

            case "/active-job", "/orders/active", "/active" -> {
                DeliveryDispatch job = riderDao.getRiderActiveDispatch(profile.getId());
                if (job != null) {
                    List<OrderItem> items = orderDao.getOrderItems(job.getOrderId());
                    job.setItems(items);
                }
                JsonUtil.sendSuccess(res, 200, "Active job", job);
            }

            case "/offers" -> {
                List<DeliveryDispatch> offers = riderDao.getActiveOffersForRider(profile.getId());
                JsonUtil.sendSuccess(res, 200, "Active job offers", offers);
            }

            case "/earnings" -> {
                Map<String, Object> summary = riderDao.getRiderEarningsSummary(profile.getId());
                summary.put("walletBalance", new com.foodplatform.daoImpl.UserDaoImpl().findById(userId).getWalletBalance());
                summary.put("cashInHand", profile.getCashInHand());
                summary.put("maxCashLimit", profile.getMaxCashLimit());
                JsonUtil.sendSuccess(res, 200, "Earnings summary", summary);
            }

            case "/history", "/trips" -> {
                int limit = getIntParam(req, "limit", 50);
                int offset = getIntParam(req, "offset", 0);
                List<DeliveryDispatch> history = riderDao.getRiderCompletedTrips(profile.getId(), limit, offset);
                JsonUtil.sendSuccess(res, 200, "Delivery trip history", history);
            }

            case "/cod-ledger" -> {
                int limit = getIntParam(req, "limit", 50);
                int offset = getIntParam(req, "offset", 0);
                List<RiderCodSettlement> settlements = riderDao.getCodSettlements(profile.getId(), limit, offset);
                Map<String, Object> ledger = new HashMap<>();
                ledger.put("cashInHand", profile.getCashInHand());
                ledger.put("maxCashLimit", profile.getMaxCashLimit());
                ledger.put("settlements", settlements);
                JsonUtil.sendSuccess(res, 200, "Cash-on-delivery settlement ledger", ledger);
            }

            default -> JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "RIDER", "ADMIN")) return;
        Long userId = getAuthenticatedUserId(req);
        RiderProfile profile = riderDao.findByUserId(userId);
        if (profile == null) {
            JsonUtil.sendError(res, HttpServletResponse.SC_NOT_FOUND, "Rider profile not found for authenticated user");
            return;
        }

        // Profile details update
        if ("/profile".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            String vehicleType = body != null && body.has("vehicleType") ? body.get("vehicleType").getAsString() : null;
            String vehicleNumber = body != null && body.has("vehicleNumber") ? body.get("vehicleNumber").getAsString() : null;
            String drivingLicense = body != null && body.has("drivingLicense") ? body.get("drivingLicense").getAsString() : null;

            riderDao.updateRiderProfileDetails(profile.getId(), vehicleType, vehicleNumber, drivingLicense);
            RiderProfile updated = riderDao.findById(profile.getId());
            JsonUtil.sendSuccess(res, 200, "Profile updated successfully", updated);
            return;
        }

        if (!profile.isKycApproved()) {
            JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Rider account is pending KYC approval from platform administrators.");
            return;
        }

        // Online status toggle (supports both /profile/status and /toggle-online)
        if ("/profile/status".equals(path) || "/toggle-online".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean isOnline = false;
            if (body != null) {
                if (body.has("isOnline")) {
                    isOnline = body.get("isOnline").getAsBoolean();
                } else if (body.has("online")) {
                    isOnline = body.get("online").getAsBoolean();
                }
            }
            riderDao.updateOnlineStatus(profile.getId(), isOnline);
            JsonUtil.sendSuccess(res, 200, "Online status updated", Map.of("isOnline", isOnline));
            return;
        }

        // Accept offer (/orders/{id}/accept or /{id}/accept)
        if (path.endsWith("/accept")) {
            Long id = parseIdFromPath(req);
            Long dispatchId = id;
            if (path.contains("/orders/")) {
                DeliveryDispatch d = riderDao.findDispatchByOrderId(id);
                if (d != null) {
                    dispatchId = d.getId();
                }
            }
            boolean success = dispatchService.acceptDispatch(dispatchId, profile.getId());
            if (success) {
                JsonUtil.sendSuccess(res, 200, "Dispatch accepted successfully", Map.of("dispatchId", dispatchId));
            } else {
                JsonUtil.sendError(res, 400, "Could not accept dispatch. It may have expired or been assigned.");
            }
            return;
        }

        // Reject offer (/orders/{id}/reject or /{id}/reject)
        if (path.endsWith("/reject")) {
            Long id = parseIdFromPath(req);
            Long dispatchId = id;
            if (path.contains("/orders/")) {
                DeliveryDispatch d = riderDao.findDispatchByOrderId(id);
                if (d != null) {
                    dispatchId = d.getId();
                }
            }
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            String reason = body != null && body.has("reason") ? body.get("reason").getAsString() : "Distance / Personal Emergency";

            boolean success = dispatchService.rejectDispatch(dispatchId, profile.getId(), reason);
            JsonUtil.sendSuccess(res, 200, "Dispatch rejected with zero penalty", Map.of("success", success));
            return;
        }

        // Order milestone and status update (/orders/{id}/status)
        if (path.matches("^/orders/\\d+/status$")) {
            Long orderId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            String status = body != null && body.has("status") ? body.get("status").getAsString() : "";

            if ("DELIVERED".equals(status)) {
                String deliveryOtp = body.has("deliveryOtp") ? body.get("deliveryOtp").getAsString() : null;
                try {
                    boolean success = dispatchService.completeDelivery(orderId, profile.getId(), deliveryOtp);
                    if (success) {
                        JsonUtil.sendSuccess(res, 200, "Delivery successfully completed and verified with PIN", Map.of("orderId", orderId, "status", "DELIVERED"));
                    } else {
                        JsonUtil.sendError(res, 400, "Could not complete delivery");
                    }
                } catch (IllegalArgumentException | IllegalStateException e) {
                    JsonUtil.sendError(res, 400, e.getMessage());
                }
                return;
            }

            // Milestone updates: ARRIVED_AT_RESTAURANT, PICKED_UP, ARRIVED_AT_CUSTOMER
            boolean updated = dispatchService.updateDispatchMilestone(orderId, profile.getId(), status);
            if (updated) {
                JsonUtil.sendSuccess(res, 200, "Trip milestone updated: " + status, Map.of("orderId", orderId, "status", status));
            } else {
                JsonUtil.sendError(res, 400, "Could not update milestone: " + status);
            }
            return;
        }

        // Wait compensation claim (/orders/{id}/wait-compensation or /{dispatchId}/wait-compensation)
        if (path.endsWith("/wait-compensation")) {
            Long id = parseIdFromPath(req);
            Long dispatchId = id;
            if (path.contains("/orders/")) {
                DeliveryDispatch d = riderDao.findDispatchByOrderId(id);
                if (d != null) {
                    dispatchId = d.getId();
                }
            }

            try {
                DeliveryDispatch owned = riderDao.findDispatchByOrderId(path.contains("/orders/") ? id : -1L);
                if (owned == null || !profile.getId().equals(owned.getRiderId())) { JsonUtil.sendError(res,403,"Dispatch is not owned by this rider"); return; }
                BigDecimal compensation = dispatchService.claimWaitTimeCompensation(dispatchId);
                JsonUtil.sendSuccess(res, 200, "Wait-time compensation processed", Map.of(
                        "dispatchId", dispatchId,
                        "compensationCredited", compensation
                ));
            } catch (IllegalStateException e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            }
            return;
        }

        // COD cash deposit settlement (/cod-settlement or /cod-deposit)
        if ("/cod-settlement".equals(path) || "/cod-deposit".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("amount")) {
                JsonUtil.sendError(res, 400, "Amount is required for COD settlement deposit");
                return;
            }
            BigDecimal amount = body.get("amount").getAsBigDecimal();
            String referenceNumber = body.has("referenceNumber") ? body.get("referenceNumber").getAsString() : "DEP-" + System.currentTimeMillis();
            String notes = body.has("notes") ? body.get("notes").getAsString() : "Cash handed over at CravePulse hub";

            BigDecimal remainingCash = riderDao.recordCodDeposit(profile.getId(), amount, referenceNumber, notes);
            JsonUtil.sendSuccess(res, 200, "COD cash deposit recorded successfully", Map.of(
                    "depositedAmount", amount,
                    "remainingCashInHand", remainingCash,
                    "referenceNumber", referenceNumber
            ));
            return;
        }

        // Authenticated rider GPS telemetry
        if ("/telemetry".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body != null && body.has("latitude") && body.has("longitude")) {
                double lat = body.get("latitude").getAsDouble();
                double lng = body.get("longitude").getAsDouble();
                if (!Double.isFinite(lat) || !Double.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) { JsonUtil.sendError(res,400,"Invalid GPS coordinates"); return; }
                double speed = body.has("speed") ? body.get("speed").getAsDouble() : 0.0;
                double heading = body.has("heading") ? body.get("heading").getAsDouble() : 0.0;
                Long orderId = body.has("orderId") && !body.get("orderId").isJsonNull() ? body.get("orderId").getAsLong() : null;

                // Validate that if orderId is provided, rider is assigned to it
                if (orderId != null) {
                    DeliveryDispatch activeDispatch = riderDao.findDispatchByOrderId(orderId);
                    if (activeDispatch != null && activeDispatch.getRiderId().equals(profile.getId())) {
                        riderDao.updateRiderLocation(profile.getId(), lat, lng, speed, heading, orderId);
                        if (registry != null) {
                            registry.broadcastToOrder(orderId, "rider_location_updated", Map.of(
                                    "riderId", profile.getId(),
                                    "latitude", lat,
                                    "longitude", lng,
                                    "speed", speed,
                                    "heading", heading
                            ));
                        }
                    }
                } else {
                    riderDao.updateRiderLocation(profile.getId(), lat, lng, speed, heading, null);
                }

                JsonUtil.sendSuccess(res, 200, "Telemetry updated", null);
                return;
            }
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    private int getIntParam(HttpServletRequest req, String name, int defaultValue) {
        String val = req.getParameter(name);
        if (val != null && !val.isBlank()) {
            try {
                return Integer.parseInt(val.trim());
            } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }
}
