package com.foodplatform.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Payment {
    private Long id;
    private Long orderId;
    private String paymentGateway;
    private String transactionReference;
    private String idempotencyKey;
    private String paymentStatus;
    private BigDecimal amount;
    private String rawGatewayResponse;
    private Timestamp createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getPaymentGateway() { return paymentGateway; }
    public void setPaymentGateway(String paymentGateway) { this.paymentGateway = paymentGateway; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getRawGatewayResponse() { return rawGatewayResponse; }
    public void setRawGatewayResponse(String rawGatewayResponse) { this.rawGatewayResponse = rawGatewayResponse; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
