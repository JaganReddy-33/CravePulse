
package com.foodplatform.servlet;

import com.foodplatform.dao.MenuDao;
import com.foodplatform.daoImpl.MenuDaoImpl;
import com.foodplatform.model.MenuItem;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/menu/*")
public class MenuServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final MenuDao menuDao = new MenuDaoImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.startsWith("/restaurant/")) {
            Long restaurantId = parseIdFromPath(req);
            if (restaurantId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID is required");
                return;
            }

            List<Map<String, Object>> categories = menuDao.getCategoriesByRestaurantId(restaurantId);
            List<MenuItem> items = menuDao.getItemsByRestaurantId(restaurantId);

            Map<String, Object> resp = new HashMap<>();
            resp.put("categories", categories);
            resp.put("items", items);
            JsonUtil.sendSuccess(res, 200, "Menu retrieved", resp);
            return;
        }

        if (path.startsWith("/item/")) {
            Long itemId = parseIdFromPath(req);
            if (itemId == null) {
                JsonUtil.sendError(res, 400, "Item ID is required");
                return;
            }
            MenuItem item = menuDao.getItemById(itemId);
            if (item == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            JsonUtil.sendSuccess(res, 200, "Menu item details", item);
            return;
        }

        JsonUtil.sendError(res, 404, "Menu endpoint not found: " + path);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if (path.endsWith("/toggle-availability")) {
            Long itemId = parseIdFromPath(req);
            if (itemId == null) {
                JsonUtil.sendError(res, 400, "Item ID is required");
                return;
            }
            MenuItem item = menuDao.getItemById(itemId);
            if (item == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, item.getRestaurantId())) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean isAvailable = body != null && body.has("isAvailable") && body.get("isAvailable").getAsBoolean();

            menuDao.updateItemAvailability(itemId, isAvailable);
            JsonUtil.sendSuccess(res, 200, "Item availability updated", Map.of("itemId", itemId, "isAvailable", isAvailable));
            return;
        }

        if (path.endsWith("/price-parity")) {
            Long itemId = parseIdFromPath(req);
            if (itemId == null) {
                JsonUtil.sendError(res, 400, "Item ID is required");
                return;
            }
            MenuItem item = menuDao.getItemById(itemId);
            if (item == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, item.getRestaurantId())) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("platformPrice") || !body.has("dineInPrice")) {
                JsonUtil.sendError(res, 400, "platformPrice and dineInPrice are required");
                return;
            }

            BigDecimal platformPrice = body.get("platformPrice").getAsBigDecimal();
            BigDecimal dineInPrice = body.get("dineInPrice").getAsBigDecimal();

            menuDao.updatePrices(itemId, platformPrice, dineInPrice);
            JsonUtil.sendSuccess(res, 200, "Item price transparency updated", Map.of(
                    "itemId", itemId,
                    "platformPrice", platformPrice,
                    "dineInPrice", dineInPrice,
                    "hasParity", platformPrice.compareTo(dineInPrice) == 0
            ));
            return;
        }

        if ("/item".equals(path)) {
            MenuItem item = JsonUtil.readRequestBody(req, MenuItem.class);
            if (item == null || item.getName() == null || item.getPlatformPrice() == null ||
                    item.getRestaurantId() == null || item.getCategoryId() == null) {
                JsonUtil.sendError(res, 400, "restaurantId, categoryId, item name and platformPrice are required");
                return;
            }
            if (!requireRestaurantOwner(req, res, item.getRestaurantId())) return;
            if (!menuDao.categoryBelongsToRestaurant(item.getCategoryId(), item.getRestaurantId())) {
                JsonUtil.sendError(res, 400, "Select an active menu category belonging to this restaurant");
                return;
            }

            if (item.getDineInPrice() == null) {
                item.setDineInPrice(item.getPlatformPrice());
            }
            if (item.getImageUrl() == null || item.getImageUrl().isBlank()) {
                item.setImageUrl(null);
            }
            Long id = menuDao.createItem(item);
            if(id==null) throw new IllegalStateException("Menu item could not be saved");
            item.setId(id);
            JsonUtil.sendSuccess(res, 201, "Menu item created", item);
            return;
        }

        if (path.matches("^/item/\\d+/update$") || path.matches("^/item/\\d+$")) {
            Long itemId = parseIdFromPath(req);
            MenuItem existing = menuDao.getItemById(itemId);
            if (existing == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, existing.getRestaurantId())) return;

            MenuItem update = JsonUtil.readRequestBody(req, MenuItem.class);
            if (update != null) {
                update.setId(itemId);
                if (update.getRestaurantId() == null) update.setRestaurantId(existing.getRestaurantId());
                if (update.getCategoryId() == null) update.setCategoryId(existing.getCategoryId());
                if (update.getPlatformPrice() == null) update.setPlatformPrice(existing.getPlatformPrice());
                if (update.getDineInPrice() == null) update.setDineInPrice(existing.getDineInPrice());
                if (update.getImageUrl() == null) update.setImageUrl(existing.getImageUrl());
                menuDao.updateItem(update);
                JsonUtil.sendSuccess(res, 200, "Menu item updated", update);
                return;
            }
        }

        if (path.matches("^/item/\\d+/delete$")) {
            Long itemId = parseIdFromPath(req);
            MenuItem existing = menuDao.getItemById(itemId);
            if (existing == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, existing.getRestaurantId())) return;

            menuDao.deleteItem(itemId);
            JsonUtil.sendSuccess(res, 200, "Menu item soft deleted", Map.of("itemId", itemId, "deleted", true));
            return;
        }

        if (path.endsWith("/bulk-availability")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("isAvailable")) {
                JsonUtil.sendError(res, 400, "isAvailable field is required");
                return;
            }
            boolean isAvail = body.get("isAvailable").getAsBoolean();
            List<Long> itemIds = new java.util.ArrayList<>();
            if (body.has("itemIds") && body.get("itemIds").isJsonArray()) {
                body.getAsJsonArray("itemIds").forEach(el -> itemIds.add(el.getAsLong()));
            }

            menuDao.bulkUpdateAvailability(restId, itemIds, isAvail);
            JsonUtil.sendSuccess(res, 200, "Bulk availability updated", Map.of(
                    "restaurantId", restId,
                    "updatedCount", itemIds.size(),
                    "isAvailable", isAvail
            ));
            return;
        }

        if (path.endsWith("/reorder")) {
            Long restId = parseIdFromPath(req);
            if (restId == null) {
                JsonUtil.sendError(res, 400, "Restaurant ID required");
                return;
            }
            if (!requireRestaurantOwner(req, res, restId)) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            List<Long> itemIds = new java.util.ArrayList<>();
            if (body != null && body.has("itemIds") && body.get("itemIds").isJsonArray()) {
                body.getAsJsonArray("itemIds").forEach(el -> itemIds.add(el.getAsLong()));
            }

            menuDao.reorderItems(restId, itemIds);
            JsonUtil.sendSuccess(res, 200, "Items reordered successfully", Map.of("count", itemIds.size()));
            return;
        }

        if ("/categories".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("restaurantId") || !body.has("name")) {
                JsonUtil.sendError(res, 400, "restaurantId and category name are required");
                return;
            }
            long restId = body.get("restaurantId").getAsLong();
            if (!requireRestaurantOwner(req, res, restId)) return;

            String catName = body.get("name").getAsString().trim();
            int order = body.has("displayOrder") ? body.get("displayOrder").getAsInt() : 1;
            Long catId = menuDao.createCategory(restId, catName, order);
            JsonUtil.sendSuccess(res, 201, "Category created", Map.of("id", catId, "name", catName));
            return;
        }

        if (path.endsWith("/variants")) {
            Long itemId = parseIdFromPath(req);
            MenuItem item = menuDao.getItemById(itemId);
            if (item == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, item.getRestaurantId())) return;

            com.foodplatform.model.MenuItemVariant variant = JsonUtil.readRequestBody(req, com.foodplatform.model.MenuItemVariant.class);
            if (variant == null || variant.getVariantName() == null) {
                JsonUtil.sendError(res, 400, "variantName is required");
                return;
            }
            variant.setMenuItemId(itemId);
            menuDao.addVariant(variant);
            JsonUtil.sendSuccess(res, 201, "Variant added", variant);
            return;
        }

        if (path.endsWith("/addons")) {
            Long itemId = parseIdFromPath(req);
            MenuItem item = menuDao.getItemById(itemId);
            if (item == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, item.getRestaurantId())) return;

            com.foodplatform.model.MenuItemAddon addon = JsonUtil.readRequestBody(req, com.foodplatform.model.MenuItemAddon.class);
            if (addon == null || addon.getAddonName() == null) {
                JsonUtil.sendError(res, 400, "addonName is required");
                return;
            }
            addon.setMenuItemId(itemId);
            menuDao.addAddon(addon);
            JsonUtil.sendSuccess(res, 201, "Addon added", addon);
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";
        if (path.matches("^/item/\\d+$")) {
            Long itemId = parseIdFromPath(req);
            MenuItem existing = menuDao.getItemById(itemId);
            if (existing == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, existing.getRestaurantId())) return;

            MenuItem update = JsonUtil.readRequestBody(req, MenuItem.class);
            if (update != null) {
                update.setId(itemId);
                if (update.getRestaurantId() == null) update.setRestaurantId(existing.getRestaurantId());
                if (update.getCategoryId() == null) update.setCategoryId(existing.getCategoryId());
                if (update.getPlatformPrice() == null) update.setPlatformPrice(existing.getPlatformPrice());
                if (update.getDineInPrice() == null) update.setDineInPrice(existing.getDineInPrice());
                if (update.getImageUrl() == null) update.setImageUrl(existing.getImageUrl());
                menuDao.updateItem(update);
                JsonUtil.sendSuccess(res, 200, "Menu item updated", update);
                return;
            }
        }
        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";
        if (path.matches("^/item/\\d+$")) {
            Long itemId = parseIdFromPath(req);
            MenuItem existing = menuDao.getItemById(itemId);
            if (existing == null) {
                JsonUtil.sendError(res, 404, "Menu item not found");
                return;
            }
            if (!requireRestaurantOwner(req, res, existing.getRestaurantId())) return;

            menuDao.deleteItem(itemId);
            JsonUtil.sendSuccess(res, 200, "Menu item soft deleted", Map.of("itemId", itemId, "deleted", true));
            return;
        }
        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
