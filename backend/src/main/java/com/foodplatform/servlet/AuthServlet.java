package com.foodplatform.servlet;

import com.foodplatform.dao.UserDao;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.daoImpl.WalletDaoImpl;
import com.foodplatform.model.Address;
import com.foodplatform.model.User;
import com.foodplatform.service.AuthService;
import com.foodplatform.util.JsonUtil;
import com.foodplatform.util.GoogleMapsUrlParser;
import com.foodplatform.util.SessionCookie;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(AuthServlet.class);

    private final AuthService authService = new AuthService();
    private final UserDao userDao = new UserDaoImpl();
    private final WalletDao walletDao = new WalletDaoImpl();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (!SessionCookie.allowedOrigin(req)) { JsonUtil.sendError(res, 403, "Origin not allowed"); return; }
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
                    SessionCookie.write(req, res, resp);
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
                    SessionCookie.write(req, res, resp);
                    JsonUtil.sendSuccess(res, 200, "Login successful", resp);
                }
                case "/refresh" -> {
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    if ((body == null || !body.has("refreshToken")) && SessionCookie.read(req) == null) {
                        JsonUtil.sendError(res, 400, "refreshToken is required");
                        return;
                    }
                    String rt = SessionCookie.read(req) != null ? SessionCookie.read(req) : body.get("refreshToken").getAsString();
                    Map<String, Object> resp = authService.refreshToken(rt);
                    SessionCookie.write(req, res, resp);
                    JsonUtil.sendSuccess(res, 200, "Token refreshed successfully", resp);
                }
                case "/logout" -> {
                    Long userId = getAuthenticatedUserId(req);
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    String rt = SessionCookie.read(req) != null ? SessionCookie.read(req) : (body != null && body.has("refreshToken") ? body.get("refreshToken").getAsString() : null);
                    authService.logout(userId, rt);
                    SessionCookie.clear(req, res);
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
                    if (addr == null ||
                            addr.getTitle() == null || addr.getTitle().isBlank() || addr.getTitle().length() > 50 ||
                            addr.getAddressLine() == null || addr.getAddressLine().isBlank() || addr.getAddressLine().length() > 255 ||
                            addr.getCity() == null || addr.getCity().isBlank() || addr.getCity().length() > 100 ||
                            addr.getState() == null || addr.getState().isBlank() || addr.getState().length() > 100 ||
                            addr.getPostalCode() == null || addr.getPostalCode().isBlank() || addr.getPostalCode().length() > 20 ||
                            (addr.getLandmark() != null && addr.getLandmark().length() > 120) ||
                            addr.getMapsUrl() == null || addr.getMapsUrl().isBlank() || addr.getMapsUrl().length() > 500) {
                        JsonUtil.sendError(res, 400, "Address tag, street, city, state, postal code, and Google Maps link are required.");
                        return;
                    }
                    addr.setTitle(addr.getTitle().trim());
                    addr.setAddressLine(addr.getAddressLine().trim());
                    addr.setCity(addr.getCity().trim());
                    addr.setState(addr.getState().trim());
                    addr.setPostalCode(addr.getPostalCode().trim());
                    addr.setLandmark(addr.getLandmark() == null || addr.getLandmark().isBlank() ? null : addr.getLandmark().trim());
                    addr.setMapsUrl(addr.getMapsUrl().trim());
                    GoogleMapsUrlParser.Coordinates coordinates = GoogleMapsUrlParser.parse(addr.getMapsUrl());
                    addr.setLatitude(coordinates.latitude());
                    addr.setLongitude(coordinates.longitude());
                    addr.setUserId(userId);
                    Long id = userDao.addAddress(addr);
                    if (id == null) throw new IllegalStateException("Address could not be saved");
                    Address savedAddress = userDao.getAddressById(id);
                    if (savedAddress == null) throw new IllegalStateException("Saved address could not be retrieved");
                    JsonUtil.sendSuccess(res, 201, "Address saved", savedAddress);
                }
                case "/password" -> {
                    if(!requireAuthenticated(req,res)) return;
                    JsonObject body=JsonUtil.readRequestBody(req,JsonObject.class);
                    if(body==null || !body.has("currentPassword") || !body.has("newPassword")) throw new IllegalArgumentException("Current and new password are required");
                    String current=body.get("currentPassword").getAsString(), next=body.get("newPassword").getAsString();
                    User account=userDao.findById(getAuthenticatedUserId(req));
                    if(account==null || !com.foodplatform.util.PasswordUtil.checkPassword(current,account.getPasswordHash())) throw new IllegalArgumentException("Current password is incorrect");
                    if(next.length()<12 || next.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72) throw new IllegalArgumentException("Use a password of at least 12 characters and no more than 72 bytes");
                    try(var c=com.foodplatform.config.DatabaseConfig.getConnection();var ps=c.prepareStatement("UPDATE users SET password_hash=? WHERE id=?")) {
                        ps.setString(1,com.foodplatform.util.PasswordUtil.hashPassword(next));ps.setLong(2,account.getId());ps.executeUpdate();
                    }
                    userDao.revokeAllUserTokens(account.getId());SessionCookie.clear(req,res);
                    JsonUtil.sendSuccess(res,200,"Password changed. Please sign in again.",null);
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
                    if (fullName.trim().length()<2 || fullName.length()>120 || (phone!=null && phone.length()>20) || (avatar!=null && !avatar.isBlank() && (!avatar.startsWith("https://") || avatar.length()>500))) throw new IllegalArgumentException("Provide a valid name, phone and optional HTTPS image URL");
                    userDao.updateProfile(userId, fullName.trim(), phone==null||phone.isBlank()?null:phone.trim(), avatar);
                    user.setFullName(fullName);
                    user.setPhone(phone);
                    user.setAvatarUrl(avatar);
                    JsonUtil.sendSuccess(res, 200, "Profile updated successfully", user);
                }
                case "/verify-phone-otp" -> {
                    if (!requireAuthenticated(req, res)) return;
                    JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                    JsonUtil.sendError(res, 503, "Phone verification is unavailable until an SMS verification provider is configured.");
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
                            walletDao.markNotificationRead(notifId, getAuthenticatedUserId(req));
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
            logger.error("Internal authentication error", e);
            JsonUtil.sendError(res, 500, "Internal authentication service error. Please try again later.");
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
