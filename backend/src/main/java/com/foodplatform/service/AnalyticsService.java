package com.foodplatform.service;

import com.foodplatform.config.DatabaseConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

public class AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);

    public Map<String, Object> getRestaurantAnalytics(long restaurantId) {
        Map<String, Object> data = new HashMap<>();

        // 1. All-time summary
        String summarySql = "SELECT " +
                "COUNT(id) AS total_orders, " +
                "IFNULL(SUM(total_amount), 0) AS total_revenue, " +
                "IFNULL(AVG(total_amount), 0) AS avg_order_value " +
                "FROM orders WHERE restaurant_id = ? AND status != 'CANCELLED'";

        // 2. Today's summary
        String todaySql = "SELECT " +
                "COUNT(id) AS todays_orders, " +
                "IFNULL(SUM(total_amount), 0) AS todays_revenue " +
                "FROM orders WHERE restaurant_id = ? AND status != 'CANCELLED' AND created_at >= CURDATE()";

        // 3. 7-Day & 30-Day summaries
        String sevenDaySql = "SELECT COUNT(id) AS cnt, IFNULL(SUM(total_amount), 0) AS rev FROM orders WHERE restaurant_id = ? AND status != 'CANCELLED' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        String thirtyDaySql = "SELECT COUNT(id) AS cnt, IFNULL(SUM(total_amount), 0) AS rev FROM orders WHERE restaurant_id = ? AND status != 'CANCELLED' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";

        // 4. Cancellation rate
        String cancelSql = "SELECT COUNT(id) AS cancelled_count FROM orders WHERE restaurant_id = ? AND status = 'CANCELLED'";

        try (Connection conn = DatabaseConfig.getConnection()) {
            // Run 1: Summary
            try (PreparedStatement ps = conn.prepareStatement(summarySql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int totalOrders = rs.getInt("total_orders");
                        double totalRev = rs.getDouble("total_revenue");
                        double aov = rs.getDouble("avg_order_value");
                        data.put("totalOrders", totalOrders);
                        data.put("totalRevenue", totalRev);
                        data.put("averageOrderValue", Math.round(aov));
                        data.put("isEmpty", totalOrders == 0);
                    }
                }
            }

            // Run 2: Today
            try (PreparedStatement ps = conn.prepareStatement(todaySql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        data.put("todaysOrders", rs.getInt("todays_orders"));
                        data.put("todaysRevenue", rs.getDouble("todays_revenue"));
                    }
                }
            }

            // Run 3: 7 Days & 30 Days
            try (PreparedStatement ps = conn.prepareStatement(sevenDaySql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        data.put("sevenDayOrders", rs.getInt("cnt"));
                        data.put("sevenDayRevenue", rs.getDouble("rev"));
                    }
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(thirtyDaySql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        data.put("thirtyDayOrders", rs.getInt("cnt"));
                        data.put("thirtyDayRevenue", rs.getDouble("rev"));
                    }
                }
            }

            // Run 4: Cancellation count and rate
            try (PreparedStatement ps = conn.prepareStatement(cancelSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int cancelled = rs.getInt("cancelled_count");
                        data.put("cancelledOrders", cancelled);
                        int valid = (int) data.getOrDefault("totalOrders", 0);
                        double totalAll = valid + cancelled;
                        double rate = totalAll > 0 ? (cancelled * 100.0 / totalAll) : 0.0;
                        data.put("cancellationRate", Math.round(rate * 10.0) / 10.0);
                    }
                }
            }

            // 5. Daily Trend (last 7 days from SQL)
            List<Map<String, Object>> trend = new ArrayList<>();
            String trendSql = "SELECT DATE_FORMAT(created_at, '%d %b') AS day_label, COUNT(id) AS ord_cnt, IFNULL(SUM(total_amount), 0) AS rev " +
                    "FROM orders WHERE restaurant_id = ? AND status != 'CANCELLED' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                    "GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d %b') ORDER BY DATE(created_at) ASC";
            try (PreparedStatement ps = conn.prepareStatement(trendSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        trend.add(Map.of(
                                "time", rs.getString("day_label"),
                                "orders", rs.getInt("ord_cnt"),
                                "revenue", rs.getDouble("rev")
                        ));
                    }
                }
            }
            data.put("trend", trend);

            // 6. Top Selling Dishes (from real order_items joined with menu_items)
            List<Map<String, Object>> topDishes = new ArrayList<>();
            String topDishesSql = "SELECT oi.item_name, SUM(oi.quantity) AS total_orders, IFNULL(SUM(oi.total_price), 0) AS total_rev, " +
                    "IFNULL(MAX(mi.image_url), 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100') AS img " +
                    "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                    "LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id " +
                    "WHERE o.restaurant_id = ? AND o.status != 'CANCELLED' " +
                    "GROUP BY oi.item_name ORDER BY total_orders DESC LIMIT 5";
            try (PreparedStatement ps = conn.prepareStatement(topDishesSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        topDishes.add(Map.of(
                                "name", rs.getString("item_name"),
                                "orders", rs.getInt("total_orders"),
                                "revenue", rs.getDouble("total_rev"),
                                "image", rs.getString("img")
                        ));
                    }
                }
            }
            data.put("topDishes", topDishes);

            // 7. Orders by Category
            List<Map<String, Object>> categories = new ArrayList<>();
            String catSql = "SELECT mc.name AS cat_name, COUNT(oi.id) AS cnt, IFNULL(SUM(oi.total_price), 0) AS rev " +
                    "FROM order_items oi JOIN orders o ON oi.order_id = o.id " +
                    "JOIN menu_items mi ON oi.menu_item_id = mi.id " +
                    "JOIN menu_categories mc ON mi.category_id = mc.id " +
                    "WHERE o.restaurant_id = ? AND o.status != 'CANCELLED' " +
                    "GROUP BY mc.id, mc.name ORDER BY cnt DESC LIMIT 5";
            try (PreparedStatement ps = conn.prepareStatement(catSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        categories.add(Map.of(
                                "category", rs.getString("cat_name"),
                                "orders", rs.getInt("cnt"),
                                "revenue", rs.getDouble("rev")
                        ));
                    }
                }
            }
            data.put("categories", categories);

            // 8. Peak Hourly Ordering Window
            String peakSql = "SELECT HOUR(created_at) AS hr, COUNT(id) AS cnt, IFNULL(SUM(total_amount), 0) AS rev " +
                    "FROM orders WHERE restaurant_id = ? AND status != 'CANCELLED' " +
                    "GROUP BY HOUR(created_at) ORDER BY cnt DESC LIMIT 1";
            try (PreparedStatement ps = conn.prepareStatement(peakSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int hr = rs.getInt("hr");
                        String peakTime = (hr % 12 == 0 ? 12 : hr % 12) + " " + (hr >= 12 ? "PM" : "AM");
                        data.put("peakRevenue", "₹" + Math.round(rs.getDouble("rev")) + " | " + peakTime);
                        data.put("peakOrders", rs.getInt("cnt") + " | " + peakTime);
                    } else {
                        data.put("peakRevenue", "₹0 | --");
                        data.put("peakOrders", "0 | --");
                    }
                }
            }

            // 9. Status Gauge Breakdown
            Map<String, Integer> statusCounts = new HashMap<>();
            String gaugeSql = "SELECT status, COUNT(id) AS cnt FROM orders WHERE restaurant_id = ? GROUP BY status";
            int allCount = 0;
            try (PreparedStatement ps = conn.prepareStatement(gaugeSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String st = rs.getString("status");
                        int count = rs.getInt("cnt");
                        statusCounts.put(st, count);
                        allCount += count;
                    }
                }
            }
            int comp = statusCounts.getOrDefault("DELIVERED", 0);
            int prep = statusCounts.getOrDefault("PREPARING", 0) + statusCounts.getOrDefault("ACCEPTED", 0);
            int pend = statusCounts.getOrDefault("PLACED", 0);
            int canc = statusCounts.getOrDefault("CANCELLED", 0) + statusCounts.getOrDefault("REJECTED", 0);

            data.put("statusGauge", Map.of(
                    "completedPct", allCount > 0 ? (comp * 100 / allCount) : 0,
                    "completedCount", comp,
                    "preparingPct", allCount > 0 ? (prep * 100 / allCount) : 0,
                    "preparingCount", prep,
                    "pendingPct", allCount > 0 ? (pend * 100 / allCount) : 0,
                    "pendingCount", pend,
                    "cancelledPct", allCount > 0 ? (canc * 100 / allCount) : 0,
                    "cancelledCount", canc
            ));

            // 10. Multi-dimensional Reviews Summary
            String revSql = "SELECT COUNT(id) AS cnt, IFNULL(AVG(food_rating), 0) AS avg_food, " +
                    "IFNULL(AVG(packaging_rating), 0) AS avg_pkg, IFNULL(AVG(delivery_rating), 0) AS avg_del " +
                    "FROM reviews WHERE restaurant_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(revSql)) {
                ps.setLong(1, restaurantId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        data.put("reviewCount", rs.getInt("cnt"));
                        data.put("avgFoodRating", Math.round(rs.getDouble("avg_food") * 10.0) / 10.0);
                        data.put("avgPackagingRating", Math.round(rs.getDouble("avg_pkg") * 10.0) / 10.0);
                        data.put("avgDeliveryRating", Math.round(rs.getDouble("avg_del") * 10.0) / 10.0);
                    }
                }
            }

        } catch (SQLException e) {
            logger.error("Error fetching restaurant analytics", e);
        }

        return data;
    }

    public Map<String, Object> getAdminPlatformMetrics() {
        Map<String, Object> map = new HashMap<>();
        String sql = "SELECT " +
                "(SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') AS total_customers, " +
                "(SELECT COUNT(*) FROM restaurant_profiles) AS total_restaurants, " +
                "(SELECT COUNT(*) FROM rider_profiles) AS total_riders, " +
                "(SELECT COUNT(*) FROM rider_profiles WHERE is_online = TRUE) AS active_riders, " +
                "(SELECT COUNT(*) FROM orders) AS total_orders, " +
                "(SELECT COUNT(*) FROM orders WHERE status = 'DELIVERED') AS delivered_orders, " +
                "(SELECT COUNT(*) FROM orders WHERE status = 'CANCELLED') AS cancelled_orders, " +
                "(SELECT COUNT(*) FROM orders WHERE status IN ('ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP')) AS active_deliveries, " +
                "(SELECT IFNULL(SUM(total_amount), 0) FROM orders WHERE status = 'DELIVERED') AS gmv, " +
                "(SELECT IFNULL(AVG(total_amount), 0) FROM orders WHERE status = 'DELIVERED') AS aov, " +
                "(SELECT IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, actual_delivery_at)), 0) FROM orders WHERE status = 'DELIVERED' AND actual_delivery_at IS NOT NULL) AS avg_delivery_time, " +
                "(SELECT IFNULL(SUM(platform_fee), 0) FROM orders WHERE status = 'DELIVERED') AS platform_fees, " +
                "(SELECT (SELECT IFNULL(SUM(amount), 0) FROM wallet_transactions WHERE transaction_type = 'CREDIT' AND reason LIKE '%Refund%') + " +
                "        (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE status = 'REFUNDED')) AS total_refunds, " +
                "(SELECT COUNT(*) FROM disputes WHERE admin_status = 'PENDING') AS pending_disputes, " +
                "(SELECT COUNT(*) FROM restaurant_profiles WHERE is_kyc_approved = FALSE) AS pending_rest_kyc, " +
                "(SELECT COUNT(*) FROM rider_profiles WHERE is_kyc_approved = FALSE) AS pending_rider_kyc";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                int totalOrders = rs.getInt("total_orders");
                int delivered = rs.getInt("delivered_orders");
                int cancelled = rs.getInt("cancelled_orders");
                double gmv = rs.getDouble("gmv");
                double aov = rs.getDouble("aov");
                double avgDeliveryTime = rs.getDouble("avg_delivery_time");
                double totalRefunds = rs.getDouble("total_refunds");

                map.put("totalCustomers", rs.getInt("total_customers"));
                map.put("totalRestaurants", rs.getInt("total_restaurants"));
                map.put("totalRiders", rs.getInt("total_riders"));
                map.put("activeRiders", rs.getInt("active_riders"));
                map.put("totalOrders", totalOrders);
                map.put("deliveredOrders", delivered);
                map.put("cancelledOrders", cancelled);
                map.put("activeDeliveriesCount", rs.getInt("active_deliveries"));
                map.put("grossMerchandiseValue", Math.round(gmv * 100.0) / 100.0);
                map.put("averageOrderValue", Math.round(aov * 10.0) / 10.0);
                map.put("avgDeliveryTimeMinutes", Math.round(avgDeliveryTime * 10.0) / 10.0);
                map.put("platformRevenue", Math.round(rs.getDouble("platform_fees") * 100.0) / 100.0);
                map.put("totalRefunds", Math.round(totalRefunds * 100.0) / 100.0);
                map.put("pendingDisputes", rs.getInt("pending_disputes"));
                map.put("pendingRestaurantKyc", rs.getInt("pending_rest_kyc"));
                map.put("pendingRiderKyc", rs.getInt("pending_rider_kyc"));

                double cancelRate = totalOrders > 0 ? (cancelled * 100.0 / totalOrders) : 0.0;
                map.put("cancellationRate", Math.round(cancelRate * 10.0) / 10.0);
            }
        } catch (SQLException e) {
            logger.error("Error fetching admin platform metrics", e);
        }

        // 7-day daily volume trend for admin chart
        List<Map<String, Object>> trend = new ArrayList<>();
        String trendSql = "SELECT DATE_FORMAT(created_at, '%d %b') AS day_label, COUNT(id) AS ord_cnt, " +
                "IFNULL(SUM(CASE WHEN status = 'DELIVERED' THEN total_amount ELSE 0 END), 0) AS rev " +
                "FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                "GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d %b') ORDER BY DATE(created_at) ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(trendSql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                trend.add(Map.of(
                        "date", rs.getString("day_label"),
                        "orders", rs.getInt("ord_cnt"),
                        "revenue", rs.getDouble("rev")
                ));
            }
        } catch (SQLException e) {
            logger.error("Error fetching admin volume trend", e);
        }
        map.put("volumeTrend", trend);

        return map;
    }
}
