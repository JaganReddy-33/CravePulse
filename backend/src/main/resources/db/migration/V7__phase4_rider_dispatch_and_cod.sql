-- V7__phase4_rider_dispatch_and_cod.sql
-- Phase 4: Dispatch, Fair Wait-Time Compensation, 100% Tips, and COD Settlement Ledger

-- 1. Add tip_amount to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- 2. Add server timestamps & wait-claim guard to delivery_dispatches
ALTER TABLE delivery_dispatches 
    ADD COLUMN IF NOT EXISTS arrived_at_restaurant_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS arrived_at_customer_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS wait_compensation_claimed BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Add cash in hand tracking to rider_profiles
ALTER TABLE rider_profiles 
    ADD COLUMN IF NOT EXISTS cash_in_hand DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS max_cash_limit DECIMAL(10, 2) NOT NULL DEFAULT 5000.00;

-- 4. Cash On Delivery Settlement Ledger
CREATE TABLE IF NOT EXISTS rider_cod_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rider_id BIGINT NOT NULL,
    order_id BIGINT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('COLLECTED', 'DEPOSITED', 'ADJUSTED') NOT NULL,
    running_cash_in_hand DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reference_number VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cod_settlement_rider FOREIGN KEY (rider_id) REFERENCES rider_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_cod_settlement_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_cod_rider (rider_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
