package com.foodplatform.dao;

import com.foodplatform.model.PlatformSetting;
import java.util.List;

public interface PlatformSettingDao {
    String getSettingValue(String key, String defaultValue);
    void updateSetting(String key, String value, String description);
    List<PlatformSetting> listAllSettings();
}
