package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Dispute {
    private Long id;
    private Long orderId;
    private Long customerId;
    private String issueType; // MISSING_ITEM, SPOILED_FOOD, WRONG_ITEM, SEVERE_DELAY, SPILLAGE
    private String description;
    private String photoEvidenceUrl;
    private BigDecimal requestedRefundAmount;
    private boolean autoRefundApproved;
    private String adminStatus; // PENDING, APPROVED, REJECTED
    private String resolutionNotes;
    private Long resolvedByUserId;
    private Timestamp createdAt;
    private Timestamp resolvedAt;

    // Joined fields
    private String customerName;
    private String orderNumber;
    private String restaurantName;

    public Dispute() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPhotoEvidenceUrl() { return photoEvidenceUrl; }
    public void setPhotoEvidenceUrl(String photoEvidenceUrl) { this.photoEvidenceUrl = photoEvidenceUrl; }

    public BigDecimal getRequestedRefundAmount() { return requestedRefundAmount; }
    public void setRequestedRefundAmount(BigDecimal requestedRefundAmount) { this.requestedRefundAmount = requestedRefundAmount; }

    public boolean isAutoRefundApproved() { return autoRefundApproved; }
    public void setAutoRefundApproved(boolean autoRefundApproved) { this.autoRefundApproved = autoRefundApproved; }

    public String getAdminStatus() { return adminStatus; }
    public void setAdminStatus(String adminStatus) { this.adminStatus = adminStatus; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public Long getResolvedByUserId() { return resolvedByUserId; }
    public void setResolvedByUserId(Long resolvedByUserId) { this.resolvedByUserId = resolvedByUserId; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Timestamp resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
}
