package com.foodplatform.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ImageUrlValidatorTest {

    @Test
    void acceptsHttpsImageUrls() {
        assertTrue(ImageUrlValidator.isValidHttpsUrl("https://images.example.com/dish.jpg"));
        assertTrue(
            ImageUrlValidator.isValidHttpsUrl("https://cdn.example.com/image?id=42&format=webp")
        );
    }

    @Test
    void rejectsNonHttpsAndMalformedUrls() {
        assertFalse(ImageUrlValidator.isValidHttpsUrl("http://images.example.com/dish.jpg"));
        assertFalse(ImageUrlValidator.isValidHttpsUrl("javascript:alert(1)"));
        assertFalse(ImageUrlValidator.isValidHttpsUrl("https:///dish.jpg"));
        assertFalse(ImageUrlValidator.isValidHttpsUrl("https://user:pass@example.com/image.jpg"));
    }

    @Test
    void rejectsMissingOrOverlongUrls() {
        assertFalse(ImageUrlValidator.isValidHttpsUrl(null));
        assertFalse(ImageUrlValidator.isValidHttpsUrl(" "));
        assertFalse(ImageUrlValidator.isValidHttpsUrl("https://example.com/" + "x".repeat(500)));
    }
}
