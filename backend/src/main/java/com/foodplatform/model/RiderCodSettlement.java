package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class RiderCodSettlement {
    private Long id;
    private Long riderId;
    private Long orderId;
    private BigDecimal amount;
    private String transactionType; // COLLECTED, DEPOSITED, ADJUSTED
    private BigDecimal runningCashInHand;
    private String referenceNumber;
    private String notes;
    private Timestamp createdAt;

    public RiderCodSettlement() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public BigDecimal getRunningCashInHand() { return runningCashInHand; }
    public void setRunningCashInHand(BigDecimal runningCashInHand) { this.runningCashInHand = runningCashInHand; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
