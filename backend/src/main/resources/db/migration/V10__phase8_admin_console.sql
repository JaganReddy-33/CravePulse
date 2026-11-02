-- Database: MySQL 8.0+
ALTER TABLE users
ADD COLUMN fraud_flag_count INT NOT NULL DEFAULT 0;

ALTER TABLE orders
ADD COLUMN tip_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE coupons
ADD COLUMN first_order_only BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    admin_name VARCHAR(120) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(60) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_audit_target (target_type, target_id),
    INDEX idx_audit_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT IGNORE INTO
    platform_settings (config_key, config_value, description)
VALUES
    (
        'dispute_auto_refund_cap',
        '150.00',
        'Maximum refundable amount in INR for instant rule-based dispute auto-approval'
    ),
    (
        'dispute_window_hours',
        '2',
        'Window in hours post-delivery within which customer can qualify for instant auto-refund'
    ),
    (
        'max_delivery_radius_km',
        '15.0',
        'Maximum delivery dispatch radius in kilometers'
    ),
    (
        'surge_multiplier',
        '1.0',
        'Dynamic pricing surge multiplier across active zones'
    ),
    (
        'cod_order_limit',
        '2000.00',
        'Maximum order value allowed for Cash on Delivery payment'
    );
