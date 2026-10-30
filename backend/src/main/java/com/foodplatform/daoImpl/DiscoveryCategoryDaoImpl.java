package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.DiscoveryCategoryDao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DiscoveryCategoryDaoImpl implements DiscoveryCategoryDao {
    @Override
    public List<Map<String, Object>> listCategories(boolean includeInactive) {
        List<Map<String, Object>> categories = new ArrayList<>();
        String sql = "SELECT id, name, image_url, display_order, is_active FROM discovery_categories " +
                (includeInactive ? "" : "WHERE is_active = TRUE ") +
                "ORDER BY display_order, name";
        try (Connection conn = DatabaseConfig.getConnection();
             Statement statement = conn.createStatement();
             ResultSet rs = statement.executeQuery(sql)) {
            while (rs.next()) {
                Map<String, Object> category = new HashMap<>();
                category.put("id", rs.getLong("id"));
                category.put("name", rs.getString("name"));
                category.put("imageUrl", rs.getString("image_url"));
                category.put("displayOrder", rs.getInt("display_order"));
                category.put("active", rs.getBoolean("is_active"));
                categories.add(category);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Unable to load discovery categories", e);
        }
        return categories;
    }

    @Override
    public Long createCategory(String name, String imageUrl, int displayOrder) {
        String sql = "INSERT INTO discovery_categories (name, image_url, display_order) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement statement = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, name);
            statement.setString(2, imageUrl);
            statement.setInt(3, displayOrder);
            statement.executeUpdate();
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) return keys.getLong(1);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Unable to create discovery category", e);
        }
        throw new IllegalStateException("Discovery category could not be saved");
    }

    @Override
    public boolean updateCategory(long id, String name, String imageUrl, int displayOrder, boolean active) {
        String sql = "UPDATE discovery_categories SET name = ?, image_url = ?, display_order = ?, is_active = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement statement = conn.prepareStatement(sql)) {
            statement.setString(1, name);
            statement.setString(2, imageUrl);
            statement.setInt(3, displayOrder);
            statement.setBoolean(4, active);
            statement.setLong(5, id);
            return statement.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new IllegalStateException("Unable to update discovery category", e);
        }
    }

    @Override
    public boolean setCategoryActive(long id, boolean active) {
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement statement = conn.prepareStatement("UPDATE discovery_categories SET is_active = ? WHERE id = ?")) {
            statement.setBoolean(1, active);
            statement.setLong(2, id);
            return statement.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new IllegalStateException("Unable to update discovery category status", e);
        }
    }
}
