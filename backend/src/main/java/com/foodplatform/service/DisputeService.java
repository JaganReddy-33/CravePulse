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

    public Dispute raiseDispute(long orderId, long customerId, String issueType, String description, String photoUrl, BigDecimal requestedRefund) {
        Order order = orderDao.findById(orderId);
        if (order == null || !order.getCustomerId().equals(customerId)) {
            throw new IllegalArgumentException("Invalid order for dispute");
        }

        Dispute dispute = new Dispute();
        dispute.setOrderId(orderId);
        dispute.setCustomerId(customerId);
        dispute.setIssueType(issueType);
        dispute.setDescription(description);
        dispute.setPhotoEvidenceUrl(photoUrl);
        dispute.setRequestedRefundAmount(requestedRefund != null ? requestedRefund : BigDecimal.valueOf(50.00));

        // Problem Differentiation 3: Instant Dispute Resolution with Auto-Refund Tiers
        // Tier 1: Auto-refund claims <= ₹100 for MISSING_ITEM or SEVERE_DELAY
        boolean qualifyAutoRefund = dispute.getRequestedRefundAmount().compareTo(BigDecimal.valueOf(100.00)) <= 0
                && ("MISSING_ITEM".equalsIgnoreCase(issueType) || "SEVERE_DELAY".equalsIgnoreCase(issueType) || "SPILLAGE".equalsIgnoreCase(issueType));

        dispute.setAutoRefundApproved(qualifyAutoRefund);
        dispute.setAdminStatus(qualifyAutoRefund ? "APPROVED" : "PENDING");
        if (qualifyAutoRefund) {
            dispute.setResolutionNotes("Instant auto-refund approved by automated resolution engine.");
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
            } catch (SQLException e) {
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
