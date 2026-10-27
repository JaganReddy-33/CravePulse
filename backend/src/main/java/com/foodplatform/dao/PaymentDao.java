package com.foodplatform.dao;

import com.foodplatform.model.Payment;
import java.sql.Connection;
import java.sql.SQLException;

public interface PaymentDao {
    Long createPayment(Connection conn, Payment payment) throws SQLException;
    Payment findByIdempotencyKey(String idempotencyKey);
    Payment findByOrderId(long orderId);
    void updatePaymentStatus(Connection conn, long paymentId, String status) throws SQLException;
}
