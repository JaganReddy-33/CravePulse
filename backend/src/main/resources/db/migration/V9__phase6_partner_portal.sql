-- ==============================================================================
-- CravePulse V9 Migration: Phase 6 Partner Portal
-- Operating Hours, Bank/UPI Settings, Soft Deletes, and Settlement Statements
-- ==============================================================================

-- 1. Extend restaurant_profiles with bank/UPI payout details and auto-reject SLA minutes
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100) DEFAULT NULL;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20) DEFAULT NULL;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS bank_beneficiary_name VARCHAR(150) DEFAULT NULL;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS auto_reject_minutes INT NOT NULL DEFAULT 10;

-- 2. Extend menu_items with soft-delete flag, display order, and availability schedule
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_from TIME DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_to TIME DEFAULT NULL;

-- 3. Restaurant Operating Hours Table (1=Monday ... 7=Sunday)
CREATE TABLE IF NOT EXISTS restaurant_hours (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    day_of_week INT NOT NULL,
    open_time TIME NOT NULL DEFAULT '09:00:00',
    close_time TIME NOT NULL DEFAULT '23:00:00',
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_reshours_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_rest_day (restaurant_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Restaurant Payout Ledger & Settlement Statements
CREATE TABLE IF NOT EXISTS restaurant_payouts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    payout_reference VARCHAR(64) NOT NULL UNIQUE,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    gross_sales DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    gst_on_commission DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_payout DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PAID',
    utr_number VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_respayout_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    INDEX idx_respayout_rest (restaurant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
