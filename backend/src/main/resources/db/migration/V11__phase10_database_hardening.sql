-- ==============================================================================
-- CravePulse Platform Migration V11: Phase 10 Database Hardening & Schema Integrity
-- Database: MySQL 8.0+
-- Strict constraints, idempotency, support tickets, favorites, coupon tracking,
-- payment refunds, rider documents, delivery zones, and non-cascade audit rules
-- ==============================================================================

-- 1. Customer Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    restaurant_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_rest FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_fav_user_rest (user_id, restaurant_id),
    INDEX idx_fav_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customer & Partner Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    order_id BIGINT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    resolution_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_ticket_user (user_id),
    INDEX idx_ticket_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Coupon Usages Tracking Table (Audit ledger preventing duplicate claims)
CREATE TABLE IF NOT EXISTS coupon_usages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    discount_applied DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cu_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cu_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cu_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_coupon_user_order (user_id, coupon_id, order_id),
    INDEX idx_cu_user_coupon (user_id, coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Unified Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_name, entity_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Dedicated Payment Refunds Ledger
CREATE TABLE IF NOT EXISTS payment_refunds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    refund_reference VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    reason VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    gateway_refund_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_pref_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pref_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    INDEX idx_pref_order (order_id),
    INDEX idx_pref_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Delivery Rider KYC Documents Table
CREATE TABLE IF NOT EXISTS rider_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rider_id BIGINT NOT NULL,
    document_type ENUM('DRIVING_LICENSE', 'VEHICLE_RC', 'PAN_CARD', 'AADHAAR', 'INSURANCE') NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rdoc_rider FOREIGN KEY (rider_id) REFERENCES rider_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_rider_doc (rider_id, document_type),
    INDEX idx_rdoc_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. High-Performance Distributed Idempotency Keys Table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    key_value VARCHAR(120) NOT NULL UNIQUE,
    scope VARCHAR(50) NOT NULL,
    user_id BIGINT NULL,
    request_hash VARCHAR(64) NULL,
    response_payload MEDIUMTEXT NULL,
    status ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_idemp_key (key_value),
    INDEX idx_idemp_exp (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Dynamic Geofenced Delivery Zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    center_lat DECIMAL(10, 7) NOT NULL,
    center_lng DECIMAL(10, 7) NOT NULL,
    radius_km DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    surge_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zone_city (city, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Composite Query Performance Indexes
CREATE INDEX idx_orders_cust_created ON orders (customer_id, created_at);
CREATE INDEX idx_dispatch_status_offered ON delivery_dispatches (dispatch_status, offered_at);
CREATE INDEX idx_notif_user_read_created ON notifications (user_id, is_read, created_at);

-- 10. Financial CHECK Constraints (Strict non-negative monetary safety)
ALTER TABLE orders ADD CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_total CHECK (total_amount >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery_fee CHECK (delivery_fee >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_packaging_fee CHECK (packaging_fee >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_platform_fee CHECK (platform_fee >= 0);
ALTER TABLE orders ADD CONSTRAINT chk_orders_tip CHECK (tip_amount >= 0);
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (amount >= 0);
ALTER TABLE users ADD CONSTRAINT chk_users_wallet_balance CHECK (wallet_balance >= 0);
ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_amount CHECK (amount >= 0);
ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_balance_after CHECK (balance_after >= 0);
ALTER TABLE menu_items ADD CONSTRAINT chk_menu_platform_price CHECK (platform_price >= 0);
ALTER TABLE menu_items ADD CONSTRAINT chk_menu_dine_in_price CHECK (dine_in_price >= 0);
ALTER TABLE rider_profiles ADD COLUMN cash_in_hand DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE rider_profiles ADD CONSTRAINT chk_rider_wallet CHECK (wallet_balance >= 0);
ALTER TABLE rider_profiles ADD CONSTRAINT chk_rider_cash CHECK (cash_in_hand >= 0);

-- 11. Foreign Key Audit: Retain records on financial, ledger, and dispatch tables (No Cascades)
-- Drop cascade FKs and replace with RESTRICT
ALTER TABLE payments DROP FOREIGN KEY fk_payment_order;
ALTER TABLE payments ADD CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE wallet_transactions DROP FOREIGN KEY fk_wallet_user;
ALTER TABLE wallet_transactions ADD CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE delivery_dispatches DROP FOREIGN KEY fk_dispatch_order;
ALTER TABLE delivery_dispatches ADD CONSTRAINT fk_dispatch_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE order_events DROP FOREIGN KEY fk_event_order;
ALTER TABLE order_events ADD CONSTRAINT fk_event_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
