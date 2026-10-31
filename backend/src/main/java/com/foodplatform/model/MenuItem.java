package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class MenuItem {
    private Long id;
    private Long restaurantId;
    private Long categoryId;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal dineInPrice;
    private BigDecimal platformPrice;
    private boolean isVeg;
    private boolean isAvailable;
    private Integer prepTimeMinutes;
    private Integer calorieCount;
    private BigDecimal rating;
    private int totalOrders;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String slug;
    private String foodType = "VEG";
    private String spiceLevel = "MEDIUM";
    private BigDecimal packagingCharge = BigDecimal.ZERO;
    private boolean isBestseller;
    private boolean isChefSpecial;
    private String allergenInfo;
    private boolean isDeleted = false;
    private int displayOrder = 0;
    private String availableFrom;
    private String availableTo;
    private List<MenuItemVariant> variants = new ArrayList<>();
    private List<MenuItemAddon> addons = new ArrayList<>();

    public MenuItem() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public BigDecimal getDineInPrice() { return dineInPrice; }
    public void setDineInPrice(BigDecimal dineInPrice) {
        if (dineInPrice != null && dineInPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("dineInPrice cannot be negative: " + dineInPrice);
        }
        this.dineInPrice = dineInPrice;
    }

    public BigDecimal getPlatformPrice() { return platformPrice; }
    public void setPlatformPrice(BigDecimal platformPrice) {
        if (platformPrice != null && platformPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("platformPrice cannot be negative: " + platformPrice);
        }
        this.platformPrice = platformPrice;
    }

    public boolean isVeg() { return isVeg; }
    public void setVeg(boolean veg) { isVeg = veg; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public Integer getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(Integer prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public Integer getCalorieCount() { return calorieCount; }
    public void setCalorieCount(Integer calorieCount) { this.calorieCount = calorieCount; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public List<MenuItemVariant> getVariants() { return variants; }
    public void setVariants(List<MenuItemVariant> variants) { this.variants = variants; }

    public List<MenuItemAddon> getAddons() { return addons; }
    public void setAddons(List<MenuItemAddon> addons) { this.addons = addons; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getFoodType() { return foodType; }
    public void setFoodType(String foodType) { this.foodType = foodType; }

    public String getSpiceLevel() { return spiceLevel; }
    public void setSpiceLevel(String spiceLevel) { this.spiceLevel = spiceLevel; }

    public BigDecimal getPackagingCharge() { return packagingCharge; }
    public void setPackagingCharge(BigDecimal packagingCharge) { this.packagingCharge = packagingCharge; }

    public boolean isBestseller() { return isBestseller; }
    public void setBestseller(boolean bestseller) { isBestseller = bestseller; }

    public boolean isChefSpecial() { return isChefSpecial; }
    public void setChefSpecial(boolean chefSpecial) { isChefSpecial = chefSpecial; }

    public String getAllergenInfo() { return allergenInfo; }
    public void setAllergenInfo(String allergenInfo) { this.allergenInfo = allergenInfo; }

    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    public String getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(String availableFrom) { this.availableFrom = availableFrom; }

    public String getAvailableTo() { return availableTo; }
    public void setAvailableTo(String availableTo) { this.availableTo = availableTo; }
}
