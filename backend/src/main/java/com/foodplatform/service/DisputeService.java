package com.foodplatform.service;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.DisputeDao;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.DisputeDaoImpl;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.Dispute;
import com.foodplatform.model.Order;
import com.foodplatform.model.User;
import com.foodplatform.model.WalletTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

public class DisputeService {

    private static final Logger logger = LoggerFactory.getLogger(DisputeService.class);

    private final DisputeDao disputeDao = new DisputeDaoImpl();
    private final OrderDao orderDao = new OrderDaoImpl();
    private final UserDao userDao = new UserDaoImpl();
    private final WalletDao walletDao = new WalletDaoImpl();
    private final com.foodplatform.dao.PlatformSettingDao platformSettingDao = new com.foodplatform.daoImpl.PlatformSettingDaoImpl();

    public Dispute raiseDispute(long orderId, long customerId, String issueType, String description, String photoUrl, BigDecimal requestedRefund) {
        Order order = orderDao.findById(orderId);
        if (order == null || !order.getCustomerId().equals(customerId)) {
            throw new IllegalArgumentException("Invalid order for dispute");
        }

        // Rule 1: Allowed ONLY for DELIVERED orders
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Disputes can only be raised for DELIVERED orders. Current order status: " + order.getStatus());
        }

        // Rule 2: Allowed ONCE per order
        if (disputeDao.existsForOrder(orderId)) {
            throw new IllegalArgumentException("A dispute has already been submitted for order " + order.getOrderNumber() + ". Only one dispute per order is allowed.");
        }

        Dispute dispute = new Dispute();
        dispute.setOrderId(orderId);
        dispute.setCustomerId(customerId);
        dispute.setIssueType(issueType);
        dispute.setDescription(description);
        dispute.setPhotoEvidenceUrl(photoUrl);
        dispute.setRequestedRefundAmount(requestedRefund != null ? requestedRefund : BigDecimal.valueOf(50.00));

        // Rule 3: Configurable Cap (platform_settings dispute_auto_refund_cap, default ₹150.00)
        BigDecimal autoRefundCap = BigDecimal.valueOf(150.00);
        try {
            String capVal = platformSettingDao.getSettingValue("dispute_auto_refund_cap", "150.00");
            if (capVal != null) autoRefundCap = new BigDecimal(capVal);
        } catch (Exception ignored) {}
        boolean withinCap = dispute.getRequestedRefundAmount().compareTo(autoRefundCap) <= 0;

        // Rule 4: Time Window (platform_settings dispute_window_hours, default 2 hours)
        long windowHours = 2;
        try {
            String winVal = platformSettingDao.getSettingValue("dispute_window_hours", "2");
            if (winVal != null) windowHours = Long.parseLong(winVal);
        } catch (Exception ignored) {}

        java.sql.Timestamp deliveryTimestamp = order.getActualDeliveryAt() != null ? order.getActualDeliveryAt() : order.getUpdatedAt();
        long deliveryMillis = deliveryTimestamp != null ? deliveryTimestamp.getTime() : System.currentTimeMillis();
        long elapsedMillis = System.currentTimeMillis() - deliveryMillis;
        boolean withinTimeWindow = elapsedMillis <= (windowHours * 3600 * 1000L);

        // Rule 5: User Fraud-Flag Counter check
        int userFraudFlags = userDao.getFraudFlagCount(customerId);
        int recentDisputes = disputeDao.countCustomerDisputesInWindow(customerId, 7);
        boolean cleanFraudRecord = (userFraudFlags == 0) && (recentDisputes < 2);
        if (!cleanFraudRecord && userFraudFlags == 0 && recentDisputes >= 2) {
            userDao.incrementFraudFlag(customerId);
            logger.warn("Customer {} fraud flag incremented due to >= 2 disputes within 7 days", customerId);
        }

        boolean eligibleIssueType = "MISSING_ITEM".equalsIgnoreCase(issueType)
                || "SEVERE_DELAY".equalsIgnoreCase(issueType)
                || "SPILLAGE".equalsIgnoreCase(issueType);

        boolean qualifyAutoRefund = withinTimeWindow && withinCap && cleanFraudRecord && eligibleIssueType;

        dispute.setAutoRefundApproved(qualifyAutoRefund);
        dispute.setAdminStatus(qualifyAutoRefund ? "APPROVED" : "PENDING");
        if (qualifyAutoRefund) {
            dispute.setResolutionNotes("Instant auto-refund approved by automated resolution engine (within "
                    + windowHours + "h window, under ₹" + autoRefundCap + " cap, clean fraud record).");
        } else {
            StringBuilder reviewReason = new StringBuilder("Escalated to platform ops: ");
            if (!withinTimeWindow) reviewReason.append("Delivery exceeded ").append(windowHours).append("h window; ");
            if (!withinCap) reviewReason.append("Requested refund ₹").append(dispute.getRequestedRefundAmount()).append(" exceeds ₹").append(autoRefundCap).append(" auto-refund cap; ");
            if (!cleanFraudRecord) reviewReason.append("User fraud risk flagged (flags: ").append(userFraudFlags).append(", 7d disputes: ").append(recentDisputes).append("); ");
            if (!eligibleIssueType) reviewReason.append("Issue type requires supervisor inspection; ");
            dispute.setResolutionNotes(reviewReason.toString());
        }

        Long disputeId = disputeDao.createDispute(dispute);
        dispute.setId(disputeId);

        if (qualifyAutoRefund) {
            creditRefundToWallet(customerId, dispute.getRequestedRefundAmount(), orderId, "Auto Dispute Resolution Refund");
        }

        return dispute;
    }

    public void adminResolve(long disputeId, boolean approve, String notes, long adminUserId) {
        Dispute d = disputeDao.findById(disputeId);
        if (d == null) {
            throw new IllegalArgumentException("Dispute not found: " + disputeId);
        }

        String status = approve ? "APPROVED" : "REJECTED";
        disputeDao.resolveDispute(disputeId, status, notes, adminUserId);

        if (approve && !d.isAutoRefundApproved()) {
            creditRefundToWallet(d.getCustomerId(), d.getRequestedRefundAmount(), d.getOrderId(), "Admin Dispute Approved Refund: " + notes);
        }
    }

    public List<Dispute> getPendingDisputes() {
        return disputeDao.listPendingDisputes();
    }

    public List<Dispute> getCustomerDisputes(long customerId) {
        return disputeDao.listCustomerDisputes(customerId);
    }

    private void creditRefundToWallet(long userId, BigDecimal amount, long orderId, String reason) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                User user = userDao.findById(userId);
                if (user != null) {
                    BigDecimal newBal = (user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO).add(amount);
                    userDao.updateWalletBalance(conn, userId, newBal);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(userId);
                    tx.setAmount(amount);
                    tx.setTransactionType("CREDIT");
                    tx.setReason(reason);
                    tx.setReferenceOrderId(orderId);
                    tx.setBalanceAfter(newBal);
                    walletDao.recordTransaction(conn, tx);
                }
                conn.commit();
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                logger.error("Error crediting refund to user wallet", e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Database connection error in refund", e);
        }
    }
}
