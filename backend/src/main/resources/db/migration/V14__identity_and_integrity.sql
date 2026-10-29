-- Missing contact details are unknown, not a shared fake phone number.
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NULL;
ALTER TABLE restaurant_profiles ALTER COLUMN is_kyc_approved SET DEFAULT FALSE;
ALTER TABLE rider_profiles ALTER COLUMN is_kyc_approved SET DEFAULT FALSE;
-- Upgrade the existing V5 usage ledger rather than relying on CREATE IF NOT EXISTS.
ALTER TABLE coupon_usages DROP FOREIGN KEY fk_coupon_usage_user;
ALTER TABLE coupon_usages DROP FOREIGN KEY fk_coupon_usage_coupon;
ALTER TABLE coupon_usages ADD CONSTRAINT fk_coupon_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE coupon_usages ADD CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT;
ALTER TABLE coupon_usages ADD CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
