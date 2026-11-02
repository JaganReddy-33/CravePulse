package com.foodplatform.servlet;

import com.foodplatform.service.CloudinaryImageService;
import com.foodplatform.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.IOException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@WebServlet("/api/uploads/*")
@MultipartConfig(fileSizeThreshold = 0, maxFileSize = 5_242_880, maxRequestSize = 5_308_416)
public class ImageUploadServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;
    private static final long MAX_IMAGE_SIZE_BYTES = 5_242_880;
    private static final Logger logger = LoggerFactory.getLogger(ImageUploadServlet.class);

    private final CloudinaryImageService imageService = new CloudinaryImageService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {
        if (!requireAuthenticated(request, response)) {
            return;
        }
        if (!"/images".equals(request.getPathInfo())) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_NOT_FOUND,
                "Image upload endpoint not found"
            );
            return;
        }

        String purpose;
        final Part file;
        try {
            file = request.getPart("file");
            purpose = request.getParameter("purpose");
        } catch (IllegalStateException e) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE,
                "Images must be 5 MB or smaller"
            );
            return;
        } catch (ServletException e) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_BAD_REQUEST,
                "A valid image file is required"
            );
            return;
        }

        String folder = getFolderForPurpose(purpose);
        if (folder == null) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_BAD_REQUEST,
                "Unsupported image upload purpose"
            );
            return;
        }
        if (!requirePurposeRole(request, response, purpose)) {
            return;
        }

        if (file == null || file.getSize() == 0) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_BAD_REQUEST,
                "Select an image file to upload"
            );
            return;
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE,
                "Images must be 5 MB or smaller"
            );
            return;
        }

        byte[] image;
        try (var input = file.getInputStream()) {
            image = input.readAllBytes();
        }
        if (image.length == 0 || image.length > MAX_IMAGE_SIZE_BYTES) {
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE,
                "Images must be 5 MB or smaller"
            );
            return;
        }

        try {
            String contentType = CloudinaryImageService.detectContentType(image);
            String imageUrl = imageService.upload(image, contentType, folder);
            JsonUtil.sendSuccess(
                response,
                HttpServletResponse.SC_CREATED,
                "Image uploaded",
                Map.of("imageUrl", imageUrl)
            );
        } catch (IllegalArgumentException e) {
            JsonUtil.sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            logger.error("Image storage upload failed: {}", e.getMessage());
            JsonUtil.sendError(
                response,
                HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                e.getMessage()
            );
        }
    }

    private boolean requirePurposeRole(
        HttpServletRequest request,
        HttpServletResponse response,
        String purpose
    ) throws IOException {
        return switch (purpose) {
            case "avatar" -> requireRole(
                request,
                response,
                "CUSTOMER",
                "RIDER",
                "RESTAURANT_OWNER",
                "ADMIN"
            );
            case "restaurant-banner", "menu-item" -> requireRole(
                request,
                response,
                "RESTAURANT_OWNER",
                "ADMIN"
            );
            case "discovery-category" -> requireRole(request, response, "ADMIN");
            default -> false;
        };
    }

    private String getFolderForPurpose(String purpose) {
        if (purpose == null) {
            return null;
        }
        return switch (purpose) {
            case "avatar" -> "cravepulse/avatars";
            case "restaurant-banner" -> "cravepulse/restaurant-banners";
            case "menu-item" -> "cravepulse/menu-items";
            case "discovery-category" -> "cravepulse/discovery-categories";
            default -> null;
        };
    }
}
