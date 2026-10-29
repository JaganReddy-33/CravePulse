package com.foodplatform.servlet;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.User;
import com.foodplatform.model.WalletTransaction;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/wallet/*")
public class WalletServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(WalletServlet.class);

    private final UserDao userDao;
    private final WalletDao walletDao;

    public WalletServlet() {
        this(new UserDaoImpl(), new WalletDaoImpl());
    }

    public WalletServlet(UserDao userDao, WalletDao walletDao) {
        this.userDao = userDao;
        this.walletDao = walletDao;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req, res)) return;
        Long userId = getAuthenticatedUserId(req);

        User user = userDao.findById(userId);
        if (user == null) {
            JsonUtil.sendError(res, 404, "User not found");
            return;
        }

        List<WalletTransaction> transactions = walletDao.getUserTransactions(userId);
        Map<String, Object> data = new HashMap<>();
        data.put("balance", user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO);
        data.put("transactions", transactions);

        JsonUtil.sendSuccess(res, 200, "Wallet details retrieved", data);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAuthenticated(req, res)) return;
        Long userId = getAuthenticatedUserId(req);
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/add".equals(path) || "/topup".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("amount")) {
                JsonUtil.sendError(res, 400, "amount is required");
                return;
            }

            BigDecimal amount;
            try {
                amount = body.get("amount").getAsBigDecimal();
            } catch (Exception e) {
                JsonUtil.sendError(res, 400, "Invalid amount format");
                return;
            }

            if (amount.compareTo(BigDecimal.ZERO) <= 0 || amount.compareTo(new BigDecimal("10000.00")) > 0) {
                JsonUtil.sendError(res, 400, "Top-up amount must be between ₹1.00 and ₹10,000.00");
                return;
            }

            try (Connection conn = DatabaseConfig.getConnection()) {
                conn.setAutoCommit(false);
                try {
                    User user = userDao.findByIdWithLock(conn, userId);
                    if (user == null) {
                        JsonUtil.sendError(res, 404, "User account not found");
                        conn.rollback();
                        return;
                    }

                    BigDecimal currentBalance = user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO;
                    BigDecimal newBalance = currentBalance.add(amount);

                    userDao.updateWalletBalance(conn, userId, newBalance);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(userId);
                    tx.setAmount(amount);
                    tx.setTransactionType("CREDIT");
                    tx.setReason("Wallet Top-up");
                    tx.setBalanceAfter(newBalance);
                    walletDao.recordTransaction(conn, tx);

                    conn.commit();

                    Map<String, Object> result = Map.of(
                            "success", true,
                            "addedAmount", amount,
                            "newBalance", newBalance
                    );
                    JsonUtil.sendSuccess(res, 200, "Funds added to wallet successfully", result);
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                } finally {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                logger.error("Error topping up wallet for user {}: {}", userId, e.getMessage());
                JsonUtil.sendError(res, 500, "Could not process wallet top-up at this time. Please try again later.");
            }
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
