ALTER TABLE restaurant_profiles
    ADD COLUMN commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00;
