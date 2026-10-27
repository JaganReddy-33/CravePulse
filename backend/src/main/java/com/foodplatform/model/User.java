package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class User {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String passwordHash;
    private String role; // CUSTOMER, RESTAURANT_OWNER, RIDER, ADMIN
    private String status; // ACTIVE, PENDING_KYC, SUSPENDED
    private int failedAttempts;
    private Timestamp lockedUntil;
    private String avatarUrl;
    private BigDecimal walletBalance;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public User() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }

    public Timestamp getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Timestamp lockedUntil) { this.lockedUntil = lockedUntil; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public BigDecimal getWalletBalance() { return walletBalance; }
    public void setWalletBalance(BigDecimal walletBalance) { this.walletBalance = walletBalance; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
