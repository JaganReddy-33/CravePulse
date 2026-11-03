-- ==============================================================================
-- FoodPlatform: Production Real-Time Food Delivery Schema
-- Database: MySQL 8.0+
-- Migration: V1__init.sql
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS rider_location_logs;
DROP TABLE IF EXISTS delivery_dispatches;
DROP TABLE IF EXISTS order_events;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS rider_profiles;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS menu_item_addons;
DROP TABLE IF EXISTS menu_item_variants;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menu_categories;
DROP TABLE IF EXISTS restaurant_profiles;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS user_tokens;
DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Customer, Restaurant Owner, Delivery Rider, Admin Ops)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'RESTAURANT_OWNER', 'RIDER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    status ENUM('ACTIVE', 'PENDING_KYC', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Refresh Tokens
CREATE TABLE user_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_lookup (refresh_token, revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customer Address Book
CREATE TABLE user_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(50) NOT NULL DEFAULT 'Home',
    address_line VARCHAR(255) NOT NULL,
    landmark VARCHAR(120) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    maps_url VARCHAR(500) DEFAULT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_addresses (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Restaurant Profiles (with Overload Protection & Price Parity config)
CREATE TABLE restaurant_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    description TEXT,
    banner_image VARCHAR(500) NOT NULL,
    logo_image VARCHAR(500) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(150) NOT NULL,
    cuisine_types VARCHAR(255) NOT NULL,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 4.5,
    total_reviews INT NOT NULL DEFAULT 0,
    pure_veg BOOLEAN NOT NULL DEFAULT FALSE,
    price_tier VARCHAR(10) NOT NULL DEFAULT '$$',
    prep_time_min INT NOT NULL DEFAULT 20,
    prep_time_max INT NOT NULL DEFAULT 35,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    address VARCHAR(255) NOT NULL,
    fssai_license VARCHAR(50) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    max_concurrent_orders INT NOT NULL DEFAULT 15,
    current_load INT NOT NULL DEFAULT 0,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    is_auto_throttled BOOLEAN NOT NULL DEFAULT FALSE,
    is_kyc_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_restaurant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rest_geo (latitude, longitude),
    INDEX idx_rest_open (is_open, is_auto_throttled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Menu Categories
CREATE TABLE menu_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cat_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    INDEX idx_cat_rest (restaurant_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Menu Items (with Radical Price Transparency: Dine-In vs Platform Price)
CREATE TABLE menu_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    dine_in_price DECIMAL(10, 2) NOT NULL,
    platform_price DECIMAL(10, 2) NOT NULL,
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    prep_time_minutes INT NOT NULL DEFAULT 15,
    calorie_count INT DEFAULT 400,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 4.7,
    total_orders INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_category FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
    INDEX idx_item_rest (restaurant_id, is_available),
    INDEX idx_item_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Item Variants (e.g., Small, Medium, Large)
CREATE TABLE menu_item_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id BIGINT NOT NULL,
    variant_name VARCHAR(80) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_variant_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Item Add-ons (e.g., Extra Cheese, Sauce, Fries)
CREATE TABLE menu_item_addons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id BIGINT NOT NULL,
    addon_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_addon_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Coupons and Discounts
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    discount_type ENUM('PERCENTAGE', 'FLAT') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    valid_from TIMESTAMP NULL DEFAULT NULL,
    valid_until TIMESTAMP NULL DEFAULT NULL,
    usage_limit INT NOT NULL DEFAULT 1000,
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Rider Profiles (with Fair Pay stats & real-time telemetry)
CREATE TABLE rider_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Electric Scooter',
    vehicle_number VARCHAR(50) NOT NULL,
    driving_license VARCHAR(60) NOT NULL,
    is_kyc_approved BOOLEAN NOT NULL DEFAULT TRUE,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    current_latitude DECIMAL(10, 7) NOT NULL DEFAULT 12.9715987,
    current_longitude DECIMAL(10, 7) NOT NULL DEFAULT 77.5945627,
    last_ping_time TIMESTAMP NULL DEFAULT NULL,
    total_deliveries INT NOT NULL DEFAULT 0,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 4.8,
    active_order_id BIGINT DEFAULT NULL,
    wallet_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rider_status (is_online, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Orders Table (Comprehensive state machine, ETA engine confidence & SLA goodwill tracking)
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    restaurant_id BIGINT NOT NULL,
    rider_id BIGINT DEFAULT NULL,
    delivery_address_id BIGINT NOT NULL,
    status ENUM('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'REJECTED', 'REFUNDED') NOT NULL DEFAULT 'PLACED',
    subtotal DECIMAL(10, 2) NOT NULL,
    restaurant_discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    coupon_id BIGINT DEFAULT NULL,
    coupon_discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    packaging_fee DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    gst_tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_mode ENUM('COD', 'RAZORPAY') NOT NULL DEFAULT 'COD',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
    eta_min_minutes INT NOT NULL DEFAULT 25,
    eta_max_minutes INT NOT NULL DEFAULT 35,
    estimated_delivery_at TIMESTAMP NULL DEFAULT NULL,
    actual_delivery_at TIMESTAMP NULL DEFAULT NULL,
    is_goodwill_credit_awarded BOOLEAN NOT NULL DEFAULT FALSE,
    special_instructions VARCHAR(255) DEFAULT NULL,
    cancellation_reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_cust FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_order_rest FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id),
    CONSTRAINT fk_order_rider FOREIGN KEY (rider_id) REFERENCES rider_profiles(id),
    CONSTRAINT fk_order_addr FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(id),
    CONSTRAINT fk_order_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    INDEX idx_order_cust_status (customer_id, status),
    INDEX idx_order_rest_status (restaurant_id, status),
    INDEX idx_order_rider_status (rider_id, status),
    INDEX idx_order_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Order Items
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    variant_name VARCHAR(100) DEFAULT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    addon_names TEXT DEFAULT NULL,
    addon_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    INDEX idx_oi_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Order Events Audit Trail
CREATE TABLE order_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    previous_status VARCHAR(30) DEFAULT NULL,
    new_status VARCHAR(30) NOT NULL,
    triggered_by_user_id BIGINT DEFAULT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    latitude DECIMAL(10, 7) DEFAULT NULL,
    longitude DECIMAL(10, 7) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_event_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Delivery Dispatches (Fair-Pay Protocol: Upfront breakdowns, wait-time compensation, zero-penalty rejection)
CREATE TABLE delivery_dispatches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    rider_id BIGINT NOT NULL,
    dispatch_status ENUM('OFFERED', 'ACCEPTED', 'REJECTED', 'TIMED_OUT') NOT NULL DEFAULT 'OFFERED',
    offered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    base_pay DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    distance_pay DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
    surge_pay DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tip_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_earning DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    wait_time_minutes INT NOT NULL DEFAULT 0,
    wait_time_pay DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    rejection_reason VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_dispatch_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_dispatch_rider FOREIGN KEY (rider_id) REFERENCES rider_profiles(id) ON DELETE CASCADE,
    INDEX idx_dispatch_status (dispatch_status),
    INDEX idx_dispatch_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Real-Time Rider Telemetry Logs
CREATE TABLE rider_location_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rider_id BIGINT NOT NULL,
    order_id BIGINT DEFAULT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    heading DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_rider FOREIGN KEY (rider_id) REFERENCES rider_profiles(id) ON DELETE CASCADE,
    INDEX idx_log_rider (rider_id, logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Payment Gateway Ledger
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_mode ENUM('COD', 'RAZORPAY') NOT NULL,
    razorpay_order_id VARCHAR(100) DEFAULT NULL,
    razorpay_payment_id VARCHAR(100) DEFAULT NULL,
    razorpay_signature VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
    raw_response TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payment_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Instant Dispute Resolution (Photo evidence, rule-based auto-refunds, admin escalation)
CREATE TABLE disputes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    issue_type ENUM('MISSING_ITEM', 'SPOILED_FOOD', 'WRONG_ITEM', 'SEVERE_DELAY', 'SPILLAGE') NOT NULL,
    description TEXT NOT NULL,
    photo_evidence_url VARCHAR(500) DEFAULT NULL,
    requested_refund_amount DECIMAL(10, 2) NOT NULL,
    auto_refund_approved BOOLEAN NOT NULL DEFAULT FALSE,
    admin_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    resolution_notes TEXT DEFAULT NULL,
    resolved_by_user_id BIGINT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_dispute_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_dispute_status (admin_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Multi-Dimensional Customer Reviews (Food, Packaging, Delivery)
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    restaurant_id BIGINT NOT NULL,
    rider_id BIGINT DEFAULT NULL,
    food_rating INT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    packaging_rating INT NOT NULL CHECK (packaging_rating BETWEEN 1 AND 5),
    delivery_rating INT NOT NULL CHECK (delivery_rating BETWEEN 1 AND 5),
    review_text TEXT DEFAULT NULL,
    reply_text TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_rest FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    INDEX idx_review_rest (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Persistent Notification Center
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Customer & Rider Wallet Transaction Ledger
CREATE TABLE wallet_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('CREDIT', 'DEBIT') NOT NULL,
    reason VARCHAR(120) NOT NULL,
    reference_order_id BIGINT DEFAULT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wallet_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Dynamic Platform Settings
CREATE TABLE platform_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
