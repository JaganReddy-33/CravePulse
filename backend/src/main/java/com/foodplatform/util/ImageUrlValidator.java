package com.foodplatform.util;

import java.net.URI;

public final class ImageUrlValidator {

    private static final int MAX_URL_LENGTH = 500;

    private ImageUrlValidator() {}

    public static boolean isValidHttpsUrl(String value) {
        if (value == null || value.isBlank()) return false;
        try {
            String normalized = value.trim();
            if (normalized.length() > MAX_URL_LENGTH) return false;
            URI uri = URI.create(normalized);
            return (
                "https".equalsIgnoreCase(uri.getScheme()) &&
                uri.getHost() != null &&
                uri.getUserInfo() == null
            );
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
