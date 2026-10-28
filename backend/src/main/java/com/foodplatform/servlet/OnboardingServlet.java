package com.foodplatform.servlet;

import com.foodplatform.service.AuthService;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

@WebServlet({"/api/partner/apply", "/api/rider/apply"})
public class OnboardingServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final AuthService authService = new AuthService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String uri = req.getRequestURI();

        try {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null) {
                JsonUtil.sendError(res, 400, "Request body is required");
                return;
            }

            if (uri.contains("/partner/apply")) {
                if (!body.has("fullName") || !body.has("email") || !body.has("password") ||
                        !body.has("restaurantName") || !body.has("fssaiLicense")) {
                    JsonUtil.sendError(res, 400, "Missing required partner fields (fullName, email, password, restaurantName, fssaiLicense)");
                    return;
                }

                String fullName = body.get("fullName").getAsString();
                String email = body.get("email").getAsString();
                String phone = body.has("phone") && !body.get("phone").isJsonNull() ? body.get("phone").getAsString() : "";
                String password = body.get("password").getAsString();
                String restaurantName = body.get("restaurantName").getAsString();
                String address = body.has("address") && !body.get("address").isJsonNull() ? body.get("address").getAsString() : "Bengaluru";
                Double lat = body.has("latitude") && !body.get("latitude").isJsonNull() ? body.get("latitude").getAsDouble() : 12.9715987;
                Double lng = body.has("longitude") && !body.get("longitude").isJsonNull() ? body.get("longitude").getAsDouble() : 77.5945627;
                String cuisineTypes = body.has("cuisineTypes") && !body.get("cuisineTypes").isJsonNull() ? body.get("cuisineTypes").getAsString() : "Multi-Cuisine";
                String fssaiLicense = body.get("fssaiLicense").getAsString();

                Map<String, Object> resp = authService.applyPartner(
                        fullName, email, phone, password, restaurantName, address, lat, lng, cuisineTypes, fssaiLicense
                );
                JsonUtil.sendSuccess(res, 201, "Partner application submitted successfully. Pending admin approval.", resp);
                return;
            }

            if (uri.contains("/rider/apply")) {
                if (!body.has("fullName") || !body.has("email") || !body.has("password") ||
                        !body.has("vehicleNumber") || !body.has("drivingLicense")) {
                    JsonUtil.sendError(res, 400, "Missing required rider fields (fullName, email, password, vehicleNumber, drivingLicense)");
                    return;
                }

                String fullName = body.get("fullName").getAsString();
                String email = body.get("email").getAsString();
                String phone = body.has("phone") && !body.get("phone").isJsonNull() ? body.get("phone").getAsString() : "";
                String password = body.get("password").getAsString();
                String vehicleType = body.has("vehicleType") && !body.get("vehicleType").isJsonNull() ? body.get("vehicleType").getAsString() : "Electric Scooter";
                String vehicleNumber = body.get("vehicleNumber").getAsString();
                String drivingLicense = body.get("drivingLicense").getAsString();

                Map<String, Object> resp = authService.applyRider(
                        fullName, email, phone, password, vehicleType, vehicleNumber, drivingLicense
                );
                JsonUtil.sendSuccess(res, 201, "Rider application submitted successfully. Pending admin approval.", resp);
                return;
            }

            JsonUtil.sendError(res, 404, "Endpoint not found: " + uri);
        } catch (IllegalArgumentException | IllegalStateException e) {
            JsonUtil.sendError(res, 400, e.getMessage());
        } catch (Exception e) {
            JsonUtil.sendError(res, 500, "Error submitting onboarding application: " + e.getMessage());
        }
    }
}
