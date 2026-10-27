-- ==============================================================================
-- CravePulse V5 Migration: Enhanced Catalog Schema, Locality, Dish Semantics, Price Parity & Notifications
-- ==============================================================================

-- 1. Extend restaurant_profiles with real-world Indian restaurant attributes
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15) DEFAULT '29AAAAA0000A1Z5';
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS cost_for_two INT DEFAULT 400;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS hygiene_rating DECIMAL(2, 1) DEFAULT 4.8;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS locality VARCHAR(100) DEFAULT 'Indiranagar';
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS landmark VARCHAR(120) DEFAULT NULL;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) DEFAULT '560038';

-- 2. Extend menu_items with rich culinary metadata
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS slug VARCHAR(180) DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS food_type ENUM('VEG', 'NON_VEG', 'EGG') DEFAULT 'VEG';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS spice_level ENUM('MILD', 'MEDIUM', 'SPICY', 'EXTRA_SPICY') DEFAULT 'MEDIUM';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS packaging_charge DECIMAL(10, 2) DEFAULT 10.00;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_chef_special BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergen_info VARCHAR(255) DEFAULT NULL;

-- 3. Price Parity Verification Audit Proofs
CREATE TABLE IF NOT EXISTS price_parity_proofs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    dine_in_menu_photo_url VARCHAR(500) NOT NULL,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_by_admin_id BIGINT DEFAULT NULL,
    difference_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_parity_rest FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_parity_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_parity_rest (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Extend coupons with first_order_only, restaurant_id, and per_user_limit
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS first_order_only BOOLEAN DEFAULT FALSE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS restaurant_id BIGINT DEFAULT NULL;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_user_limit INT DEFAULT 1;

-- 5. Coupon Usages Table
CREATE TABLE IF NOT EXISTS coupon_usages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coupon_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    INDEX idx_usage_user_coupon (user_id, coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Server-Side Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    reference_id VARCHAR(100) DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
