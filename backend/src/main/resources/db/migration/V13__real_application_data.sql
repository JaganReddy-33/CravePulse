-- Durable, user-owned carts and preferences. Historical seeds are archival only.
CREATE TABLE IF NOT EXISTS user_app_state (
    user_id BIGINT NOT NULL,
    state_key VARCHAR(40) NOT NULL,
    state_json MEDIUMTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, state_key),
    CONSTRAINT fk_appstate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00;
CREATE UNIQUE INDEX uq_coupon_user_order ON coupon_usages (user_id, coupon_id, order_id);
ALTER TABLE restaurant_profiles ALTER COLUMN gst_number DROP DEFAULT;
ALTER TABLE restaurant_profiles ALTER COLUMN hygiene_rating DROP DEFAULT;
ALTER TABLE restaurant_profiles ALTER COLUMN locality DROP DEFAULT;
ALTER TABLE restaurant_profiles ALTER COLUMN pincode DROP DEFAULT;
ALTER TABLE restaurant_payouts ALTER COLUMN status SET DEFAULT 'PENDING';
