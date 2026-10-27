package com.foodplatform.model;

import java.math.BigDecimal;

public class OrderItem {
    private Long id;
    private Long orderId;
    private Long menuItemId;
    private String itemName;
    private String variantName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal totalPrice;
    private String addonNames;
    private BigDecimal addonTotal;

    public OrderItem() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getAddonNames() { return addonNames; }
    public void setAddonNames(String addonNames) { this.addonNames = addonNames; }

    public BigDecimal getAddonTotal() { return addonTotal; }
    public void setAddonTotal(BigDecimal addonTotal) { this.addonTotal = addonTotal; }
}
