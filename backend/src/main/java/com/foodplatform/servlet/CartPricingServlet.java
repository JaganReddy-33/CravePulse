package com.foodplatform.servlet;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.WalletDao;
import com.foodplatform.model.Coupon;
import com.foodplatform.service.PricingService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/cart/*")
public class CartPricingServlet extends BaseServlet {

    private final PricingService pricingService = new PricingService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/calculate".equals(path)) {
            try {
                JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                if (body == null || !body.has("restaurantId") || !body.has("items")) {
                    JsonUtil.sendError(res, 400, "restaurantId and items array are required");
                    return;
                }

                long restaurantId = body.get("restaurantId").getAsLong();
                Double userLat = body.has("userLat") && !body.get("userLat").isJsonNull() ? body.get("userLat").getAsDouble() : null;
                Double userLng = body.has("userLng") && !body.get("userLng").isJsonNull() ? body.get("userLng").getAsDouble() : null;
                String couponCode = body.has("couponCode") && !body.get("couponCode").isJsonNull() ? body.get("couponCode").getAsString() : null;

                List<PricingService.CartInputItem> items = new ArrayList<>();
                JsonArray arr = body.getAsJsonArray("items");
                for (JsonElement el : arr) {
                    JsonObject itemObj = el.getAsJsonObject();
                    PricingService.CartInputItem it = new PricingService.CartInputItem();
                    it.menuItemId = itemObj.get("menuItemId").getAsLong();
                    it.quantity = itemObj.has("quantity") ? itemObj.get("quantity").getAsInt() : 1;
                    if (itemObj.has("variantId") && !itemObj.get("variantId").isJsonNull()) {
                        it.variantId = itemObj.get("variantId").getAsLong();
                    }
                    if (itemObj.has("addonIds") && itemObj.get("addonIds").isJsonArray()) {
                        for (JsonElement aEl : itemObj.getAsJsonArray("addonIds")) {
                            it.addonIds.add(aEl.getAsLong());
                        }
                    }
                    items.add(it);
                }

                if (items.isEmpty()) {
                    JsonUtil.sendError(res, 400, "Cart cannot be empty");
                    return;
                }

                PricingService.PriceCalculationResult calc = pricingService.calculateBill(restaurantId, items, userLat, userLng, couponCode);
                BigDecimal tipAmount = BigDecimal.ZERO;
                if (body.has("tipAmount") && !body.get("tipAmount").isJsonNull()) {
                    try {
                        tipAmount = body.get("tipAmount").getAsBigDecimal();
                    } catch (Exception ignored) {}
                }
                if (tipAmount.compareTo(BigDecimal.ZERO) > 0) {
                    calc.tipAmount = tipAmount;
                    calc.totalAmount = calc.totalAmount.add(tipAmount);
                }
                JsonUtil.sendSuccess(res, 200, "Bill calculated", calc);
            } catch (Exception e) {
                JsonUtil.sendError(res, 400, e.getMessage());
            }
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        if ("/coupons".equals(path)) {
            List<Coupon> coupons = new ArrayList<>();
            String sql = "SELECT * FROM coupons WHERE is_active = TRUE AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Coupon c = new Coupon();
                    c.setId(rs.getLong("id"));
                    c.setCode(rs.getString("code"));
                    c.setDescription(rs.getString("description"));
                    c.setDiscountType(rs.getString("discount_type"));
                    c.setDiscountValue(rs.getBigDecimal("discount_value"));
                    c.setMinOrderAmount(rs.getBigDecimal("min_order_amount"));
                    c.setMaxDiscountAmount(rs.getBigDecimal("max_discount_amount"));
                    coupons.add(c);
                }
            } catch (SQLException e) {
                JsonUtil.sendError(res, 500, "Database error");
                return;
            }
            JsonUtil.sendSuccess(res, 200, "Available coupons", coupons);
            return;
        }

        JsonUtil.sendError(res, 404, "Endpoint not found: " + path);
    }
}
