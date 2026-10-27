package com.foodplatform.servlet;

import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.model.Restaurant;
import com.foodplatform.service.AnalyticsService;
import com.foodplatform.util.JsonUtil;
import com.foodplatform.websocket.RealtimeSessionRegistry;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/api/restaurants/*")
public class RestaurantServlet extends BaseServlet {

    private final RestaurantDao restaurantDao = new RestaurantDaoImpl();
    private final AnalyticsService analyticsService = new AnalyticsService();
    private final RealtimeSessionRegistry registry = RealtimeSessionRegistry.getInstance();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.isEmpty() || "/".equals(path)) {
            // Discovery list with geo-distance and filters
            Double lat = parseDoubleParam(req, "lat", 12.9783692);
            Double lng = parseDoubleParam(req, "lng", 77.6408356);
            String cuisine = req.getParameter("cuisine");
            String search = req.getParameter("search");
            Boolean vegOnly = "true".equalsIgnoreCase(req.getParameter("vegOnly"));
            int limit = parseIntParam(req, "limit", 20);
            int offset = parseIntParam(req, "offset", 0);

            List<Restaurant> list = restaurantDao.listOpenRestaurants(lat, lng, cuisine, search, vegOnly, limit, offset);
            JsonUtil.sendSuccess(res, 200, "Restaurants discovered", list);
            return;
        }

        if ("/my-profile".equals(path)) {
            if (!requireRole(req, res, "RESTAURANT_OWNER", "ADMIN")) return;
            Long userId = getAuthenticatedUserId(req);
            Restaurant rest = restaurantDao.findByUserId(userId);
            if (rest == null) {
                // If admin or test, fetch restaurant 1 as default
                rest = restaurantDao.findById(1);
            }
            JsonUtil.sendSuccess(res, 200, "Restaurant profile", rest);
            return;
        }

        if (path.endsWith("/analytics")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID missing");
                return;
            }
            Map<String, Object> analytics = analyticsService.getRestaurantAnalytics(restId);
            JsonUtil.sendSuccess(res, 200, "Restaurant analytics", analytics);
            return;
        }

        // Fetch single restaurant by ID
        Long restId = parseIdFromPath(req);
        if (restId != null) {
            Restaurant r = restaurantDao.findById(restId);
            if (r == null) {
                JsonUtil.sendError(res, 404, "Restaurant not found");
                return;
            }
            JsonUtil.sendSuccess(res, 200, "Restaurant details", r);
            return;
        }

        JsonUtil.sendError(res, 404, "Resource not found: " + path);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.endsWith("/toggle-open")) {
            if (!requireRole(req, res, "RESTAURANT_OWNER", "ADMIN")) return;
            Long restId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean isOpen = body != null && body.has("isOpen") && body.get("isOpen").getAsBoolean();

            restaurantDao.updateOpenStatus(restId, isOpen);
            registry.broadcastToRestaurant(restId, "restaurant_status_updated", Map.of("restaurantId", restId, "isOpen", isOpen));
            JsonUtil.sendSuccess(res, 200, "Restaurant open status updated", Map.of("isOpen", isOpen));
            return;
        }

        if (path.endsWith("/toggle-throttle")) {
            if (!requireRole(req, res, "RESTAURANT_OWNER", "ADMIN")) return;
            Long restId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean throttled = body != null && body.has("throttled") && body.get("throttled").getAsBoolean();

            restaurantDao.updateAutoThrottle(restId, throttled);
            registry.broadcastToRestaurant(restId, "kitchen_throttle_updated", Map.of("restaurantId", restId, "throttled", throttled));
            JsonUtil.sendSuccess(res, 200, "Kitchen overload throttle updated", Map.of("isAutoThrottled", throttled));
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    private Double parseDoubleParam(HttpServletRequest req, String name, Double defVal) {
        String s = req.getParameter(name);
        if (s != null && !s.isBlank()) {
            try {
                return Double.parseDouble(s);
            } catch (NumberFormatException ignored) {
            }
        }
        return defVal;
    }

    private int parseIntParam(HttpServletRequest req, String name, int defVal) {
        String s = req.getParameter(name);
        if (s != null && !s.isBlank()) {
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException ignored) {
            }
        }
        return defVal;
    }
}
