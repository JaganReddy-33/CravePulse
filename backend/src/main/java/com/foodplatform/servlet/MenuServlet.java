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
            if (!requireRole(req, res, "RESTAURANT_OWNER", "ADMIN")) return;
            Long itemId = parseIdFromPath(req);
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            boolean isAvailable = body != null && body.has("isAvailable") && body.get("isAvailable").getAsBoolean();

            menuDao.updateItemAvailability(itemId, isAvailable);
            JsonUtil.sendSuccess(res, 200, "Item availability updated", Map.of("itemId", itemId, "isAvailable", isAvailable));
            return;
        }

        if (path.endsWith("/price-parity")) {
            if (!requireRole(req, res, "RESTAURANT_OWNER", "ADMIN")) return;
            Long itemId = parseIdFromPath(req);
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
            if (!requireRole(req, res, "RESTAURANT_OWNER", "ADMIN")) return;
            MenuItem item = JsonUtil.readRequestBody(req, MenuItem.class);
            if (item == null || item.getName() == null || item.getPlatformPrice() == null) {
                JsonUtil.sendError(res, 400, "Item name and platformPrice are required");
                return;
            }
            if (item.getDineInPrice() == null) {
                item.setDineInPrice(item.getPlatformPrice());
            }
            Long id = menuDao.createItem(item);
            item.setId(id);
            JsonUtil.sendSuccess(res, 201, "Menu item created", item);
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
