package com.foodplatform.dao;

import com.foodplatform.model.Payment;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;

public interface PaymentDao {
    Long createPayment(Connection conn, Payment payment) throws SQLException;
    Payment findById(long id);
    Payment findByOrderId(long orderId);
    Payment findByRazorpayOrderId(String razorpayOrderId);
    Payment findByIdempotencyKey(String idempotencyKey);
    void updatePaymentStatus(Connection conn, long paymentId, String status) throws SQLException;
    void updateStatusAndDetails(Connection conn, long paymentId, String status, String paymentIdRzp, String signature, String rawResponse) throws SQLException;
    void recordRefund(Connection conn, long paymentId, String refundId, BigDecimal refundAmount, String refundStatus) throws SQLException;
    boolean hasWebhookEventBeenProcessed(String eventId);
    void recordWebhookEvent(String eventId, String eventType, String payload);
}
