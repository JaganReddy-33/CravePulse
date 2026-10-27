package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class DeliveryDispatch {
    private Long id;
    private Long orderId;
    private Long riderId;
    private String dispatchStatus; // OFFERED, ACCEPTED, REJECTED, TIMED_OUT
    private Timestamp offeredAt;
    private Timestamp respondedAt;
    private BigDecimal basePay;
    private BigDecimal distancePay;
    private BigDecimal surgePay;
    private BigDecimal tipAmount;
    private BigDecimal totalEarning;
    private int waitTimeMinutes;
    private BigDecimal waitTimePay;
    private String rejectionReason;
    private Timestamp arrivedAtRestaurantAt;
    private Timestamp pickedUpAt;
    private Timestamp arrivedAtCustomerAt;
    private Timestamp deliveredAt;
    private boolean waitCompensationClaimed;

    // Joined fields
    private String orderNumber;
    private String restaurantName;
    private String restaurantAddress;
    private Double restaurantLat;
    private Double restaurantLng;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private Double customerLat;
    private Double customerLng;
    private BigDecimal orderTotal;
    private String paymentMode;

    public DeliveryDispatch() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }

    public String getDispatchStatus() { return dispatchStatus; }
    public void setDispatchStatus(String dispatchStatus) { this.dispatchStatus = dispatchStatus; }

    public Timestamp getOfferedAt() { return offeredAt; }
    public void setOfferedAt(Timestamp offeredAt) { this.offeredAt = offeredAt; }

    public Timestamp getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Timestamp respondedAt) { this.respondedAt = respondedAt; }

    public BigDecimal getBasePay() { return basePay; }
    public void setBasePay(BigDecimal basePay) { this.basePay = basePay; }

    public BigDecimal getDistancePay() { return distancePay; }
    public void setDistancePay(BigDecimal distancePay) { this.distancePay = distancePay; }

    public BigDecimal getSurgePay() { return surgePay; }
    public void setSurgePay(BigDecimal surgePay) { this.surgePay = surgePay; }

    public BigDecimal getTipAmount() { return tipAmount; }
    public void setTipAmount(BigDecimal tipAmount) { this.tipAmount = tipAmount; }

    public BigDecimal getTotalEarning() { return totalEarning; }
    public void setTotalEarning(BigDecimal totalEarning) { this.totalEarning = totalEarning; }

    public int getWaitTimeMinutes() { return waitTimeMinutes; }
    public void setWaitTimeMinutes(int waitTimeMinutes) { this.waitTimeMinutes = waitTimeMinutes; }

    public BigDecimal getWaitTimePay() { return waitTimePay; }
    public void setWaitTimePay(BigDecimal waitTimePay) { this.waitTimePay = waitTimePay; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }

    public String getRestaurantAddress() { return restaurantAddress; }
    public void setRestaurantAddress(String restaurantAddress) { this.restaurantAddress = restaurantAddress; }

    public Double getRestaurantLat() { return restaurantLat; }
    public void setRestaurantLat(Double restaurantLat) { this.restaurantLat = restaurantLat; }

    public Double getRestaurantLng() { return restaurantLng; }
    public void setRestaurantLng(Double restaurantLng) { this.restaurantLng = restaurantLng; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }

    public Double getCustomerLat() { return customerLat; }
    public void setCustomerLat(Double customerLat) { this.customerLat = customerLat; }

    public Double getCustomerLng() { return customerLng; }
    public void setCustomerLng(Double customerLng) { this.customerLng = customerLng; }

    public BigDecimal getOrderTotal() { return orderTotal; }
    public void setOrderTotal(BigDecimal orderTotal) { this.orderTotal = orderTotal; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public Timestamp getArrivedAtRestaurantAt() { return arrivedAtRestaurantAt; }
    public void setArrivedAtRestaurantAt(Timestamp arrivedAtRestaurantAt) { this.arrivedAtRestaurantAt = arrivedAtRestaurantAt; }

    public Timestamp getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(Timestamp pickedUpAt) { this.pickedUpAt = pickedUpAt; }

    public Timestamp getArrivedAtCustomerAt() { return arrivedAtCustomerAt; }
    public void setArrivedAtCustomerAt(Timestamp arrivedAtCustomerAt) { this.arrivedAtCustomerAt = arrivedAtCustomerAt; }

    public Timestamp getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Timestamp deliveredAt) { this.deliveredAt = deliveredAt; }

    private java.util.List<OrderItem> items;

    public java.util.List<OrderItem> getItems() { return items; }
    public void setItems(java.util.List<OrderItem> items) { this.items = items; }

    public boolean isWaitCompensationClaimed() { return waitCompensationClaimed; }
    public Boolean getWaitCompensationClaimed() { return waitCompensationClaimed; }
    public void setWaitCompensationClaimed(boolean waitCompensationClaimed) { this.waitCompensationClaimed = waitCompensationClaimed; }
}
