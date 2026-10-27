package com.foodplatform.dao;

import com.foodplatform.model.Order;
import com.foodplatform.model.OrderEvent;
import com.foodplatform.model.OrderItem;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

public interface OrderDao {

    Long createOrder(Connection conn, Order order) throws SQLException;

    void createOrderItems(Connection conn, long orderId, List<OrderItem> items) throws SQLException;

    Order findWithLock(Connection conn, long orderId) throws SQLException;

    void updateOrderStatus(Connection conn, long orderId, String newStatus, Timestamp actualDeliveryAt) throws SQLException;

    void updateOrderPaymentStatus(Connection conn, long orderId, String paymentStatus) throws SQLException;

    void assignRiderToOrder(Connection conn, long orderId, long riderId) throws SQLException;

    void recordOrderEvent(Connection conn, OrderEvent event) throws SQLException;

    Order findById(long orderId);

    Order findByOrderNumber(String orderNumber);

    List<OrderItem> getOrderItems(long orderId);

    List<OrderEvent> getOrderTimeline(long orderId);

    List<Order> listCustomerOrders(long customerId, int limit, int offset);

    List<Order> listRestaurantOrders(long restaurantId, String status, int limit, int offset);

    List<Order> listAllOrders(int limit, int offset);

    Order findByIdempotencyKey(String idempotencyKey);

    int getCustomerOrderCount(long customerId);

    void setGoodwillCreditAwarded(Connection conn, long orderId, boolean awarded) throws SQLException;

    List<Order> findUnassignedOrders(int limit);
}
