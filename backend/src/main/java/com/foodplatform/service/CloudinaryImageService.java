package com.foodplatform.service;

import com.foodplatform.config.AppProperties;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

public final class CloudinaryImageService {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();

    public String upload(byte[] image, String contentType, String folder) {
        String cloudName = requiredConfig(
            AppProperties.getCloudinaryCloudName(),
            "CLOUDINARY_CLOUD_NAME"
        );
        String apiKey = requiredConfig(AppProperties.getCloudinaryApiKey(), "CLOUDINARY_API_KEY");
        String apiSecret = requiredConfig(
            AppProperties.getCloudinaryApiSecret(),
            "CLOUDINARY_API_SECRET"
        );
        if (!cloudName.matches("[A-Za-z0-9_-]+")) {
            throw new IllegalStateException("CLOUDINARY_CLOUD_NAME is invalid.");
        }
        String publicId = UUID.randomUUID().toString();
        String timestamp = Long.toString(System.currentTimeMillis() / 1000);

        Map<String, String> signedParameters = new TreeMap<>();
        signedParameters.put("folder", folder);
        signedParameters.put("public_id", publicId);
        signedParameters.put("timestamp", timestamp);
        String signature = sign(signedParameters, apiSecret);
        String boundary = "CravePulse-" + UUID.randomUUID();

        byte[] requestBody;
        try {
            requestBody = createMultipartBody(
                boundary,
                Map.of(
                    "api_key",
                    apiKey,
                    "folder",
                    folder,
                    "public_id",
                    publicId,
                    "timestamp",
                    timestamp,
                    "signature",
                    signature
                ),
                image,
                contentType
            );
        } catch (IOException e) {
            throw new IllegalStateException("Unable to prepare image upload", e);
        }

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload"))
            .timeout(Duration.ofSeconds(12))
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
            .build();
        try {
            HttpResponse<String> response = HTTP_CLIENT.send(
                request,
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                    "Image storage rejected the upload (HTTP " + response.statusCode() + ")"
                );
            }

            JsonObject responseJson = JsonParser.parseString(response.body()).getAsJsonObject();
            if (!responseJson.has("secure_url") || responseJson.get("secure_url").isJsonNull()) {
                throw new IllegalStateException("Image storage did not return a secure image URL");
            }
            String secureUrl = responseJson.get("secure_url").getAsString();
            if (!secureUrl.startsWith("https://")) {
                throw new IllegalStateException("Image storage returned an invalid image URL");
            }
            return secureUrl;
        } catch (IOException e) {
            throw new IllegalStateException("Image storage is unavailable", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Image upload was interrupted", e);
        } catch (RuntimeException e) {
            if (e instanceof IllegalStateException) {
                throw e;
            }
            throw new IllegalStateException("Image storage returned an invalid response", e);
        }
    }

    public static String detectContentType(byte[] image) {
        if (image == null || image.length < 12) {
            throw new IllegalArgumentException("Select a valid JPEG, PNG, or WebP image.");
        }
        if ((image[0] & 0xFF) == 0xFF && (image[1] & 0xFF) == 0xD8 && (image[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (
            (image[0] & 0xFF) == 0x89 &&
            image[1] == 'P' &&
            image[2] == 'N' &&
            image[3] == 'G' &&
            image[4] == 0x0D &&
            image[5] == 0x0A &&
            image[6] == 0x1A &&
            image[7] == 0x0A
        ) {
            return "image/png";
        }
        if (
            image[0] == 'R' &&
            image[1] == 'I' &&
            image[2] == 'F' &&
            image[3] == 'F' &&
            image[8] == 'W' &&
            image[9] == 'E' &&
            image[10] == 'B' &&
            image[11] == 'P'
        ) {
            return "image/webp";
        }
        throw new IllegalArgumentException("Select a valid JPEG, PNG, or WebP image.");
    }

    private static String requiredConfig(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is not configured on the backend.");
        }
        return value.trim();
    }

    private static String sign(Map<String, String> parameters, String apiSecret) {
        StringBuilder payload = new StringBuilder();
        parameters.forEach((key, value) -> {
            if (!payload.isEmpty()) {
                payload.append('&');
            }
            payload.append(key).append('=').append(value);
        });
        payload.append(apiSecret);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1").digest(
                payload.toString().getBytes(StandardCharsets.UTF_8)
            );
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 is unavailable for image upload signing", e);
        }
    }

    private static byte[] createMultipartBody(
        String boundary,
        Map<String, String> fields,
        byte[] image,
        String contentType
    ) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException("Unsupported image format");
        };
        for (Map.Entry<String, String> field : fields.entrySet()) {
            write(output, "--" + boundary + "\r\n");
            write(
                output,
                "Content-Disposition: form-data; name=\"" + field.getKey() + "\"\r\n\r\n"
            );
            write(output, field.getValue() + "\r\n");
        }
        write(output, "--" + boundary + "\r\n");
        write(
            output,
            "Content-Disposition: form-data; name=\"file\"; filename=\"image" + extension + "\"\r\n"
        );
        write(output, "Content-Type: " + contentType + "\r\n\r\n");
        output.write(image);
        write(output, "\r\n--" + boundary + "--\r\n");
        return output.toByteArray();
    }

    private static void write(ByteArrayOutputStream output, String value) throws IOException {
        output.write(value.getBytes(StandardCharsets.UTF_8));
    }
}
