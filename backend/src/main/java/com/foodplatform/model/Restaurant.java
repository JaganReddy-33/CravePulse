package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Restaurant {
    private Long id;
    private Long userId;
    private String name;
    private String slug;
    private String description;
    private String bannerImage;
    private String logoImage;
    private String phone;
    private String email;
    private String cuisineTypes;
    private BigDecimal rating;
    private int totalReviews;
    private boolean pureVeg;
    private String priceTier;
    private int prepTimeMin;
    private int prepTimeMax;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String fssaiLicense;
    private BigDecimal commissionRate;
    private int maxConcurrentOrders;
    private int currentLoad;
    private boolean isOpen;
    private boolean isAutoThrottled;
    private boolean isKycApproved;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private Double distanceKm;
    private String gstNumber;
    private Integer costForTwo;
    private BigDecimal hygieneRating;
    private String locality;
    private String landmark;
    private String pincode;
    private String bankAccountNumber;
    private String bankIfsc;
    private String bankBeneficiaryName;
    private String upiId;
    private int autoRejectMinutes = 10;

    public Restaurant() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBannerImage() { return bannerImage; }
    public void setBannerImage(String bannerImage) { this.bannerImage = bannerImage; }

    public String getLogoImage() { return logoImage; }
    public void setLogoImage(String logoImage) { this.logoImage = logoImage; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCuisineTypes() { return cuisineTypes; }
    public void setCuisineTypes(String cuisineTypes) { this.cuisineTypes = cuisineTypes; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public int getTotalReviews() { return totalReviews; }
    public void setTotalReviews(int totalReviews) { this.totalReviews = totalReviews; }

    public boolean isPureVeg() { return pureVeg; }
    public void setPureVeg(boolean pureVeg) { this.pureVeg = pureVeg; }

    public String getPriceTier() { return priceTier; }
    public void setPriceTier(String priceTier) { this.priceTier = priceTier; }

    public int getPrepTimeMin() { return prepTimeMin; }
    public void setPrepTimeMin(int prepTimeMin) { this.prepTimeMin = prepTimeMin; }

    public int getPrepTimeMax() { return prepTimeMax; }
    public void setPrepTimeMax(int prepTimeMax) { this.prepTimeMax = prepTimeMax; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getFssaiLicense() { return fssaiLicense; }
    public void setFssaiLicense(String fssaiLicense) { this.fssaiLicense = fssaiLicense; }

    public BigDecimal getCommissionRate() { return commissionRate; }
    public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }

    public int getMaxConcurrentOrders() { return maxConcurrentOrders; }
    public void setMaxConcurrentOrders(int maxConcurrentOrders) { this.maxConcurrentOrders = maxConcurrentOrders; }

    public int getCurrentLoad() { return currentLoad; }
    public void setCurrentLoad(int currentLoad) { this.currentLoad = currentLoad; }

    public boolean isOpen() { return isOpen; }
    public void setOpen(boolean open) { isOpen = open; }

    public boolean isAutoThrottled() { return isAutoThrottled; }
    public void setAutoThrottled(boolean autoThrottled) { isAutoThrottled = autoThrottled; }

    public boolean isKycApproved() { return isKycApproved; }
    public void setKycApproved(boolean kycApproved) { isKycApproved = kycApproved; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public Integer getCostForTwo() { return costForTwo; }
    public void setCostForTwo(Integer costForTwo) { this.costForTwo = costForTwo; }

    public BigDecimal getHygieneRating() { return hygieneRating; }
    public void setHygieneRating(BigDecimal hygieneRating) { this.hygieneRating = hygieneRating; }

    public String getLocality() { return locality; }
    public void setLocality(String locality) { this.locality = locality; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getMaskedBankAccount() {
        if (bankAccountNumber == null) {
            return null;
        }
        if (bankAccountNumber.length() < 4) {
            return bankAccountNumber;
        }
        return "••••••••••" + bankAccountNumber.substring(bankAccountNumber.length() - 4);
    }

    public String getBankIfsc() { return bankIfsc; }
    public void setBankIfsc(String bankIfsc) { this.bankIfsc = bankIfsc; }

    public String getBankBeneficiaryName() { return bankBeneficiaryName; }
    public void setBankBeneficiaryName(String bankBeneficiaryName) { this.bankBeneficiaryName = bankBeneficiaryName; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public int getAutoRejectMinutes() { return autoRejectMinutes; }
    public void setAutoRejectMinutes(int autoRejectMinutes) { this.autoRejectMinutes = autoRejectMinutes; }
}
