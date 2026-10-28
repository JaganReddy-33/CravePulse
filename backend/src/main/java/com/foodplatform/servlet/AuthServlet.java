package com.foodplatform.servlet;

import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.Address;
import com.foodplatform.model.User;
import com.foodplatform.service.AuthService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

@WebServlet("/api/auth/*")
public class AuthServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final AuthService authService = new AuthService();
    private final UserDao userDao = new UserDaoImpl();
    private final WalletDao walletDao = new WalletDaoImpl();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        try {
            switch (path) {
                case "/register" -> {
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    if (body == null || !body.has("email") || !body.has("password") || !body.has("fullName")) {
                        JsonUtil.sendError(res, 400, "Missing required fields (fullName, email, password)");
                        return;
                    }
                    String fullName = body.get("fullName").getAsString();
                    String email = body.get("email").getAsString();
                    String phone = body.has("phone") && !body.get("phone").isJsonNull() ? body.get("phone").getAsString() : "";
                    String password = body.get("password").getAsString();
                    String role = body.has("role") && !body.get("role").isJsonNull() ? body.get("role").getAsString() : "CUSTOMER";

                    Map<String, Object> resp = authService.register(fullName, email, phone, password, role);
                    JsonUtil.sendSuccess(res, 201, "Registration successful", resp);
                }
                case "/login" -> {
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    if (body == null || !body.has("email") || !body.has("password")) {
                        JsonUtil.sendError(res, 400, "Email and password are required");
                        return;
                    }
                    String email = body.get("email").getAsString();
                    String password = body.get("password").getAsString();

                    Map<String, Object> resp = authService.login(email, password);
                    JsonUtil.sendSuccess(res, 200, "Login successful", resp);
                }
                case "/refresh" -> {
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    if (body == null || !body.has("refreshToken")) {
                        JsonUtil.sendError(res, 400, "refreshToken is required");
                        return;
                    }
                    String rt = body.get("refreshToken").getAsString();
                    Map<String, Object> resp = authService.refreshToken(rt);
                    JsonUtil.sendSuccess(res, 200, "Token refreshed successfully", resp);
                }
                case "/logout" -> {
                    Long userId = getAuthenticatedUserId(req);
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    String rt = (body != null && body.has("refreshToken")) ? body.get("refreshToken").getAsString() : null;
                    authService.logout(userId, rt);
                    JsonUtil.sendSuccess(res, 200, "Logged out successfully. All refresh tokens revoked.", null);
                }
                case "/revoke-token" -> {
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    if (body != null && body.has("refreshToken")) {
                        authService.logout(null, body.get("refreshToken").getAsString());
                    }
                    JsonUtil.sendSuccess(res, 200, "Token revoked", null);
                }
                case "/addresses" -> {
                    if (!requireAuthenticated(req, res)) return;
                    Long userId = getAuthenticatedUserId(req);
                    Address addr = JsonUtil.readRequestBody(req, Address.class);
                    if (addr == null || addr.getAddressLine() == null || addr.getLatitude() == null) {
                        JsonUtil.sendError(res, 400, "Address line and coordinates are required");
                        return;
                    }
                    addr.setUserId(userId);
                    Long id = userDao.addAddress(addr);
                    addr.setId(id);
                    JsonUtil.sendSuccess(res, 201, "Address saved", addr);
                }
                case "/profile" -> {
                    if (!requireAuthenticated(req, res)) return;
                    Long userId = getAuthenticatedUserId(req);
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    if (body == null) {
                        JsonUtil.sendError(res, 400, "Profile payload required");
                        return;
                    }
                    User user = userDao.findById(userId);
                    if (user == null) {
                        JsonUtil.sendError(res, 404, "User not found");
                        return;
                    }
                    String fullName = body.has("fullName") && !body.get("fullName").isJsonNull() ? body.get("fullName").getAsString() : user.getFullName();
                    String phone = body.has("phone") && !body.get("phone").isJsonNull() ? body.get("phone").getAsString() : user.getPhone();
                    String avatar = body.has("avatarUrl") && !body.get("avatarUrl").isJsonNull() ? body.get("avatarUrl").getAsString() : user.getAvatarUrl();
                    userDao.updateProfile(userId, fullName, phone, avatar);
                    user.setFullName(fullName);
                    user.setPhone(phone);
                    user.setAvatarUrl(avatar);
                    JsonUtil.sendSuccess(res, 200, "Profile updated successfully", user);
                }
                case "/verify-phone-otp" -> {
                    if (!requireAuthenticated(req, res)) return;
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    String otp = body != null && body.has("otp") ? body.get("otp").getAsString().trim() : "";
                    if (otp.length() < 4) {
                        JsonUtil.sendError(res, 400, "Invalid verification code");
                        return;
                    }
                    JsonUtil.sendSuccess(res, 200, "Phone number verified successfully", Map.of("verified", true));
                }
                default -> {
                    if (path.startsWith("/addresses/") && path.endsWith("/default")) {
                        if (!requireAuthenticated(req, res)) return;
                        Long userId = getAuthenticatedUserId(req);
                        Long addrId = parseIdFromPath(req);
                        if (addrId != null) {
                            userDao.setDefaultAddress(addrId, userId);
                            JsonUtil.sendSuccess(res, 200, "Default address set", Map.of("addressId", addrId));
                            return;
                        }
                    }
                    if (path.startsWith("/addresses/") && (path.endsWith("/delete") || req.getMethod().equalsIgnoreCase("DELETE"))) {
                        if (!requireAuthenticated(req, res)) return;
                        Long userId = getAuthenticatedUserId(req);
                        Long addrId = parseIdFromPath(req);
                        if (addrId != null) {
                            userDao.deleteAddress(addrId, userId);
                            JsonUtil.sendSuccess(res, 200, "Address deleted", Map.of("addressId", addrId));
                            return;
                        }
                    }
                    if (path.startsWith("/notifications/") && path.endsWith("/read")) {
                        if (!requireAuthenticated(req, res)) return;
                        Long notifId = parseIdFromPath(req);
                        if (notifId != null) {
                            walletDao.markNotificationRead(notifId);
                            JsonUtil.sendSuccess(res, 200, "Notification marked as read", null);
                            return;
                        }
                    }
                    JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
                }
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            JsonUtil.sendError(res, 400, e.getMessage());
        } catch (Exception e) {
            JsonUtil.sendError(res, 500, "Internal authentication error: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";
        if (path.startsWith("/addresses/")) {
            if (!requireAuthenticated(req, res)) return;
            Long userId = getAuthenticatedUserId(req);
            Long addrId = parseIdFromPath(req);
            if (addrId != null) {
                userDao.deleteAddress(addrId, userId);
                JsonUtil.sendSuccess(res, 200, "Address deleted", Map.of("addressId", addrId));
                return;
            }
        }
        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!requireAuthenticated(req, res)) {
            return;
        }
        Long userId = getAuthenticatedUserId(req);

        switch (path) {
            case "/me" -> {
                User user = userDao.findById(userId);
                if (user == null) {
                    JsonUtil.sendError(res, 404, "User not found");
                    return;
                }
                JsonUtil.sendSuccess(res, 200, "User profile", Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "email", user.getEmail(),
                        "phone", user.getPhone() != null ? user.getPhone() : "",
                        "role", user.getRole(),
                        "status", user.getStatus(),
                        "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                        "walletBalance", user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO
                ));
            }
            case "/addresses" -> {
                JsonUtil.sendSuccess(res, 200, "Saved addresses", userDao.getUserAddresses(userId));
            }
            case "/wallet" -> {
                User u = userDao.findById(userId);
                JsonUtil.sendSuccess(res, 200, "Wallet details", Map.of(
                        "balance", u != null && u.getWalletBalance() != null ? u.getWalletBalance() : BigDecimal.ZERO,
                        "transactions", walletDao.getUserTransactions(userId)
                ));
            }
            case "/notifications" -> {
                boolean unreadOnly = "true".equalsIgnoreCase(req.getParameter("unreadOnly"));
                JsonUtil.sendSuccess(res, 200, "Notifications", walletDao.getUserNotifications(userId, unreadOnly));
            }
            default -> JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
        }
    }
}
