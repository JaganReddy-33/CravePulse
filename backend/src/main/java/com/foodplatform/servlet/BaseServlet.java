package com.foodplatform.servlet;

import com.foodplatform.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public abstract class BaseServlet extends HttpServlet {

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
