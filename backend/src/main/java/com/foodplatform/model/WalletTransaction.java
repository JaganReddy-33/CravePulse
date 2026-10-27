package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class WalletTransaction {
    private Long id;
    private Long userId;
    private BigDecimal amount;
    private String transactionType; // CREDIT, DEBIT
    private String reason;
    private Long referenceOrderId;
    private BigDecimal balanceAfter;
    private Timestamp createdAt;

    public WalletTransaction() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) {
        if (amount != null && amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Transaction amount cannot be negative: " + amount);
        }
        this.amount = amount;
    }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Long getReferenceOrderId() { return referenceOrderId; }
    public void setReferenceOrderId(Long referenceOrderId) { this.referenceOrderId = referenceOrderId; }

    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal balanceAfter) {
        if (balanceAfter != null && balanceAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("balanceAfter cannot be negative: " + balanceAfter);
        }
        this.balanceAfter = balanceAfter;
    }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
