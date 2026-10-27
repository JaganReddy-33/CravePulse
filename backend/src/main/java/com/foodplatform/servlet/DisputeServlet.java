package com.foodplatform.servlet;

import com.foodplatform.model.Dispute;
import com.foodplatform.service.DisputeService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@WebServlet("/api/disputes/*")
public class DisputeServlet extends BaseServlet {

    private final DisputeService disputeService = new DisputeService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.isEmpty() || "/".equals(path)) {
            // Customer raises dispute
            if (!requireAuthenticated(req, res)) return;
            Long customerId = getAuthenticatedUserId(req);

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("orderId") || !body.has("issueType") || !body.has("description")) {
                JsonUtil.sendError(res, 400, "orderId, issueType, and description are required");
                return;
            }

            long orderId = body.get("orderId").getAsLong();
            String issueType = body.get("issueType").getAsString();
            String desc = body.get("description").getAsString();
            String photoUrl = body.has("photoEvidenceUrl") && !body.get("photoEvidenceUrl").isJsonNull() ?
                    body.get("photoEvidenceUrl").getAsString() : "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300";
            BigDecimal refundAmt = body.has("requestedRefundAmount") ?
                    body.get("requestedRefundAmount").getAsBigDecimal() : BigDecimal.valueOf(50.00);

            try {
                Dispute dispute = disputeService.raiseDispute(orderId, customerId, issueType, desc, photoUrl, refundAmt);
                JsonUtil.sendSuccess(res, 201, dispute.isAutoRefundApproved() ?
                        "Instant dispute auto-refund approved! Refund credited to your wallet." :
                        "Dispute submitted and escalated to platform ops.", dispute);
            } catch (Exception e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            }
            return;
        }

        if (path.endsWith("/resolve")) {
            if (!requireRole(req, res, "ADMIN")) return;
            Long disputeId = parseIdFromPath(req);
            Long adminId = getAuthenticatedUserId(req);

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean approve = body != null && body.has("approve") && body.get("approve").getAsBoolean();
            String notes = body != null && body.has("notes") ? body.get("notes").getAsString() : "Resolved by ops team";

            try {
                disputeService.adminResolve(disputeId, approve, notes, adminId);
                JsonUtil.sendSuccess(res, 200, "Dispute " + (approve ? "approved" : "rejected"), Map.of("disputeId", disputeId, "status", approve ? "APPROVED" : "REJECTED"));
            } catch (Exception e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            }
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/pending".equals(path)) {
            if (!requireRole(req, res, "ADMIN")) return;
            List<Dispute> list = disputeService.getPendingDisputes();
            JsonUtil.sendSuccess(res, 200, "Pending disputes queue", list);
            return;
        }

        if ("/customer".equals(path)) {
            if (!requireAuthenticated(req, res)) return;
            Long customerId = getAuthenticatedUserId(req);
            List<Dispute> list = disputeService.getCustomerDisputes(customerId);
            JsonUtil.sendSuccess(res, 200, "Customer disputes", list);
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
