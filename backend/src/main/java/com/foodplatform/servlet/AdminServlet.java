package com.foodplatform.servlet;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.model.Restaurant;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.model.User;
import com.foodplatform.service.AnalyticsService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@WebServlet("/api/admin/*")
public class AdminServlet extends BaseServlet {

    private final AnalyticsService analyticsService = new AnalyticsService();
    private final UserDao userDao = new UserDaoImpl();
    private final RestaurantDao restaurantDao = new RestaurantDaoImpl();
    private final RiderDao riderDao = new RiderDaoImpl();
    private final OrderDao orderDao = new OrderDaoImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "ADMIN")) return;

        switch (path) {
            case "/metrics" -> {
                Map<String, Object> metrics = analyticsService.getAdminPlatformMetrics();
                JsonUtil.sendSuccess(res, 200, "Platform metrics", metrics);
            }
            case "/users" -> {
                List<User> users = userDao.listAllUsers(50, 0);
                JsonUtil.sendSuccess(res, 200, "User directory", users);
            }
            case "/restaurants" -> {
                List<Restaurant> list = restaurantDao.listAllRestaurants(50, 0);
                JsonUtil.sendSuccess(res, 200, "Restaurant partners", list);
            }
            case "/riders" -> {
                List<RiderProfile> list = riderDao.listAllRiders(50, 0);
                JsonUtil.sendSuccess(res, 200, "Delivery riders", list);
            }
            case "/orders" -> {
                List<Order> list = orderDao.listAllOrders(50, 0);
                JsonUtil.sendSuccess(res, 200, "Platform orders", list);
            }
            case "/live-map" -> {
                List<Restaurant> rests = restaurantDao.listAllRestaurants(100, 0);
                List<RiderProfile> riders = riderDao.listAllRiders(100, 0);
                Map<String, Object> mapData = new HashMap<>();
                mapData.put("restaurants", rests);
                mapData.put("riders", riders);
                JsonUtil.sendSuccess(res, 200, "Live ops map data", mapData);
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
            default -> JsonUtil.sendError(res, 404, "Admin endpoint not found: " + path);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireRole(req, res, "ADMIN")) return;

        if ((path.startsWith("/restaurant/") && path.endsWith("/kyc")) || path.startsWith("/approvals/restaurant/")) {
            Long restId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean approved = body != null && (!body.has("approved") || body.get("approved").getAsBoolean());

            restaurantDao.updateKyc(restId, approved);
            JsonUtil.sendSuccess(res, 200, "Restaurant KYC " + (approved ? "approved" : "rejected"),
                    Map.of("restaurantId", restId, "isKycApproved", approved));
            return;
        }

        if ((path.startsWith("/rider/") && path.endsWith("/kyc")) || path.startsWith("/approvals/rider/")) {
            Long riderId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean approved = body != null && (!body.has("approved") || body.get("approved").getAsBoolean());

            riderDao.updateKyc(riderId, approved);
            JsonUtil.sendSuccess(res, 200, "Rider KYC " + (approved ? "approved" : "rejected"),
                    Map.of("riderId", riderId, "isKycApproved", approved));
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
