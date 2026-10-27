package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.MenuDao;
import com.foodplatform.model.MenuItem;
import com.foodplatform.model.MenuItemAddon;
import com.foodplatform.model.MenuItemVariant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

public class MenuDaoImpl implements MenuDao {

    private static final Logger logger = LoggerFactory.getLogger(MenuDaoImpl.class);

    @Override
    public List<Map<String, Object>> getCategoriesByRestaurantId(long restaurantId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = TRUE ORDER BY display_order ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("restaurantId", rs.getLong("restaurant_id"));
                    map.put("name", rs.getString("name"));
                    map.put("displayOrder", rs.getInt("display_order"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching categories for restaurant: {}", restaurantId, e);
        }
        return list;
    }

    @Override
    public List<MenuItem> getItemsByRestaurantId(long restaurantId) {
        List<MenuItem> list = new ArrayList<>();
        String sql = "SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category_id ASC, id ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    MenuItem item = mapMenuItem(rs);
                    item.setVariants(getVariantsByItemId(item.getId()));
                    item.setAddons(getAddonsByItemId(item.getId()));
                    list.add(item);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching menu items for restaurant: {}", restaurantId, e);
        }
        return list;
    }

    @Override
    public MenuItem getItemById(long itemId) {
        String sql = "SELECT * FROM menu_items WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, itemId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    MenuItem item = mapMenuItem(rs);
                    item.setVariants(getVariantsByItemId(itemId));
                    item.setAddons(getAddonsByItemId(itemId));
                    return item;
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching item by id: {}", itemId, e);
        }
        return null;
    }

    @Override
    public List<MenuItemVariant> getVariantsByItemId(long itemId) {
        List<MenuItemVariant> list = new ArrayList<>();
        String sql = "SELECT * FROM menu_item_variants WHERE menu_item_id = ? AND is_available = TRUE";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, itemId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    MenuItemVariant v = new MenuItemVariant();
                    v.setId(rs.getLong("id"));
                    v.setMenuItemId(rs.getLong("menu_item_id"));
                    v.setVariantName(rs.getString("variant_name"));
                    v.setPriceAdjustment(rs.getBigDecimal("price_adjustment"));
                    v.setDefault(rs.getBoolean("is_default"));
                    v.setAvailable(rs.getBoolean("is_available"));
                    list.add(v);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching variants for item: {}", itemId, e);
        }
        return list;
    }

    @Override
    public List<MenuItemAddon> getAddonsByItemId(long itemId) {
        List<MenuItemAddon> list = new ArrayList<>();
        String sql = "SELECT * FROM menu_item_addons WHERE menu_item_id = ? AND is_available = TRUE";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, itemId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    MenuItemAddon a = new MenuItemAddon();
                    a.setId(rs.getLong("id"));
                    a.setMenuItemId(rs.getLong("menu_item_id"));
                    a.setAddonName(rs.getString("addon_name"));
                    a.setPrice(rs.getBigDecimal("price"));
                    a.setAvailable(rs.getBoolean("is_available"));
                    list.add(a);
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching addons for item: {}", itemId, e);
        }
        return list;
    }

    @Override
    public void updateItemAvailability(long itemId, boolean isAvailable) {
        String sql = "UPDATE menu_items SET is_available = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, isAvailable);
            ps.setLong(2, itemId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating item availability: {}", itemId, e);
        }
    }

    @Override
    public void updatePrices(long itemId, BigDecimal platformPrice, BigDecimal dineInPrice) {
        String sql = "UPDATE menu_items SET platform_price = ?, dine_in_price = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, platformPrice);
            ps.setBigDecimal(2, dineInPrice);
            ps.setLong(3, itemId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating item prices: {}", itemId, e);
        }
    }

    @Override
    public Long createItem(MenuItem item) {
        String sql = "INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, dine_in_price, platform_price, is_veg, is_available, prep_time_minutes, calorie_count) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, item.getRestaurantId());
            ps.setLong(2, item.getCategoryId());
            ps.setString(3, item.getName());
            ps.setString(4, item.getDescription());
            ps.setString(5, item.getImageUrl());
            ps.setBigDecimal(6, item.getDineInPrice());
            ps.setBigDecimal(7, item.getPlatformPrice());
            ps.setBoolean(8, item.isVeg());
            ps.setBoolean(9, item.isAvailable());
            ps.setInt(10, item.getPrepTimeMinutes());
            ps.setInt(11, item.getCalorieCount());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        } catch (SQLException e) {
            logger.error("Error creating menu item: {}", item.getName(), e);
        }
        return null;
    }

    private MenuItem mapMenuItem(ResultSet rs) throws SQLException {
        MenuItem item = new MenuItem();
        item.setId(rs.getLong("id"));
        item.setRestaurantId(rs.getLong("restaurant_id"));
        item.setCategoryId(rs.getLong("category_id"));
        item.setName(rs.getString("name"));
        item.setDescription(rs.getString("description"));
        item.setImageUrl(rs.getString("image_url"));
        item.setDineInPrice(rs.getBigDecimal("dine_in_price"));
        item.setPlatformPrice(rs.getBigDecimal("platform_price"));
        item.setVeg(rs.getBoolean("is_veg"));
        item.setAvailable(rs.getBoolean("is_available"));
        item.setPrepTimeMinutes(rs.getInt("prep_time_minutes"));
        item.setCalorieCount(rs.getInt("calorie_count"));
        item.setRating(rs.getBigDecimal("rating"));
        item.setTotalOrders(rs.getInt("total_orders"));
        item.setCreatedAt(rs.getTimestamp("created_at"));
        item.setUpdatedAt(rs.getTimestamp("updated_at"));
        try {
            item.setSlug(rs.getString("slug"));
            item.setFoodType(rs.getString("food_type"));
            item.setSpiceLevel(rs.getString("spice_level"));
            item.setPackagingCharge(rs.getBigDecimal("packaging_charge"));
            item.setBestseller(rs.getBoolean("is_bestseller"));
            item.setChefSpecial(rs.getBoolean("is_chef_special"));
            item.setAllergenInfo(rs.getString("allergen_info"));
        } catch (SQLException ignored) {}
        return item;
    }
}
