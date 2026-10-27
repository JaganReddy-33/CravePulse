package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Order {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private Long restaurantId;
    private Long riderId;
    private Long deliveryAddressId;
    private String status; // PLACED, ACCEPTED, PREPARING, READY, PICKED_UP, DELIVERED, CANCELLED, REJECTED, REFUNDED
    private BigDecimal subtotal;
    private BigDecimal restaurantDiscount;
    private Long couponId;
    private BigDecimal couponDiscount;
    private BigDecimal packagingFee;
    private BigDecimal deliveryFee;
    private BigDecimal platformFee;
    private BigDecimal gstTax;
    private BigDecimal totalAmount;
    private String paymentMode; // COD, RAZORPAY
    private String paymentStatus; // PENDING, PAID, FAILED, REFUNDED
    private String idempotencyKey;
    private int etaMinMinutes;
    private int etaMaxMinutes;
    private Timestamp estimatedDeliveryAt;
    private Timestamp actualDeliveryAt;
    private boolean isGoodwillCreditAwarded;
    private String specialInstructions;
    private String cancellationReason;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    // Joined fields for rich client presentation
    private String restaurantName;
    private String customerName;
    private String customerPhone;
    private String riderName;
    private String riderPhone;
    private String deliveryAddressText;
    private Double restaurantLat;
    private Double restaurantLng;
    private Double deliveryLat;
    private Double deliveryLng;
    private List<OrderItem> items = new ArrayList<>();
    private List<OrderEvent> timeline = new ArrayList<>();

    public Order() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }

    public Long getDeliveryAddressId() { return deliveryAddressId; }
    public void setDeliveryAddressId(Long deliveryAddressId) { this.deliveryAddressId = deliveryAddressId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getRestaurantDiscount() { return restaurantDiscount; }
    public void setRestaurantDiscount(BigDecimal restaurantDiscount) { this.restaurantDiscount = restaurantDiscount; }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public BigDecimal getCouponDiscount() { return couponDiscount; }
    public void setCouponDiscount(BigDecimal couponDiscount) { this.couponDiscount = couponDiscount; }

    public BigDecimal getPackagingFee() { return packagingFee; }
    public void setPackagingFee(BigDecimal packagingFee) { this.packagingFee = packagingFee; }

    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }

    public BigDecimal getPlatformFee() { return platformFee; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }

    public BigDecimal getGstTax() { return gstTax; }
    public void setGstTax(BigDecimal gstTax) { this.gstTax = gstTax; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public int getEtaMinMinutes() { return etaMinMinutes; }
    public void setEtaMinMinutes(int etaMinMinutes) { this.etaMinMinutes = etaMinMinutes; }

    public int getEtaMaxMinutes() { return etaMaxMinutes; }
    public void setEtaMaxMinutes(int etaMaxMinutes) { this.etaMaxMinutes = etaMaxMinutes; }

    public Timestamp getEstimatedDeliveryAt() { return estimatedDeliveryAt; }
    public void setEstimatedDeliveryAt(Timestamp estimatedDeliveryAt) { this.estimatedDeliveryAt = estimatedDeliveryAt; }

    public Timestamp getActualDeliveryAt() { return actualDeliveryAt; }
    public void setActualDeliveryAt(Timestamp actualDeliveryAt) { this.actualDeliveryAt = actualDeliveryAt; }

    public boolean isGoodwillCreditAwarded() { return isGoodwillCreditAwarded; }
    public void setGoodwillCreditAwarded(boolean goodwillCreditAwarded) { isGoodwillCreditAwarded = goodwillCreditAwarded; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getRiderName() { return riderName; }
    public void setRiderName(String riderName) { this.riderName = riderName; }

    public String getRiderPhone() { return riderPhone; }
    public void setRiderPhone(String riderPhone) { this.riderPhone = riderPhone; }

    public String getDeliveryAddressText() { return deliveryAddressText; }
    public void setDeliveryAddressText(String deliveryAddressText) { this.deliveryAddressText = deliveryAddressText; }

    public Double getRestaurantLat() { return restaurantLat; }
    public void setRestaurantLat(Double restaurantLat) { this.restaurantLat = restaurantLat; }

    public Double getRestaurantLng() { return restaurantLng; }
    public void setRestaurantLng(Double restaurantLng) { this.restaurantLng = restaurantLng; }

    public Double getDeliveryLat() { return deliveryLat; }
    public void setDeliveryLat(Double deliveryLat) { this.deliveryLat = deliveryLat; }

    public Double getDeliveryLng() { return deliveryLng; }
    public void setDeliveryLng(Double deliveryLng) { this.deliveryLng = deliveryLng; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public List<OrderEvent> getTimeline() { return timeline; }
    public void setTimeline(List<OrderEvent> timeline) { this.timeline = timeline; }
}
