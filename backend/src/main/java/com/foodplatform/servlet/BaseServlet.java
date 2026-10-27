package com.foodplatform.servlet;

import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.model.Restaurant;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public abstract class BaseServlet extends HttpServlet {

    protected final OrderDao baseOrderDao = new OrderDaoImpl();
    protected final RestaurantDao baseRestaurantDao = new RestaurantDaoImpl();
    protected final RiderDao baseRiderDao = new RiderDaoImpl();

    protected Long getAuthenticatedUserId(HttpServletRequest req) {
        Object id = req.getAttribute("userId");
        if (id instanceof Long) {
            return (Long) id;
        }
        return null;
    }

    protected String getAuthenticatedRole(HttpServletRequest req) {
        Object role = req.getAttribute("role");
        return role != null ? role.toString() : null;
    }

    protected boolean requireAuthenticated(HttpServletRequest req, HttpServletResponse res) throws IOException {
        Long userId = getAuthenticatedUserId(req);
        if (userId == null) {
            JsonUtil.sendError(res, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required. Please provide a valid Bearer token.");
            return false;
        }
        return true;
    }

    protected boolean requireRole(HttpServletRequest req, HttpServletResponse res, String... allowedRoles) throws IOException {
        if (!requireAuthenticated(req, res)) {
            return false;
        }
        String currentRole = getAuthenticatedRole(req);
        for (String r : allowedRoles) {
            if (r.equalsIgnoreCase(currentRole)) {
                return true;
            }
        }
        JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden for role: " + currentRole);
        return false;
    }

    protected boolean requireAdmin(HttpServletRequest req, HttpServletResponse res) throws IOException {
        return requireRole(req, res, "ADMIN");
    }

    /**
     * Verifies that the authenticated caller owns or is authorized to access the specified order.
     * Allowed:
     * - ADMIN
     * - CUSTOMER who placed the order
     * - RESTAURANT_OWNER whose restaurant fulfills the order
     * - RIDER assigned to deliver the order
     */
    protected boolean requireOwnerOfOrder(HttpServletRequest req, HttpServletResponse res, long orderId) throws IOException {
        if (!requireAuthenticated(req, res)) return false;
        Long userId = getAuthenticatedUserId(req);
        String role = getAuthenticatedRole(req);

        if ("ADMIN".equalsIgnoreCase(role)) {
            return true;
        }

        Order order = baseOrderDao.findById(orderId);
        if (order == null) {
            JsonUtil.sendError(res, HttpServletResponse.SC_NOT_FOUND, "Order not found with id: " + orderId);
            return false;
        }

        if ("CUSTOMER".equalsIgnoreCase(role)) {
            if (order.getCustomerId() != null && order.getCustomerId().equals(userId)) {
                return true;
            }
            JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: you do not own this order");
            return false;
        }

        if ("RESTAURANT_OWNER".equalsIgnoreCase(role)) {
            Restaurant rest = baseRestaurantDao.findByUserId(userId);
            if (rest != null && order.getRestaurantId() != null && order.getRestaurantId().equals(rest.getId())) {
                return true;
            }
            JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: order belongs to another restaurant");
            return false;
        }

        if ("RIDER".equalsIgnoreCase(role)) {
            RiderProfile rider = baseRiderDao.findByUserId(userId);
            if (rider != null && order.getRiderId() != null && order.getRiderId().equals(rider.getId())) {
                return true;
            }
            JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: you are not the assigned rider for this order");
            return false;
        }

        JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden for this order");
        return false;
    }

    /**
     * Verifies that the authenticated caller is the owner of the given restaurant or an ADMIN.
     */
    protected boolean requireRestaurantOwner(HttpServletRequest req, HttpServletResponse res, long restaurantId) throws IOException {
        if (!requireAuthenticated(req, res)) return false;
        Long userId = getAuthenticatedUserId(req);
        String role = getAuthenticatedRole(req);

        if ("ADMIN".equalsIgnoreCase(role)) {
            return true;
        }

        if ("RESTAURANT_OWNER".equalsIgnoreCase(role)) {
            Restaurant rest = baseRestaurantDao.findByUserId(userId);
            if (rest != null && rest.getId() == restaurantId) {
                return true;
            }
            JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: you do not own this restaurant");
            return false;
        }

        JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: restaurant owner authorization required");
        return false;
    }

    /**
     * Verifies that the authenticated caller is the assigned rider for the given order or an ADMIN.
     */
    protected boolean requireAssignedRider(HttpServletRequest req, HttpServletResponse res, long orderId) throws IOException {
        if (!requireAuthenticated(req, res)) return false;
        Long userId = getAuthenticatedUserId(req);
        String role = getAuthenticatedRole(req);

        if ("ADMIN".equalsIgnoreCase(role)) {
            return true;
        }

        if ("RIDER".equalsIgnoreCase(role)) {
            RiderProfile rider = baseRiderDao.findByUserId(userId);
            if (rider == null) {
                JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Rider profile not found for authenticated account");
                return false;
            }
            Order order = baseOrderDao.findById(orderId);
            if (order == null) {
                JsonUtil.sendError(res, HttpServletResponse.SC_NOT_FOUND, "Order not found with id: " + orderId);
                return false;
            }
            if (order.getRiderId() != null && order.getRiderId().equals(rider.getId())) {
                return true;
            }
            JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: you are not the assigned rider for this order");
            return false;
        }

        JsonUtil.sendError(res, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: delivery rider authorization required");
        return false;
    }

    protected Long parseIdFromPath(HttpServletRequest req) {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            return null;
        }
        String[] parts = pathInfo.split("/");
        for (String part : parts) {
            if (!part.isEmpty()) {
                try {
                    return Long.parseLong(part);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return null;
    }
}
