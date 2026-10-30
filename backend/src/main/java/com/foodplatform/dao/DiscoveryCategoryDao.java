package com.foodplatform.dao;

import java.util.List;
import java.util.Map;

public interface DiscoveryCategoryDao {
    List<Map<String, Object>> listCategories(boolean includeInactive);
    Long createCategory(String name, String imageUrl, int displayOrder);
    boolean updateCategory(long id, String name, String imageUrl, int displayOrder, boolean active);
    boolean setCategoryActive(long id, boolean active);
}
