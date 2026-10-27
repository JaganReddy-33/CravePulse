package com.foodplatform.service;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.dao.PaymentDao;
import com.foodplatform.daoImpl.OrderDaoImpl;
import com.foodplatform.daoImpl.PaymentDaoImpl;
import com.foodplatform.model.Order;
import com.foodplatform.model.Payment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.UUID;

public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentDao paymentDao;
    private final OrderDao orderDao;

    public PaymentService() {
        this(new PaymentDaoImpl(), new OrderDaoImpl());
    }

    public PaymentService(PaymentDao paymentDao, OrderDao orderDao) {
        this.paymentDao = paymentDao;
        this.orderDao = orderDao;
    }

    public Payment processPayment(long orderId, String gateway, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Payment existing = paymentDao.findByIdempotencyKey(idempotencyKey);
            if (existing != null) {
                logger.info("Idempotent payment re-hit: {}", idempotencyKey);
                return existing;
            }
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Order order = orderDao.findWithLock(conn, orderId);
                if (order == null) {
                    throw new IllegalArgumentException("Order not found: " + orderId);
                }

                Payment payment = new Payment();
                payment.setOrderId(orderId);
                payment.setPaymentGateway(gateway != null ? gateway : "RAZORPAY");
                payment.setTransactionReference("TXN_" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
                payment.setIdempotencyKey(idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString());
                payment.setPaymentStatus("SUCCESS");
                payment.setAmount(amount);
                payment.setRawGatewayResponse("{\"status\":\"captured\",\"method\":\"netbanking\"}");

                paymentDao.createPayment(conn, payment);
                conn.commit();
                return payment;
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error processing payment for order: {}", orderId, e);
            throw new RuntimeException("Payment processing failed", e);
        }
    }
}
