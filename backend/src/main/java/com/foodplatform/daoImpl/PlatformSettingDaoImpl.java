package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.PlatformSettingDao;
import com.foodplatform.model.PlatformSetting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PlatformSettingDaoImpl implements PlatformSettingDao {

    private static final Logger logger = LoggerFactory.getLogger(PlatformSettingDaoImpl.class);

    @Override
    public String getSettingValue(String key, String defaultValue) {
        String sql = "SELECT config_value FROM platform_settings WHERE config_key = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("config_value");
                }
            }
        } catch (SQLException e) {
            logger.error("Error fetching platform setting: {}", key, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return defaultValue;
    }

    @Override
    public void updateSetting(String key, String value, String description) {
        String sql = "INSERT INTO platform_settings (config_key, config_value, description) VALUES (?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, value);
            ps.setString(3, description);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating platform setting: {}", key, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<PlatformSetting> listAllSettings() {
        List<PlatformSetting> list = new ArrayList<>();
        String sql = "SELECT * FROM platform_settings ORDER BY config_key ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                PlatformSetting s = new PlatformSetting();
                s.setConfigKey(rs.getString("config_key"));
                s.setConfigValue(rs.getString("config_value"));
                s.setDescription(rs.getString("description"));
                s.setUpdatedAt(rs.getTimestamp("updated_at"));
                list.add(s);
            }
        } catch (SQLException e) {
            logger.error("Error listing all platform settings", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }
}
