package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class OrderEvent {
    private Long id;
    private Long orderId;
    private String previousStatus;
    private String newStatus;
    private Long triggeredByUserId;
    private String actorRole;
    private String reason;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Timestamp createdAt;

    public OrderEvent() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public Long getTriggeredByUserId() { return triggeredByUserId; }
    public void setTriggeredByUserId(Long triggeredByUserId) { this.triggeredByUserId = triggeredByUserId; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
