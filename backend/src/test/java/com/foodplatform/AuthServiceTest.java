package com.foodplatform;

import com.foodplatform.util.PasswordUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthServiceTest {

    @Test
    @DisplayName("PasswordUtil should securely hash and verify BCrypt passwords")
    void testBcryptHashing() {
        String plain = "Password@123";
        String hash = PasswordUtil.hashPassword(plain);

        assertNotNull(hash);
        assertTrue(hash.startsWith("$2a$") || hash.startsWith("$2b$"));
        assertTrue(PasswordUtil.checkPassword(plain, hash));
        assertFalse(PasswordUtil.checkPassword("WrongPassword", hash));
    }

    @Test
    @DisplayName("PasswordUtil should reject null or empty password inputs")
    void testInvalidPasswordInputs() {
        assertThrows(IllegalArgumentException.class, () -> PasswordUtil.hashPassword(""));
        assertThrows(IllegalArgumentException.class, () -> PasswordUtil.hashPassword(null));
        assertFalse(PasswordUtil.checkPassword(null, "someHash"));
        assertFalse(PasswordUtil.checkPassword("pass", null));
    }
}
