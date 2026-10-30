package com.foodplatform.dao;

import com.foodplatform.model.MenuItem;
import com.foodplatform.model.MenuItemAddon;
import com.foodplatform.model.MenuItemVariant;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface MenuDao {

    List<Map<String, Object>> getCategoriesByRestaurantId(long restaurantId);

    List<MenuItem> getItemsByRestaurantId(long restaurantId);

    MenuItem getItemById(long itemId);

    List<MenuItemVariant> getVariantsByItemId(long itemId);

    List<MenuItemAddon> getAddonsByItemId(long itemId);

    void updateItemAvailability(long itemId, boolean isAvailable);

    void updatePrices(long itemId, BigDecimal platformPrice, BigDecimal dineInPrice);

    boolean categoryBelongsToRestaurant(long categoryId, long restaurantId);

    Long createItem(MenuItem item);

    void updateItem(MenuItem item);

    void deleteItem(long itemId);

    void bulkUpdateAvailability(long restaurantId, List<Long> itemIds, boolean isAvailable);

    void reorderItems(long restaurantId, List<Long> itemIds);

    Long createCategory(long restaurantId, String name, int displayOrder);

    void addVariant(MenuItemVariant variant);

    void addAddon(MenuItemAddon addon);
}
