package com.foodplatform.model;

import java.math.BigDecimal;

public class MenuItemAddon {
    private Long id;
    private Long menuItemId;
    private String addonName;
    private BigDecimal price;
    private boolean isAvailable;

    public MenuItemAddon() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

    public String getAddonName() { return addonName; }
    public void setAddonName(String addonName) { this.addonName = addonName; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }
}
