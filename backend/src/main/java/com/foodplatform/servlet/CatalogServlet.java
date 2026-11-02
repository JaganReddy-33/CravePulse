package com.foodplatform.servlet;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.util.GoogleMapsUrlParser;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CatalogServlet extends BaseServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException {
        if (!requireAdmin(request, response)) {
            return;
        }
        if (!"/locations".equals(request.getPathInfo())) {
            JsonUtil.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            return;
        }

        try {
            JsonObject body = JsonUtil.readRequestBody(request, JsonObject.class);
            if (
                body == null ||
                !body.has("city") ||
                !body.has("name") ||
                !body.has("mapsUrl") ||
                !body.has("radiusKm")
            ) {
                throw new IllegalArgumentException("Required service area fields are missing");
            }

            String city = body.get("city").getAsString().trim();
            String name = body.get("name").getAsString().trim();
            String mapsUrl = body.get("mapsUrl").getAsString().trim();
            double radiusKm = body.get("radiusKm").getAsDouble();
            if (
                city.isEmpty() ||
                city.length() > 100 ||
                name.isEmpty() ||
                name.length() > 100 ||
                !Double.isFinite(radiusKm) ||
                radiusKm <= 0 ||
                radiusKm > 100
            ) {
                throw new IllegalArgumentException(
                    "Provide a city, zone name, Maps link and radius up to 100 km"
                );
            }

            GoogleMapsUrlParser.Coordinates coordinates = GoogleMapsUrlParser.parseAndResolve(
                mapsUrl
            );
            String sql =
                "INSERT INTO delivery_zones(zone_name, city, center_lat, center_lng, radius_km) " +
                "VALUES (?, ?, ?, ?, ?)";
            try (
                Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)
            ) {
                statement.setString(1, name);
                statement.setString(2, city);
                statement.setBigDecimal(3, coordinates.latitude());
                statement.setBigDecimal(4, coordinates.longitude());
                statement.setDouble(5, radiusKm);
                statement.executeUpdate();
            }
            JsonUtil.sendSuccess(
                response,
                HttpServletResponse.SC_CREATED,
                "Delivery zone created",
                null
            );
        } catch (IllegalArgumentException | NullPointerException e) {
            String message = e.getMessage();
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_BAD_REQUEST,
                message == null ? "Valid delivery zone details are required" : message
            );
        } catch (SQLException e) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                "Unable to save delivery zone"
            );
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException {
        String path = request.getPathInfo() == null ? "" : request.getPathInfo();
        try (Connection connection = DatabaseConfig.getConnection()) {
            if (path.equals("/offers")) {
                List<Map<String, Object>> offers = new ArrayList<>();
                String sql =
                    "SELECT * FROM coupons WHERE is_active = TRUE AND times_used < usage_limit " +
                    "AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP) " +
                    "AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)";
                try (
                    Statement statement = connection.createStatement();
                    ResultSet results = statement.executeQuery(sql)
                ) {
                    while (results.next()) {
                        long restaurantId = results.getLong("restaurant_id");
                        boolean global = results.wasNull();
                        String requestedRestaurantId = request.getParameter("restaurantId");
                        if (
                            requestedRestaurantId != null &&
                            !global &&
                            !requestedRestaurantId.equals(String.valueOf(restaurantId))
                        ) {
                            continue;
                        }

                        Map<String, Object> offer = new HashMap<>();
                        offer.put("code", results.getString("code"));
                        offer.put("title", results.getString("description"));
                        offer.put("description", results.getString("description"));
                        offer.put("minOrder", results.getBigDecimal("min_order_amount"));
                        offer.put("restaurantId", global ? null : restaurantId);
                        offer.put(
                            "discount",
                            results.getBigDecimal("discount_value").toPlainString() +
                                ("PERCENTAGE".equals(results.getString("discount_type"))
                                    ? "% OFF"
                                    : " INR OFF")
                        );
                        offer.put("details", results.getString("description"));
                        offer.put("color", "var(--c-primary)");
                        offer.put(
                            "tag",
                            results.getBoolean("first_order_only") ? "FIRST ORDER" : "AVAILABLE"
                        );
                        offers.add(offer);
                    }
                }
                JsonUtil.sendSuccess(
                    response,
                    HttpServletResponse.SC_OK,
                    "Available offers",
                    offers
                );
            } else if (path.equals("/locations")) {
                Map<String, Map<String, Object>> cities = new LinkedHashMap<>();
                String sql =
                    "SELECT id, zone_name, city, center_lat, center_lng " +
                    "FROM delivery_zones WHERE is_active = TRUE ORDER BY city, zone_name";
                try (
                    Statement statement = connection.createStatement();
                    ResultSet results = statement.executeQuery(sql)
                ) {
                    while (results.next()) {
                        String city = results.getString("city");
                        Map<String, Object> entry = cities.computeIfAbsent(city, key -> {
                            Map<String, Object> value = new HashMap<>();
                            value.put("id", key);
                            value.put("name", key);
                            value.put("hubs", new ArrayList<Map<String, Object>>());
                            return value;
                        });
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> hubs = (List<Map<String, Object>>) entry.get(
                            "hubs"
                        );
                        hubs.add(
                            Map.of(
                                "id",
                                results.getLong("id"),
                                "name",
                                results.getString("zone_name"),
                                "area",
                                city,
                                "cityName",
                                city,
                                "coords",
                                List.of(
                                    results.getDouble("center_lat"),
                                    results.getDouble("center_lng")
                                )
                            )
                        );
                    }
                }
                JsonUtil.sendSuccess(
                    response,
                    HttpServletResponse.SC_OK,
                    "Configured delivery locations",
                    cities.values()
                );
            } else if (path.equals("/categories")) {
                List<Map<String, Object>> categories =
                    new com.foodplatform.daoImpl.DiscoveryCategoryDaoImpl().listCategories(false);
                JsonUtil.sendSuccess(
                    response,
                    HttpServletResponse.SC_OK,
                    "Restaurant discovery categories",
                    categories
                );
            } else {
                JsonUtil.sendError(
                    response,
                    HttpServletResponse.SC_NOT_FOUND,
                    "Endpoint not found"
                );
            }
        } catch (SQLException e) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                "Catalog unavailable. Please retry."
            );
        }
    }
}
