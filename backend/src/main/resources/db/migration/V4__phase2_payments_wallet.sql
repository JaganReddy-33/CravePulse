-- ==============================================================================
-- CravePulse V4 Migration: Real Payments (Razorpay), Wallet Mode, Webhooks & Refunds
-- ==============================================================================

-- 1. Ensure orders supports 'WALLET' in payment_mode enum
ALTER TABLE orders MODIFY COLUMN payment_mode ENUM('COD', 'RAZORPAY', 'WALLET') NOT NULL DEFAULT 'COD';

-- 2. Ensure payments table schema matches all required fields
ALTER TABLE payments MODIFY COLUMN payment_mode ENUM('COD', 'RAZORPAY', 'WALLET') NOT NULL;

-- 3. Add refund tracking columns to payments if not present
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT NULL;

-- 4. Idempotent webhook event ledger for duplicate prevention
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload MEDIUMTEXT NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webhook_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
