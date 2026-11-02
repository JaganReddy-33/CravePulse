package com.foodplatform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.foodplatform.service.CloudinaryImageService;
import org.junit.jupiter.api.Test;

class CloudinaryImageServiceTest {

    @Test
    void detectsSupportedImageFormatsFromFileContents() {
        assertEquals(
            "image/jpeg",
            CloudinaryImageService.detectContentType(new byte[] {
                (byte) 0xFF,
                (byte) 0xD8,
                (byte) 0xFF,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            })
        );
        assertEquals(
            "image/png",
            CloudinaryImageService.detectContentType(new byte[] {
                (byte) 0x89,
                'P',
                'N',
                'G',
                0x0D,
                0x0A,
                0x1A,
                0x0A,
                0,
                0,
                0,
                0,
            })
        );
        assertEquals(
            "image/webp",
            CloudinaryImageService.detectContentType(new byte[] {
                'R',
                'I',
                'F',
                'F',
                0,
                0,
                0,
                0,
                'W',
                'E',
                'B',
                'P',
            })
        );
    }

    @Test
    void rejectsUnsupportedOrEmptyFileContents() {
        assertThrows(IllegalArgumentException.class, () ->
            CloudinaryImageService.detectContentType(new byte[0])
        );
        assertThrows(IllegalArgumentException.class, () ->
            CloudinaryImageService.detectContentType(new byte[] {
                'M',
                'Z',
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            })
        );
    }
}
