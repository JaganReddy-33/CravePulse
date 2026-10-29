package com.foodplatform.service;
import com.foodplatform.config.AppProperties;

import com.foodplatform.dao.RestaurantDao;
import com.foodplatform.dao.RiderDao;
import com.foodplatform.dao.UserDao;
import com.foodplatform.daoImpl.RestaurantDaoImpl;
import com.foodplatform.daoImpl.RiderDaoImpl;
import com.foodplatform.daoImpl.UserDaoImpl;
import com.foodplatform.model.Restaurant;
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
import java.util.regex.Pattern;

public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+91)?[6-9]\\d{9}$");

    private final UserDao userDao = new UserDaoImpl();
    private final RestaurantDao restaurantDao = new RestaurantDaoImpl();
    private final RiderDao riderDao = new RiderDaoImpl();

    public void validateCredentials(String email, String password, String phone) {
        if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("Invalid email format. Please provide a valid email address.");
        }
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("Password does not meet security policy: minimum 8 characters with at least one letter and one number.");
        }
        if (phone != null && !phone.isBlank() && !PHONE_PATTERN.matcher(phone.trim()).matches()) {
            throw new IllegalArgumentException("Invalid phone number format. Must be a valid 10-digit Indian mobile number (+91 optional).");
        }
    }

    public Map<String, Object> register(String fullName, String email, String phone, String password, String role) {
        if (fullName == null || fullName.trim().length() < 2) {
            throw new IllegalArgumentException("Full name must be at least 2 characters long.");
        }
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanPhone = phone != null ? phone.trim() : "";

        // Reject role escalation attempts: public signup creates CUSTOMER only
        if (role != null && !role.isBlank() && !"CUSTOMER".equalsIgnoreCase(role.trim())) {
            throw new IllegalArgumentException("Public registration creates CUSTOMER accounts only. For partner or rider onboarding, please submit an application.");
        }

        validateCredentials(cleanEmail, password, cleanPhone);

        if (userDao.findByEmail(cleanEmail) != null) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        if (!cleanPhone.isEmpty() && userDao.findByPhone(cleanPhone) != null) {
            throw new IllegalArgumentException("An account with this phone number already exists.");
        }

        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(cleanEmail);
        user.setPhone(cleanPhone.isEmpty() ? null : cleanPhone);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setRole("CUSTOMER"); // strictly CUSTOMER
        user.setStatus("ACTIVE");
        user.setWalletBalance(BigDecimal.ZERO);

        Long userId = userDao.createUser(user);
        if (userId == null) {
            throw new RuntimeException("Could not create user account in database.");
        }
        user.setId(userId);

        return generateAuthResponse(user);
    }

    public Map<String, Object> applyPartner(String fullName, String email, String phone, String password,
                                           String restaurantName, String address, Double latitude, Double longitude,
                                           String cuisineTypes, String fssaiLicense) {
        if (fullName == null || fullName.trim().length() < 2) {
            throw new IllegalArgumentException("Owner full name is required.");
        }
        if (restaurantName == null || restaurantName.trim().length() < 2) {
            throw new IllegalArgumentException("Restaurant name is required.");
        }
        if (fssaiLicense == null || fssaiLicense.trim().length() < 5) {
            throw new IllegalArgumentException("Valid FSSAI license number is required for food partner onboarding.");
        }

        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanPhone = phone != null ? phone.trim() : "";
        validateCredentials(cleanEmail, password, cleanPhone);

        if (userDao.findByEmail(cleanEmail) != null) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        if (!cleanPhone.isEmpty() && userDao.findByPhone(cleanPhone) != null) {
            throw new IllegalArgumentException("An account with this phone number already exists.");
        }

        if (latitude == null || longitude == null || !Double.isFinite(latitude) || !Double.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180 || address==null || address.isBlank()) throw new IllegalArgumentException("Kitchen address and valid coordinates are required");
        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(cleanEmail);
        user.setPhone(cleanPhone.isBlank() ? null : cleanPhone);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setRole("RESTAURANT_OWNER");
        user.setStatus("PENDING_KYC");
        user.setWalletBalance(BigDecimal.ZERO);

        Long userId = userDao.createUser(user);
        if (userId == null) {
            throw new RuntimeException("Could not create partner account.");
        }
        user.setId(userId);

        String slug = restaurantName.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + (int) (1000 + Math.random() * 9000);
        Restaurant rest = new Restaurant();
        rest.setUserId(userId);
        rest.setName(restaurantName.trim());
        rest.setSlug(slug);
        rest.setDescription("Authentic cuisine partner onboarded on CravePulse.");
        rest.setBannerImage(null);
        rest.setLogoImage(null);
        rest.setPhone(cleanPhone);
        rest.setEmail(cleanEmail);
        rest.setCuisineTypes(cuisineTypes != null && !cuisineTypes.isBlank() ? cuisineTypes.trim() : "Multi-Cuisine");
        rest.setLatitude(BigDecimal.valueOf(latitude));
        rest.setLongitude(BigDecimal.valueOf(longitude));
        rest.setAddress(address.trim());
        rest.setFssaiLicense(fssaiLicense.trim());
        rest.setOpen(false); // Closed until approved
        rest.setAutoThrottled(false);
        rest.setKycApproved(false); // Unapproved until admin reviews

        Long restId = restaurantDao.createRestaurant(rest);
        if (restId == null) throw new IllegalStateException("Kitchen profile could not be created; contact support to complete onboarding");
        rest.setId(restId);

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", userId);
        resp.put("restaurantId", restId);
        resp.put("status", "PENDING_KYC");
        resp.put("message", "Restaurant partner application submitted successfully. Pending admin KYC approval.");
        return resp;
    }

    public Map<String, Object> applyRider(String fullName, String email, String phone, String password,
                                         String vehicleType, String vehicleNumber, String drivingLicense) {
        if (fullName == null || fullName.trim().length() < 2) {
            throw new IllegalArgumentException("Rider full name is required.");
        }
        if (vehicleNumber == null || vehicleNumber.trim().length() < 4) {
            throw new IllegalArgumentException("Valid vehicle registration number is required.");
        }
        if (drivingLicense == null || drivingLicense.trim().length() < 5) {
            throw new IllegalArgumentException("Valid driving license number is required for delivery fleet onboarding.");
        }

        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanPhone = phone != null ? phone.trim() : "";
        validateCredentials(cleanEmail, password, cleanPhone);

        if (userDao.findByEmail(cleanEmail) != null) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        if (!cleanPhone.isEmpty() && userDao.findByPhone(cleanPhone) != null) {
            throw new IllegalArgumentException("An account with this phone number already exists.");
        }

        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(cleanEmail);
        user.setPhone(cleanPhone.isBlank() ? null : cleanPhone);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setRole("RIDER");
        user.setStatus("PENDING_KYC");
        user.setWalletBalance(BigDecimal.ZERO);

        Long userId = userDao.createUser(user);
        if (userId == null) {
            throw new RuntimeException("Could not create delivery rider account.");
        }
        user.setId(userId);

        RiderProfile rp = new RiderProfile();
        rp.setUserId(userId);
        rp.setVehicleType(vehicleType != null && !vehicleType.isBlank() ? vehicleType.trim() : "Electric Scooter");
        rp.setVehicleNumber(vehicleNumber.trim().toUpperCase());
        rp.setDrivingLicense(drivingLicense.trim().toUpperCase());
        rp.setKycApproved(false); // Unapproved until admin reviews
        rp.setOnline(false);
        rp.setAvailable(false);
        rp.setCurrentLatitude(null);
        rp.setCurrentLongitude(null);
        rp.setWalletBalance(BigDecimal.ZERO);

        Long riderId = riderDao.createRiderProfile(rp);
        rp.setId(riderId);

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", userId);
        resp.put("riderId", riderId);
        resp.put("status", "PENDING_KYC");
        resp.put("message", "Delivery rider application submitted successfully. Pending admin KYC approval.");
        return resp;
    }

    public Map<String, Object> login(String email, String password) {
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        User user = userDao.findByEmail(cleanEmail);
        if (user == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalStateException("Your account has been suspended by platform administration. Please contact ops support.");
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
                logger.warn("User {} locked for 15 minutes due to 5 failed attempts", cleanEmail);
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

        if (!"ACTIVE".equals(user.getStatus()) && !"PENDING_KYC".equals(user.getStatus())) throw new IllegalArgumentException("Account is not active");
        // Rotate token: revoke old, generate new
        userDao.revokeRefreshToken(refreshToken);
        return generateAuthResponse(user);
    }

    public void logout(Long userId, String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            userDao.revokeRefreshToken(refreshToken.trim());
        }
        if (userId != null) {
            userDao.revokeAllUserTokens(userId);
        }
    }

    private Map<String, Object> generateAuthResponse(User user) {
        String accessToken = JwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());
        String newRefreshToken = JwtUtil.generateRefreshToken();
        Timestamp refreshExpiry = new Timestamp(System.currentTimeMillis() + AppProperties.getRefreshTokenExpirationMillis()); // 7 days

        userDao.storeRefreshToken(user.getId(), newRefreshToken, refreshExpiry);

        Map<String, Object> resp = new HashMap<>();
        resp.put("accessToken", accessToken);
        resp.put("refreshToken", newRefreshToken);
        resp.put("user", Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", user.getRole(),
                "status", user.getStatus(),
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "walletBalance", user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO
        ));
        return resp;
    }
}
