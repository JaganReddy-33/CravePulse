package com.foodplatform.service;

import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.model.RiderProfile;
import com.foodplatform.model.User;
import com.foodplatform.util.JwtUtil;
import com.foodplatform.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private final UserDao userDao = new UserDaoImpl();
    private final RiderDao riderDao = new RiderDaoImpl();

    public Map<String, Object> register(String fullName, String email, String phone, String password, String role) {
        if (userDao.findByEmail(email) != null) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email.trim().toLowerCase());
        user.setPhone(phone.trim());
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setRole(role != null ? role.toUpperCase() : "CUSTOMER");
        user.setStatus("ACTIVE");
        user.setWalletBalance(BigDecimal.ZERO);

        Long userId = userDao.createUser(user);
        if (userId == null) {
            throw new RuntimeException("Could not create user");
        }
        user.setId(userId);

        // If rider, also create default rider profile
        if ("RIDER".equalsIgnoreCase(role)) {
            RiderProfile rp = new RiderProfile();
            rp.setUserId(userId);
            rp.setVehicleType("Motorcycle");
            rp.setVehicleNumber("NEW-REG");
            rp.setDrivingLicense("PENDING-VERIFY");
            rp.setKycApproved(true);
            rp.setOnline(false);
            rp.setAvailable(true);
            rp.setCurrentLatitude(BigDecimal.valueOf(12.9715987));
            rp.setCurrentLongitude(BigDecimal.valueOf(77.5945627));
            rp.setWalletBalance(BigDecimal.ZERO);
            // created via profile logic if needed
        }

        return generateAuthResponse(user);
    }

    public Map<String, Object> login(String email, String password) {
        User user = userDao.findByEmail(email.trim().toLowerCase());
        if (user == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Check account lock
        if (user.getLockedUntil() != null && user.getLockedUntil().after(Timestamp.from(Instant.now()))) {
            long remainingMinutes = (user.getLockedUntil().getTime() - System.currentTimeMillis()) / 60000;
            throw new IllegalStateException("Account is temporarily locked due to too many failed attempts. Try again in " + (remainingMinutes + 1) + " minutes.");
        }

        if (!PasswordUtil.checkPassword(password, user.getPasswordHash())) {
            int failed = user.getFailedAttempts() + 1;
            Timestamp lockTime = null;
            if (failed >= 5) {
                lockTime = Timestamp.from(Instant.now().plusSeconds(900)); // 15 min lock
                logger.warn("User {} locked for 15 minutes due to 5 failed attempts", email);
            }
            userDao.updateFailedAttempts(user.getId(), failed, lockTime);
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Reset failed attempts on success
        if (user.getFailedAttempts() > 0) {
            userDao.resetFailedAttempts(user.getId());
        }

        return generateAuthResponse(user);
    }

    public Map<String, Object> refreshToken(String refreshToken) {
        Long userId = userDao.findUserIdByValidRefreshToken(refreshToken);
        if (userId == null) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        User user = userDao.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        // Rotate token: revoke old, generate new
        userDao.revokeRefreshToken(refreshToken);
        return generateAuthResponse(user);
    }

    private Map<String, Object> generateAuthResponse(User user) {
        String accessToken = JwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());
        String newRefreshToken = JwtUtil.generateRefreshToken();
        Timestamp refreshExpiry = Timestamp.from(Instant.now().plusSeconds(7 * 24 * 3600)); // 7 days

        userDao.storeRefreshToken(user.getId(), newRefreshToken, refreshExpiry);

        Map<String, Object> resp = new HashMap<>();
        resp.put("accessToken", accessToken);
        resp.put("refreshToken", newRefreshToken);
        resp.put("user", Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "phone", user.getPhone(),
                "role", user.getRole(),
                "status", user.getStatus(),
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "walletBalance", user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO
        ));
        return resp;
    }
}
