package com.foodplatform.servlet;

import com.foodplatform.service.NotificationService;
import com.foodplatform.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/api/notifications/*")
public class NotificationServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final NotificationService notificationService = new NotificationService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req, res)) return;
        Long userId = getAuthenticatedUserId(req);

        boolean unreadOnly = "true".equalsIgnoreCase(req.getParameter("unreadOnly"));
        var list = notificationService.getUserNotifications(userId, unreadOnly);
        JsonUtil.sendSuccess(res, 200, "User notifications", list);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handleAction(req, res);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handleAction(req, res);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req, res)) return;
        Long userId = getAuthenticatedUserId(req);

        notificationService.clearAll(userId);
        JsonUtil.sendSuccess(res, 200, "All notifications cleared", null);
    }

    private void handleAction(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req, res)) return;
        Long userId = getAuthenticatedUserId(req);
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/read-all".equals(path)) {
            notificationService.markAllAsRead(userId);
            JsonUtil.sendSuccess(res, 200, "All notifications marked as read", null);
            return;
        }

        if (path.endsWith("/read")) {
            Long notifId = parseIdFromPath(req);
            if (notifId == null) {
                JsonUtil.sendError(res, 400, "Notification ID required");
                return;
            }
            notificationService.markAsRead(notifId, userId);
            JsonUtil.sendSuccess(res, 200, "Notification marked as read", null);
            return;
        }

        JsonUtil.sendError(res, 404, "Notification endpoint not found: " + path);
    }
}
