package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class RiderProfile {
    private Long id;
    private Long userId;
    private String vehicleType;
    private String vehicleNumber;
    private String drivingLicense;
    private boolean isKycApproved;
    private boolean isOnline;
    private boolean isAvailable;
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private Timestamp lastPingTime;
    private int totalDeliveries;
    private BigDecimal rating;
    private Long activeOrderId;
    private BigDecimal walletBalance;
    private BigDecimal cashInHand = BigDecimal.ZERO;
    private BigDecimal maxCashLimit = BigDecimal.valueOf(5000.00);
    private Timestamp createdAt;
    private Timestamp updatedAt;

    // Joined fields
    private String riderName;
    private String riderPhone;
    private String riderEmail;
    private String avatarUrl;

    public RiderProfile() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getDrivingLicense() { return drivingLicense; }
    public void setDrivingLicense(String drivingLicense) { this.drivingLicense = drivingLicense; }

    public boolean isKycApproved() { return isKycApproved; }
    public void setKycApproved(boolean kycApproved) { isKycApproved = kycApproved; }

    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { isOnline = online; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public BigDecimal getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(BigDecimal currentLatitude) { this.currentLatitude = currentLatitude; }

    public BigDecimal getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(BigDecimal currentLongitude) { this.currentLongitude = currentLongitude; }

    public Timestamp getLastPingTime() { return lastPingTime; }
    public void setLastPingTime(Timestamp lastPingTime) { this.lastPingTime = lastPingTime; }

    public int totalDeliveries() { return totalDeliveries; }
    public int getTotalDeliveries() { return totalDeliveries; }
    public void setTotalDeliveries(int totalDeliveries) { this.totalDeliveries = totalDeliveries; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Long getActiveOrderId() { return activeOrderId; }
    public void setActiveOrderId(Long activeOrderId) { this.activeOrderId = activeOrderId; }

    public BigDecimal getWalletBalance() { return walletBalance; }
    public void setWalletBalance(BigDecimal walletBalance) { this.walletBalance = walletBalance; }

    public BigDecimal getCashInHand() { return cashInHand != null ? cashInHand : BigDecimal.ZERO; }
    public void setCashInHand(BigDecimal cashInHand) { this.cashInHand = cashInHand; }

    public BigDecimal getMaxCashLimit() { return maxCashLimit != null ? maxCashLimit : BigDecimal.valueOf(5000.00); }
    public void setMaxCashLimit(BigDecimal maxCashLimit) { this.maxCashLimit = maxCashLimit; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public String getRiderName() { return riderName; }
    public void setRiderName(String riderName) { this.riderName = riderName; }

    public String getRiderPhone() { return riderPhone; }
    public void setRiderPhone(String riderPhone) { this.riderPhone = riderPhone; }

    public String getRiderEmail() { return riderEmail; }
    public void setRiderEmail(String riderEmail) { this.riderEmail = riderEmail; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
