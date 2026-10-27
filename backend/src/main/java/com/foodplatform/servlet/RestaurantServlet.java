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
            if (rest == null && "ADMIN".equalsIgnoreCase(getAuthenticatedRole(req))) {
                String reqRestId = req.getParameter("restaurantId");
                if (reqRestId != null) {
                    try {
                        rest = restaurantDao.findById(Long.parseLong(reqRestId));
                    } catch (NumberFormatException ignored) {}
                }
                if (rest == null) {
                    List<Restaurant> all = restaurantDao.listAllRestaurants(1, 0);
                    if (!all.isEmpty()) {
                        rest = all.get(0);
                    }
                }
            }
            if (rest == null) {
                JsonUtil.sendError(res, HttpServletResponse.SC_NOT_FOUND, "Restaurant profile not found for authenticated user");
                return;
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
            if (!requireRestaurantOwner(req, res, restId)) return;
            Map<String, Object> analytics = analyticsService.getRestaurantAnalytics(restId);
            JsonUtil.sendSuccess(res, 200, "Restaurant analytics", analytics);
            return;
        }

        if (path.endsWith("/settings")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID missing");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;
            Restaurant rest = restaurantDao.findById(restId);
            if (rest == null) {
                JsonUtil.sendError(res, 404, "Restaurant not found");
                return;
            }
            Map<String, Object> settings = new HashMap<>();
            settings.put("id", rest.getId());
            settings.put("name", rest.getName());
            settings.put("phone", rest.getPhone());
            settings.put("address", rest.getAddress());
            settings.put("bannerImage", rest.getBannerImage());
            settings.put("logoImage", rest.getLogoImage());
            settings.put("fssaiLicense", rest.getFssaiLicense());
            settings.put("gstNumber", rest.getGstNumber());
            settings.put("commissionRate", rest.getCommissionRate());
            settings.put("bankAccountNumber", rest.getMaskedBankAccount());
            settings.put("bankIfsc", rest.getBankIfsc());
            settings.put("bankBeneficiaryName", rest.getBankBeneficiaryName());
            settings.put("upiId", rest.getUpiId());
            settings.put("autoRejectMinutes", rest.getAutoRejectMinutes());
            settings.put("isAutoThrottled", rest.isAutoThrottled());
            settings.put("isOpen", rest.isOpen());
            settings.put("operatingHours", restaurantDao.getOperatingHours(restId));
            JsonUtil.sendSuccess(res, 200, "Restaurant settings", settings);
            return;
        }

        if (path.endsWith("/hours")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID missing");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;
            JsonUtil.sendSuccess(res, 200, "Restaurant operating hours", restaurantDao.getOperatingHours(restId));
            return;
        }

        if (path.endsWith("/payouts")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID missing");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;
            JsonUtil.sendSuccess(res, 200, "Restaurant payouts ledger", restaurantDao.getPayouts(restId));
            return;
        }

        if (path.startsWith("/slug/")) {
            String slug = path.substring("/slug/".length()).trim();
            Restaurant r = restaurantDao.findBySlug(slug);
            if (r == null) {
                JsonUtil.sendError(res, 404, "Restaurant not found with slug: " + slug);
                return;
            }
            JsonUtil.sendSuccess(res, 200, "Restaurant details", r);
            return;
        }

        // Fetch single restaurant by ID (Public discovery)
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
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID is required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean isOpen = body != null && body.has("isOpen") && body.get("isOpen").getAsBoolean();

            restaurantDao.updateOpenStatus(restId, isOpen);
            registry.broadcastToRestaurant(restId, "restaurant_status_updated", Map.of("restaurantId", restId, "isOpen", isOpen));
            JsonUtil.sendSuccess(res, 200, "Restaurant open status updated", Map.of("isOpen", isOpen));
            return;
        }

        if (path.endsWith("/toggle-throttle")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID is required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean throttled = body != null && body.has("throttled") && body.get("throttled").getAsBoolean();

            restaurantDao.updateAutoThrottle(restId, throttled);
            registry.broadcastToRestaurant(restId, "kitchen_throttle_updated", Map.of("restaurantId", restId, "throttled", throttled));
            JsonUtil.sendSuccess(res, 200, "Kitchen overload throttle updated", Map.of("isAutoThrottled", throttled));
            return;
        }

        if (path.endsWith("/settings")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID is required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body != null) {
                String name = body.has("name") && !body.get("name").isJsonNull() ? body.get("name").getAsString() : null;
                String phone = body.has("phone") && !body.get("phone").isJsonNull() ? body.get("phone").getAsString() : null;
                String address = body.has("address") && !body.get("address").isJsonNull() ? body.get("address").getAsString() : null;
                String banner = body.has("bannerImage") && !body.get("bannerImage").isJsonNull() ? body.get("bannerImage").getAsString() : null;
                String bankAccount = body.has("bankAccountNumber") && !body.get("bankAccountNumber").isJsonNull() ? body.get("bankAccountNumber").getAsString() : null;
                String ifsc = body.has("bankIfsc") && !body.get("bankIfsc").isJsonNull() ? body.get("bankIfsc").getAsString() : null;
                String beneficiary = body.has("bankBeneficiaryName") && !body.get("bankBeneficiaryName").isJsonNull() ? body.get("bankBeneficiaryName").getAsString() : null;
                String upi = body.has("upiId") && !body.get("upiId").isJsonNull() ? body.get("upiId").getAsString() : null;
                int autoReject = body.has("autoRejectMinutes") ? body.get("autoRejectMinutes").getAsInt() : 10;

                restaurantDao.updateSettings(restId, name, phone, address, banner, bankAccount, ifsc, beneficiary, upi, autoReject);
                JsonUtil.sendSuccess(res, 200, "Restaurant settings updated successfully", Map.of("restaurantId", restId));
                return;
            }
        }

        if (path.endsWith("/hours")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID is required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;

            List<Map<String, Object>> hoursList = JsonUtil.readRequestBody(req, List.class);
            if (hoursList != null) {
                restaurantDao.updateOperatingHours(restId, hoursList);
                JsonUtil.sendSuccess(res, 200, "Operating hours updated", Map.of("restaurantId", restId));
                return;
            }
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        doPost(req, res);
    }

    private Double parseDoubleParam(HttpServletRequest req, String name, double defVal) {
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
