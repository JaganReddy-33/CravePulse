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
    private int prepTimeMinutes;
    private int calorieCount;
    private BigDecimal rating;
    private int totalOrders;
    private Timestamp createdAt;
    private Timestamp updatedAt;
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
    public void setDineInPrice(BigDecimal dineInPrice) { this.dineInPrice = dineInPrice; }

    public BigDecimal getPlatformPrice() { return platformPrice; }
    public void setPlatformPrice(BigDecimal platformPrice) { this.platformPrice = platformPrice; }

    public boolean isVeg() { return isVeg; }
    public void setVeg(boolean veg) { isVeg = veg; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public int getCalorieCount() { return calorieCount; }
    public void setCalorieCount(int calorieCount) { this.calorieCount = calorieCount; }

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
}
