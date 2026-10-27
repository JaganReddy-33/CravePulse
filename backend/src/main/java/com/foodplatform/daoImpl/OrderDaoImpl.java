package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.OrderDao;
import com.foodplatform.model.Order;
import com.foodplatform.model.OrderEvent;
import com.foodplatform.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class OrderDaoImpl implements OrderDao {

    private static final Logger logger = LoggerFactory.getLogger(OrderDaoImpl.class);

    @Override
    public Long createOrder(Connection conn, Order order) throws SQLException {
        String sql = "INSERT INTO orders (order_number, customer_id, restaurant_id, delivery_address_id, status, " +
                "subtotal, restaurant_discount, coupon_id, coupon_discount, packaging_fee, delivery_fee, platform_fee, gst_tax, " +
                "total_amount, payment_mode, payment_status, idempotency_key, eta_min_minutes, eta_max_minutes, " +
                "estimated_delivery_at, special_instructions) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, order.getOrderNumber());
            ps.setLong(2, order.getCustomerId());
            ps.setLong(3, order.getRestaurantId());
            ps.setLong(4, order.getDeliveryAddressId());
            ps.setString(5, order.getStatus());
            ps.setBigDecimal(6, order.getSubtotal());
            ps.setBigDecimal(7, order.getRestaurantDiscount());
            if (order.getCouponId() != null) ps.setLong(8, order.getCouponId());
            else ps.setNull(8, Types.BIGINT);
            ps.setBigDecimal(9, order.getCouponDiscount());
            ps.setBigDecimal(10, order.getPackagingFee());
            ps.setBigDecimal(11, order.getDeliveryFee());
            ps.setBigDecimal(12, order.getPlatformFee());
            ps.setBigDecimal(13, order.getGstTax());
            ps.setBigDecimal(14, order.getTotalAmount());
            ps.setString(15, order.getPaymentMode());
            ps.setString(16, order.getPaymentStatus());
            ps.setString(17, order.getIdempotencyKey());
            ps.setInt(18, order.getEtaMinMinutes());
            ps.setInt(19, order.getEtaMaxMinutes());
            ps.setTimestamp(20, order.getEstimatedDeliveryAt());
            ps.setString(21, order.getSpecialInstructions());

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    order.setId(id);
                    return id;
                }
            }
        }
        return null;
    }

    @Override
    public void createOrderItems(Connection conn, long orderId, List<OrderItem> items) throws SQLException {
        String sql = "INSERT INTO order_items (order_id, menu_item_id, item_name, variant_name, unit_price, quantity, total_price, addon_names, addon_total) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (OrderItem it : items) {
                ps.setLong(1, orderId);
                ps.setLong(2, it.getMenuItemId());
                ps.setString(3, it.getItemName());
                ps.setString(4, it.getVariantName());
                ps.setBigDecimal(5, it.getUnitPrice());
                ps.setInt(6, it.getQuantity());
                ps.setBigDecimal(7, it.getTotalPrice());
                ps.setString(8, it.getAddonNames());
                ps.setBigDecimal(9, it.getAddonTotal());
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    @Override
    public Order findWithLock(Connection conn, long orderId) throws SQLException {
        String sql = "SELECT * FROM orders WHERE id = ? FOR UPDATE";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapOrder(rs);
                }
            }
        }
        return null;
    }

    @Override
    public void updateOrderStatus(Connection conn, long orderId, String newStatus, Timestamp actualDeliveryAt) throws SQLException {
        String sql = "UPDATE orders SET status = ?, actual_delivery_at = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setTimestamp(2, actualDeliveryAt);
            ps.setLong(3, orderId);
            ps.executeUpdate();
        }
    }

    @Override
    public void assignRiderToOrder(Connection conn, long orderId, long riderId) throws SQLException {
        String sql = "UPDATE orders SET rider_id = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, riderId);
            ps.setLong(2, orderId);
            ps.executeUpdate();
        }
    }

    @Override
    public void recordOrderEvent(Connection conn, OrderEvent event) throws SQLException {
        String sql = "INSERT INTO order_events (order_id, previous_status, new_status, triggered_by_user_id, reason, latitude, longitude) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, event.getOrderId());
            ps.setString(2, event.getPreviousStatus());
            ps.setString(3, event.getNewStatus());
            if (event.getTriggeredByUserId() != null) ps.setLong(4, event.getTriggeredByUserId());
            else ps.setNull(4, Types.BIGINT);
            ps.setString(5, event.getReason());
            ps.setBigDecimal(6, event.getLatitude());
            ps.setBigDecimal(7, event.getLongitude());
            ps.executeUpdate();
        }
    }

    @Override
    public Order findById(long orderId) {
        String sql = "SELECT o.*, r.name AS rest_name, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "rp_user.full_name AS rd_name, rp_user.phone AS rd_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS addr_text, " +
                "a.latitude AS addr_lat, a.longitude AS addr_lng " +
                "FROM orders o " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "LEFT JOIN rider_profiles rd ON o.rider_id = rd.id " +
                "LEFT JOIN users rp_user ON rd.user_id = rp_user.id " +
                "WHERE o.id = ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Order order = mapOrder(rs);
                    hydrateOrderDetails(order, rs);
                    order.setItems(getOrderItems(orderId));
                    order.setTimeline(getOrderTimeline(orderId));
                    return order;
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding order by id: {}", orderId, e);
        }
        return null;
    }

    @Override
    public Order findByOrderNumber(String orderNumber) {
        String sql = "SELECT id FROM orders WHERE order_number = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, orderNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return findById(rs.getLong("id"));
                }
            }
        } catch (SQLException e) {
            logger.error("Error finding order by number: {}", orderNumber, e);
        }
        return null;
    }

    @Override
    public List<OrderItem> getOrderItems(long orderId) {
        List<OrderItem> list = new ArrayList<>();
        String sql = "SELECT * FROM order_items WHERE order_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderItem item = new OrderItem();
                    item.setId(rs.getLong("id"));
                    item.setOrderId(rs.getLong("order_id"));
                    item.setMenuItemId(rs.getLong("menu_item_id"));
                    item.setItemName(rs.getString("item_name"));
                    item.setVariantName(rs.getString("variant_name"));
                    item.setUnitPrice(rs.getBigDecimal("unit_price"));
                    item.setQuantity(rs.getInt("quantity"));
                    item.setTotalPrice(rs.getBigDecimal("total_price"));
                    item.setAddonNames(rs.getString("addon_names"));
                    item.setAddonTotal(rs.getBigDecimal("addon_total"));
                    list.add(item);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching order items for order: {}", orderId, e);
        }
        return list;
    }

    @Override
    public List<OrderEvent> getOrderTimeline(long orderId) {
        List<OrderEvent> list = new ArrayList<>();
        String sql = "SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderEvent ev = new OrderEvent();
                    ev.setId(rs.getLong("id"));
                    ev.setOrderId(rs.getLong("order_id"));
                    ev.setPreviousStatus(rs.getString("previous_status"));
                    ev.setNewStatus(rs.getString("new_status"));
                    ev.setTriggeredByUserId(rs.getLong("triggered_by_user_id"));
                    ev.setReason(rs.getString("reason"));
                    ev.setLatitude(rs.getBigDecimal("latitude"));
                    ev.setLongitude(rs.getBigDecimal("longitude"));
                    ev.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(ev);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching timeline for order: {}", orderId, e);
        }
        return list;
    }

    @Override
    public List<Order> listCustomerOrders(long customerId, int limit, int offset) {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT o.*, r.name AS rest_name, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "rp_user.full_name AS rd_name, rp_user.phone AS rd_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS addr_text, " +
                "a.latitude AS addr_lat, a.longitude AS addr_lng " +
                "FROM orders o " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "LEFT JOIN rider_profiles rd ON o.rider_id = rd.id " +
                "LEFT JOIN users rp_user ON rd.user_id = rp_user.id " +
                "WHERE o.customer_id = ? ORDER BY o.id DESC LIMIT ? OFFSET ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, customerId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Order o = mapOrder(rs);
                    hydrateOrderDetails(o, rs);
                    o.setItems(getOrderItems(o.getId()));
                    list.add(o);
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing customer orders: {}", customerId, e);
        }
        return list;
    }

    @Override
    public List<Order> listRestaurantOrders(long restaurantId, String status, int limit, int offset) {
        List<Order> list = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        sb.append("SELECT o.*, r.name AS rest_name, r.latitude AS rest_lat, r.longitude AS rest_lng, ")
                .append("u.full_name AS cust_name, u.phone AS cust_phone, ")
                .append("rp_user.full_name AS rd_name, rp_user.phone AS rd_phone, ")
                .append("CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS addr_text, ")
                .append("a.latitude AS addr_lat, a.longitude AS addr_lng ")
                .append("FROM orders o ")
                .append("JOIN restaurant_profiles r ON o.restaurant_id = r.id ")
                .append("JOIN users u ON o.customer_id = u.id ")
                .append("JOIN user_addresses a ON o.delivery_address_id = a.id ")
                .append("LEFT JOIN rider_profiles rd ON o.rider_id = rd.id ")
                .append("LEFT JOIN users rp_user ON rd.user_id = rp_user.id ")
                .append("WHERE o.restaurant_id = ? ");

        if (status != null && !status.isBlank()) {
            sb.append("AND o.status = ? ");
        }
        sb.append("ORDER BY o.id DESC LIMIT ? OFFSET ?");

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sb.toString())) {
            ps.setLong(1, restaurantId);
            int idx = 2;
            if (status != null && !status.isBlank()) {
                ps.setString(idx++, status);
            }
            ps.setInt(idx++, limit);
            ps.setInt(idx, offset);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Order o = mapOrder(rs);
                    hydrateOrderDetails(o, rs);
                    o.setItems(getOrderItems(o.getId()));
                    list.add(o);
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing restaurant orders: {}", restaurantId, e);
        }
        return list;
    }

    @Override
    public List<Order> listAllOrders(int limit, int offset) {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT o.*, r.name AS rest_name, r.latitude AS rest_lat, r.longitude AS rest_lng, " +
                "u.full_name AS cust_name, u.phone AS cust_phone, " +
                "rp_user.full_name AS rd_name, rp_user.phone AS rd_phone, " +
                "CONCAT(a.address_line, ', ', IFNULL(a.landmark, ''), ' ', a.city) AS addr_text, " +
                "a.latitude AS addr_lat, a.longitude AS addr_lng " +
                "FROM orders o " +
                "JOIN restaurant_profiles r ON o.restaurant_id = r.id " +
                "JOIN users u ON o.customer_id = u.id " +
                "JOIN user_addresses a ON o.delivery_address_id = a.id " +
                "LEFT JOIN rider_profiles rd ON o.rider_id = rd.id " +
                "LEFT JOIN users rp_user ON rd.user_id = rp_user.id " +
                "ORDER BY o.id DESC LIMIT ? OFFSET ?";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ps.setInt(2, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Order o = mapOrder(rs);
                    hydrateOrderDetails(o, rs);
                    list.add(o);
                }
            }
        } catch (SQLException e) {
            logger.error("Error listing all orders", e);
        }
        return list;
    }

    @Override
    public void setGoodwillCreditAwarded(Connection conn, long orderId, boolean awarded) throws SQLException {
        String sql = "UPDATE orders SET is_goodwill_credit_awarded = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, awarded);
            ps.setLong(2, orderId);
            ps.executeUpdate();
        }
    }

    private void hydrateOrderDetails(Order o, ResultSet rs) throws SQLException {
        o.setRestaurantName(rs.getString("rest_name"));
        o.setRestaurantLat(rs.getDouble("rest_lat"));
        o.setRestaurantLng(rs.getDouble("rest_lng"));
        o.setCustomerName(rs.getString("cust_name"));
        o.setCustomerPhone(rs.getString("cust_phone"));
        o.setRiderName(rs.getString("rd_name"));
        o.setRiderPhone(rs.getString("rd_phone"));
        o.setDeliveryAddressText(rs.getString("addr_text"));
        o.setDeliveryLat(rs.getDouble("addr_lat"));
        o.setDeliveryLng(rs.getDouble("addr_lng"));
    }

    private Order mapOrder(ResultSet rs) throws SQLException {
        Order o = new Order();
        o.setId(rs.getLong("id"));
        o.setOrderNumber(rs.getString("order_number"));
        o.setCustomerId(rs.getLong("customer_id"));
        o.setRestaurantId(rs.getLong("restaurant_id"));
        long riderId = rs.getLong("rider_id");
        if (!rs.wasNull()) o.setRiderId(riderId);
        o.setDeliveryAddressId(rs.getLong("delivery_address_id"));
        o.setStatus(rs.getString("status"));
        o.setSubtotal(rs.getBigDecimal("subtotal"));
        o.setRestaurantDiscount(rs.getBigDecimal("restaurant_discount"));
        long couponId = rs.getLong("coupon_id");
        if (!rs.wasNull()) o.setCouponId(couponId);
        o.setCouponDiscount(rs.getBigDecimal("coupon_discount"));
        o.setPackagingFee(rs.getBigDecimal("packaging_fee"));
        o.setDeliveryFee(rs.getBigDecimal("delivery_fee"));
        o.setPlatformFee(rs.getBigDecimal("platform_fee"));
        o.setGstTax(rs.getBigDecimal("gst_tax"));
        o.setTotalAmount(rs.getBigDecimal("total_amount"));
        o.setPaymentMode(rs.getString("payment_mode"));
        o.setPaymentStatus(rs.getString("payment_status"));
        o.setIdempotencyKey(rs.getString("idempotency_key"));
        o.setEtaMinMinutes(rs.getInt("eta_min_minutes"));
        o.setEtaMaxMinutes(rs.getInt("eta_max_minutes"));
        o.setEstimatedDeliveryAt(rs.getTimestamp("estimated_delivery_at"));
        o.setActualDeliveryAt(rs.getTimestamp("actual_delivery_at"));
        o.setGoodwillCreditAwarded(rs.getBoolean("is_goodwill_credit_awarded"));
        o.setSpecialInstructions(rs.getString("special_instructions"));
        o.setCancellationReason(rs.getString("cancellation_reason"));
        o.setCreatedAt(rs.getTimestamp("created_at"));
        o.setUpdatedAt(rs.getTimestamp("updated_at"));
        return o;
    }
}
