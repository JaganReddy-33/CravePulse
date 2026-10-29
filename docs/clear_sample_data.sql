-- ==============================================================================
-- CravePulse: Clear All Sample/Seed Data
-- ==============================================================================
-- RUN THIS IN MySQL Workbench to clear all demo data while keeping tables intact.
-- After running, all tables will be empty and ready for fresh real data.
-- 
-- ⚠️  WARNING: This will DELETE ALL data. This cannot be undone.
-- ==============================================================================

-- Disable foreign key checks temporarily to allow truncation in any order
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Clear job system data (new V12 tables)
TRUNCATE TABLE job_applications;
TRUNCATE TABLE job_postings;

-- 2. Clear notifications
TRUNCATE TABLE notifications;

-- 3. Clear disputes
TRUNCATE TABLE disputes;

-- 4. Clear reviews
TRUNCATE TABLE reviews;

-- 5. Clear rider tracking & telemetry
TRUNCATE TABLE rider_location_logs;

-- 6. Clear delivery & dispatch data
TRUNCATE TABLE delivery_dispatches;

-- 7. Clear order data (events → items → orders)
TRUNCATE TABLE order_events;
TRUNCATE TABLE order_messages;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;

-- 8. Clear wallet transactions
TRUNCATE TABLE wallet_transactions;

-- 9. Clear payments
TRUNCATE TABLE payments;

-- 10. Clear coupon usage tracking (keep coupon definitions)
-- If you want to clear coupons too, uncomment the next line:
-- TRUNCATE TABLE coupons;

-- 11. Clear menu data (addons → variants → items → categories)
TRUNCATE TABLE menu_item_addons;
TRUNCATE TABLE menu_item_variants;
TRUNCATE TABLE menu_items;
TRUNCATE TABLE menu_categories;

-- 12. Clear rider profiles
TRUNCATE TABLE rider_profiles;

-- 13. Clear restaurant profiles
TRUNCATE TABLE restaurant_profiles;

-- 14. Clear user addresses
TRUNCATE TABLE user_addresses;

-- 15. Clear user tokens (sessions)
TRUNCATE TABLE user_tokens;

-- 16. Clear users
TRUNCATE TABLE users;

-- 17. Clear admin audit logs
TRUNCATE TABLE admin_audit_logs;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- ✅ Done! All sample data has been cleared.
-- 
-- IMPORTANT NOTES:
-- • Platform settings (platform_settings table) are NOT cleared — 
--   these are system configuration values, not sample data.
-- • Flyway migration tracking (flyway_schema_history) is NOT cleared —
--   this tracks which migrations have been applied.
-- • Coupons are kept by default. Uncomment line 49 to clear them too.
-- • After clearing, you can add real data through the application UI:
--   1. Register users at /auth (customer, rider, partner, admin)
--   2. Admin posts jobs at /admin/jobs
--   3. Partners add restaurants and menus
--   4. Customers place orders
-- ==============================================================================

SELECT 'All sample data cleared successfully!' AS status;

