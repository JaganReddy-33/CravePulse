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
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public List<MenuItem> getItemsByRestaurantId(long restaurantId) {
        List<MenuItem> list = new ArrayList<>();
        String sql = "SELECT * FROM menu_items WHERE restaurant_id = ? AND is_deleted = FALSE ORDER BY display_order ASC, category_id ASC, id ASC";
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
            throw new IllegalStateException("Database operation failed", e);
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
            throw new IllegalStateException("Database operation failed", e);
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
            throw new IllegalStateException("Database operation failed", e);
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
            throw new IllegalStateException("Database operation failed", e);
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
            throw new IllegalStateException("Database operation failed", e);
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
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public boolean categoryBelongsToRestaurant(long categoryId, long restaurantId) {
        String sql = "SELECT 1 FROM menu_categories WHERE id = ? AND restaurant_id = ? AND is_active = TRUE";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, categoryId);
            ps.setLong(2, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            logger.error("Error validating menu category {} for restaurant {}", categoryId, restaurantId, e);
            throw new IllegalStateException("Database operation failed", e);
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
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void updateItem(MenuItem item) {
        String sql = "UPDATE menu_items SET name = ?, description = ?, category_id = ?, dine_in_price = ?, platform_price = ?, " +
                "image_url = ?, is_veg = ?, prep_time_minutes = ?, calorie_count = ?, food_type = ?, spice_level = ?, " +
                "packaging_charge = ?, is_bestseller = ?, is_chef_special = ?, allergen_info = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, item.getName());
            ps.setString(2, item.getDescription());
            ps.setLong(3, item.getCategoryId());
            ps.setBigDecimal(4, item.getDineInPrice());
            ps.setBigDecimal(5, item.getPlatformPrice());
            ps.setString(6, item.getImageUrl());
            ps.setBoolean(7, item.isVeg());
            ps.setInt(8, item.getPrepTimeMinutes());
            ps.setInt(9, item.getCalorieCount());
            ps.setString(10, item.getFoodType() != null ? item.getFoodType() : (item.isVeg() ? "VEG" : "NON_VEG"));
            ps.setString(11, item.getSpiceLevel() != null ? item.getSpiceLevel() : "MEDIUM");
            ps.setBigDecimal(12, item.getPackagingCharge() != null ? item.getPackagingCharge() : BigDecimal.ZERO);
            ps.setBoolean(13, item.isBestseller());
            ps.setBoolean(14, item.isChefSpecial());
            ps.setString(15, item.getAllergenInfo());
            ps.setLong(16, item.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating menu item: {}", item.getId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void deleteItem(long itemId) {
        String sql = "UPDATE menu_items SET is_deleted = TRUE, is_available = FALSE WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, itemId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error soft deleting menu item: {}", itemId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void bulkUpdateAvailability(long restaurantId, List<Long> itemIds, boolean isAvailable) {
        if (itemIds == null || itemIds.isEmpty()) return;
        StringBuilder sql = new StringBuilder("UPDATE menu_items SET is_available = ? WHERE restaurant_id = ? AND id IN (");
        for (int i = 0; i < itemIds.size(); i++) {
            if (i > 0) sql.append(",");
            sql.append("?");
        }
        sql.append(")");

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            ps.setBoolean(1, isAvailable);
            ps.setLong(2, restaurantId);
            for (int i = 0; i < itemIds.size(); i++) {
                ps.setLong(3 + i, itemIds.get(i));
            }
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error in bulkUpdateAvailability for restaurant: {}", restaurantId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void reorderItems(long restaurantId, List<Long> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) return;
        String sql = "UPDATE menu_items SET display_order = ? WHERE id = ? AND restaurant_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < itemIds.size(); i++) {
                ps.setInt(1, i + 1);
                ps.setLong(2, itemIds.get(i));
                ps.setLong(3, restaurantId);
                ps.addBatch();
            }
            ps.executeBatch();
        } catch (SQLException e) {
            logger.error("Error reordering items for restaurant: {}", restaurantId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public Long createCategory(long restaurantId, String name, int displayOrder) {
        String sql = "INSERT INTO menu_categories (restaurant_id, name, display_order, is_active) VALUES (?, ?, ?, TRUE)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, restaurantId);
            ps.setString(2, name);
            ps.setInt(3, displayOrder);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        } catch (SQLException e) {
            logger.error("Error creating category for restaurant: {}", restaurantId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public void addVariant(MenuItemVariant variant) {
        String sql = "INSERT INTO menu_item_variants (menu_item_id, variant_name, price_adjustment, is_default, is_available) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, variant.getMenuItemId());
            ps.setString(2, variant.getVariantName());
            ps.setBigDecimal(3, variant.getPriceAdjustment() != null ? variant.getPriceAdjustment() : BigDecimal.ZERO);
            ps.setBoolean(4, variant.isDefault());
            ps.setBoolean(5, variant.isAvailable());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) variant.setId(rs.getLong(1));
            }
        } catch (SQLException e) {
            logger.error("Error adding variant: {}", variant.getVariantName(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void addAddon(MenuItemAddon addon) {
        String sql = "INSERT INTO menu_item_addons (menu_item_id, addon_name, price, is_available) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, addon.getMenuItemId());
            ps.setString(2, addon.getAddonName());
            ps.setBigDecimal(3, addon.getPrice() != null ? addon.getPrice() : BigDecimal.ZERO);
            ps.setBoolean(4, addon.isAvailable());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) addon.setId(rs.getLong(1));
            }
        } catch (SQLException e) {
            logger.error("Error adding addon: {}", addon.getAddonName(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
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
            item.setDeleted(rs.getBoolean("is_deleted"));
            item.setDisplayOrder(rs.getInt("display_order"));
            Time af = rs.getTime("available_from");
            if (af != null) item.setAvailableFrom(af.toString());
            Time at = rs.getTime("available_to");
            if (at != null) item.setAvailableTo(at.toString());
        } catch (SQLException ignored) {}
        return item;
    }
}
