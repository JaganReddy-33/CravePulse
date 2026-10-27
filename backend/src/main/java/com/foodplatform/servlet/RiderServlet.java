package com.foodplatform.servlet;

import com.foodplatform.dao.RiderDao;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.model.DeliveryDispatch;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.service.DispatchService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

@WebServlet("/api/rider/*")
public class RiderServlet extends BaseServlet {

    private final RiderDao riderDao = new RiderDaoImpl();
    private final DispatchService dispatchService = new DispatchService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "RIDER", "ADMIN")) return;
        Long userId = getAuthenticatedUserId(req);
        RiderProfile profile = riderDao.findByUserId(userId);
        if (profile == null) {
            // fallback to demo rider 1
            profile = riderDao.findById(1);
        }

        switch (path) {
            case "/profile" -> JsonUtil.sendSuccess(res, 200, "Rider profile", profile);
            case "/active-job", "/orders/active", "/active" -> {
                DeliveryDispatch job = riderDao.getRiderActiveDispatch(profile.getId());
                JsonUtil.sendSuccess(res, 200, "Active job", job);
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
            profile = riderDao.findById(1);
        }

        if ("/toggle-online".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean isOnline = body != null && body.has("isOnline") && body.get("isOnline").getAsBoolean();
            riderDao.updateOnlineStatus(profile.getId(), isOnline);
            JsonUtil.sendSuccess(res, 200, "Online status updated", Map.of("isOnline", isOnline));
            return;
        }

        if (path.endsWith("/accept")) {
            Long dispatchId = parseIdFromPath(req);
            boolean success = dispatchService.acceptDispatch(dispatchId, profile.getId());
            if (success) {
                JsonUtil.sendSuccess(res, 200, "Dispatch accepted successfully", Map.of("dispatchId", dispatchId));
            } else {
                JsonUtil.sendError(res, 400, "Could not accept dispatch. It may have expired or been assigned.");
            }
            return;
        }

        if (path.endsWith("/reject")) {
            Long dispatchId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            String reason = body != null && body.has("reason") ? body.get("reason").getAsString() : "Distance / Personal Emergency";

            boolean success = dispatchService.rejectDispatch(dispatchId, profile.getId(), reason);
            JsonUtil.sendSuccess(res, 200, "Dispatch rejected with zero penalty", Map.of("success", success));
            return;
        }

        if (path.endsWith("/wait-compensation")) {
            Long dispatchId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            int minutes = body != null && body.has("waitMinutes") ? body.get("waitMinutes").getAsInt() : 10;

            BigDecimal compensation = dispatchService.claimWaitTimeCompensation(dispatchId, minutes);
            JsonUtil.sendSuccess(res, 200, "Wait-time compensation processed", Map.of(
                    "waitMinutes", minutes,
                    "compensationCredited", compensation
            ));
            return;
        }

        if ("/telemetry".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body != null && body.has("latitude") && body.has("longitude")) {
                double lat = body.get("latitude").getAsDouble();
                double lng = body.get("longitude").getAsDouble();
                double speed = body.has("speed") ? body.get("speed").getAsDouble() : 0.0;
                double heading = body.has("heading") ? body.get("heading").getAsDouble() : 0.0;
                Long orderId = body.has("orderId") && !body.get("orderId").isJsonNull() ? body.get("orderId").getAsLong() : null;

                riderDao.updateRiderLocation(profile.getId(), lat, lng, speed, heading, orderId);
                JsonUtil.sendSuccess(res, 200, "Telemetry updated", null);
                return;
            }
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
