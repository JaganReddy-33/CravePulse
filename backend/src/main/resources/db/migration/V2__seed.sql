-- ==============================================================================
-- FoodPlatform: Production Real-Time Food Delivery Seed Data
-- Database: MySQL 8.0+
-- Migration: V2__seed.sql
-- Default Password for all demo accounts: Password@123
-- Hash: $2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq
-- ==============================================================================

-- 1. Insert Core Users
INSERT INTO users (id, full_name, email, phone, password_hash, role, status, avatar_url, wallet_balance)
VALUES
(1, 'Jaganmohan Reddy', 'customer@foodora.com', '+919876543210', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 500.00),
(2, 'Chef Lohith', 'chef@foodanalytics.com', '+919876543211', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150', 45000.00),
(3, 'Prasad Rao', 'rider@swiftlogistics.com', '+919876543212', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RIDER', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 2450.00),
(4, 'Jaganmohan Reddy', 'admin@foodplatform.com', '+919876543213', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 980000.00),
(5, 'Santhosh Reddy', 'santhosh@example.com', '+919876543214', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 150.00),
(6, 'Ajay Kumar', 'ajay@pizzapalace.com', '+919876543215', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', 32000.00),
(7, 'Lohith V', 'lohith.fleet@swiftlogistics.com', '+919876543216', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RIDER', 'ACTIVE', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 1280.00),
(8, 'Santhosh Kumar', 'santhosh@burgerhouse.com', '+919876543217', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150', 21000.00),
(9, 'Ajay Reddy', 'ajay.sushi@sushiworld.com', '+919876543218', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 39000.00),
(10, 'Prasad Varma', 'prasad.healthy@healthybites.com', '+919876543219', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 18000.00);

-- 2. Insert Customer Addresses
INSERT INTO user_addresses (id, user_id, title, address_line, landmark, city, state, postal_code, latitude, longitude, is_default)
VALUES
(1, 1, 'Home', 'Apartment 402, Sunshine Heights, 12th Main Road', 'Near 100ft Road junction, Indiranagar', 'Bangalore', 'Karnataka', '560038', 12.9783692, 77.6408356, TRUE),
(2, 1, 'Work', 'WeWork Galaxy, 43 Residency Road, Shanthala Nagar', 'Opposite Bangalore Club', 'Bangalore', 'Karnataka', '560025', 12.9698270, 77.6033420, FALSE),
(3, 5, 'Home', 'Villa 18, Green Meadows, 5th Cross, HSR Sector 1', 'Near Agara Lake Park', 'Bangalore', 'Karnataka', '560102', 12.9121180, 77.6445540, TRUE);

-- 3. Insert Restaurant Profiles
INSERT INTO restaurant_profiles (id, user_id, name, slug, description, banner_image, logo_image, phone, email, cuisine_types, rating, total_reviews, pure_veg, price_tier, prep_time_min, prep_time_max, latitude, longitude, address, fssai_license, commission_rate, max_concurrent_orders, current_load, is_open, is_auto_throttled, is_kyc_approved)
VALUES
(1, 2, 'Spice Symphony & Grill', 'spice-symphony-grill', 'Authentic North Indian curries, aromatic slow-cooked biryanis, tandoori delicacies, and handcrafted desserts.', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200', '+919876543211', 'kitchen@spicesymphony.com', 'North Indian, Biryani, Mughlai', 4.8, 1420, FALSE, '$$', 20, 30, 12.9715987, 77.6350000, 'Plot 88, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru', 'FSSAI-11223344556677', 15.00, 20, 4, TRUE, FALSE, TRUE),
(2, 6, 'Pizza Palace', 'pizza-palace', 'Artisan wood-fired Neapolitan pizzas, freshly rolled hand-tossed pasta, garlic breads, and Italian sodas.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=200', '+919876543215', 'hello@pizzapalace.com', 'Pizza, Italian, Fast Food', 4.4, 980, FALSE, '$$', 25, 35, 12.9790000, 77.6420000, '34, 12th Main, Indiranagar, Bengaluru', 'FSSAI-22334455667788', 15.00, 15, 2, TRUE, FALSE, TRUE),
(3, 8, 'Burger House', 'burger-house', 'Gourmet smashed beef & smash veg burgers, double-fried crispy onion rings, loaded fries, and thick shakes.', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', '+919876543218', 'order@burgerhouse.com', 'Burgers, American, Fast Food', 4.6, 2150, FALSE, '$', 15, 25, 12.9730000, 77.6380000, '12, CMH Road, Indiranagar, Bengaluru', 'FSSAI-33445566778899', 12.00, 25, 6, TRUE, FALSE, TRUE),
(4, 9, 'Sushi World', 'sushi-world', 'Premium sashimi, signature maki rolls, comforting miso soups, and fresh Japanese poke bowls.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=200', '+919876543219', 'service@sushiworld.com', 'Sushi, Japanese, Asian', 4.8, 860, FALSE, '$$$', 25, 40, 12.9690000, 77.6390000, '56, Defense Colony, Indiranagar, Bengaluru', 'FSSAI-44556677889900', 18.00, 10, 1, TRUE, FALSE, TRUE),
(5, 10, 'Healthy Bites', 'healthy-bites', 'Macro-balanced nutrient-packed salad bowls, cold-pressed fruit detox juices, and protein energy smoothies.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200', '+919876543220', 'contact@healthybites.com', 'Salads, Healthy, Organic', 4.5, 740, TRUE, '$$', 15, 25, 12.9750000, 77.6310000, '77, 80 Feet Road, Indiranagar, Bengaluru', 'FSSAI-55667788990011', 14.00, 15, 0, TRUE, FALSE, TRUE);

-- 4. Menu Categories
INSERT INTO menu_categories (id, restaurant_id, name, display_order, is_active)
VALUES
(1, 1, 'Main Course Curries', 1, TRUE),
(2, 1, 'Royal Biryanis', 2, TRUE),
(3, 1, 'Starters & Tandoor', 3, TRUE),
(4, 1, 'Artisan Breads & Rice', 4, TRUE),
(5, 1, 'Desserts & Sweets', 5, TRUE),
(6, 2, 'Woodfired Pizzas', 1, TRUE),
(7, 2, 'Pastas & Garlic Breads', 2, TRUE),
(8, 3, 'Signature Burgers', 1, TRUE),
(9, 3, 'Sides & Shakes', 2, TRUE),
(10, 4, 'Maki Rolls & Nigiri', 1, TRUE),
(11, 5, 'Superfood Salads', 1, TRUE);

-- 5. Menu Items (with Radical Price Transparency: Dine-In vs Platform Price Parity!)
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, image_url, dine_in_price, platform_price, is_veg, is_available, prep_time_minutes, calorie_count, rating, total_orders)
VALUES
-- Spice Symphony items (featured in Chef Rohan's dashboard)
(1, 1, 1, 'Paneer Butter Masala', 'Fresh cottage cheese cubes simmered in a rich tomato-cashew silky butter gravy with aromatic dried fenugreek.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500', 280.00, 280.00, TRUE, TRUE, 15, 480, 4.9, 312),
(2, 1, 2, 'Hyderabadi Chicken Biryani', 'Fragrant long-grain basmati rice layered with spiced tender chicken, saffron, mint, and slow-cooked in sealed dum pot.', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500', 320.00, 320.00, FALSE, TRUE, 20, 650, 4.9, 480),
(3, 1, 1, 'Dal Makhani', 'Black lentils slow cooked overnight on charcoal tandoor with churned country butter and fresh cream.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500', 240.00, 240.00, TRUE, TRUE, 12, 390, 4.8, 220),
(4, 1, 3, 'Crispy Masala Dosa', 'Golden fermented rice-lentil crepe smeared with spicy red chutney, filled with tempered potato mash, served with sambar.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500', 110.00, 110.00, TRUE, TRUE, 10, 310, 4.7, 195),
(5, 1, 5, 'Chocolate Lava Cake', 'Warm molten Belgian chocolate centered decadent cake served with vanilla bean whip.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', 160.00, 160.00, TRUE, TRUE, 8, 420, 4.9, 142),
(6, 1, 4, 'Butter Garlic Naan', 'Clay oven leavened bread brushed with melted garlic butter and fresh coriander.', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500', 60.00, 60.00, TRUE, TRUE, 5, 180, 4.7, 540),

-- Pizza Palace
(7, 2, 6, 'Woodfired Margherita Pizza', 'San Marzano tomato base, fresh buffalo mozzarella, virgin olive oil, and sweet basil on a fermented sourdough crust.', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500', 349.00, 349.00, TRUE, TRUE, 15, 750, 4.6, 210),
(8, 2, 6, 'Spicy Pepperoni & Jalapeno', 'Smoked pork pepperoni, fiery pickled jalapenos, aged mozzarella, and hot honey drizzle.', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500', 449.00, 449.00, FALSE, TRUE, 15, 880, 4.8, 185),
(9, 2, 7, 'Creamy Truffle Penne Pasta', 'Al dente penne in a wild mushroom truffle emulsion topped with shaved Grana Padano parmesan.', 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500', 320.00, 320.00, TRUE, TRUE, 18, 590, 4.5, 96),

-- Burger House
(10, 3, 8, 'Classic Cheeseburger', 'Juicy grilled Angus patty, melted sharp cheddar, dill pickles, crisp lettuce, and secret house relish.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', 189.00, 189.00, FALSE, TRUE, 12, 620, 4.7, 340),
(11, 3, 8, 'Crispy Paneer Truffle Burger', 'Herb-crusted cottage cheese steak, caramelised balsamic onions, and truffle garlic aioli.', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500', 179.00, 179.00, TRUE, TRUE, 12, 540, 4.6, 180),
(12, 3, 9, 'Loaded Truffle Parmesan Fries', 'Hand-cut russet potato fries tossed in white truffle oil, sea salt, fresh parsley, and grated parmesan.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500', 140.00, 140.00, TRUE, TRUE, 8, 380, 4.8, 260),

-- Sushi World
(13, 4, 10, 'California Salmon Roll (8 Pcs)', 'Norwegian salmon, ripe hass avocado, cucumber, Japanese kewpie mayo, rolled inside-out with tobiko.', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500', 450.00, 450.00, FALSE, TRUE, 18, 410, 4.9, 130),

-- Healthy Bites
(14, 5, 11, 'Mediterranean Quinoa Salad', 'Tri-colour organic quinoa, Persian cucumbers, Kalamata olives, cherry tomatoes, creamy feta, and lemon oregano vinaigrette.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 220.00, 220.00, TRUE, TRUE, 10, 280, 4.6, 110),
(15, 5, 11, 'Fresh Alphonso Mango Smoothie', 'Chilled pure alphonso mango puree blended with Greek yoghurt, chia seeds, and wild honey.', 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500', 120.00, 120.00, TRUE, TRUE, 5, 190, 4.8, 170);

-- 6. Item Variants & Add-ons
INSERT INTO menu_item_variants (id, menu_item_id, variant_name, price_adjustment, is_default, is_available)
VALUES
(1, 2, 'Half (1 Person)', 0.00, TRUE, TRUE),
(2, 2, 'Full (2-3 Persons)', 180.00, FALSE, TRUE),
(3, 7, 'Regular (10 Inch)', 0.00, TRUE, TRUE),
(4, 7, 'Large (12 Inch)', 150.00, FALSE, TRUE),
(5, 10, 'Single Patty', 0.00, TRUE, TRUE),
(6, 10, 'Double Patty Monster', 80.00, FALSE, TRUE);

INSERT INTO menu_item_addons (id, menu_item_id, addon_name, price, is_available)
VALUES
(1, 1, 'Extra Garlic Butter Glaze', 25.00, TRUE),
(2, 2, 'Spicy Mirchi Ka Salan & Raita Bowl', 40.00, TRUE),
(3, 7, 'Extra Buffalo Mozzarella', 60.00, TRUE),
(4, 7, 'Hot Honey Glaze Dip', 30.00, TRUE),
(5, 10, 'Melted Cheddar Cheese Slice', 30.00, TRUE),
(6, 10, 'Crispy Onion Straws', 25.00, TRUE);

-- 7. Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, usage_limit, times_used, is_active)
VALUES
(1, 'FOOD50', '50% OFF up to ₹150 on delicious meals above ₹199', 'PERCENTAGE', 50.00, 199.00, 150.00, '2025-01-01 00:00:00', '2028-12-31 23:59:59', 5000, 142, TRUE),
(2, 'WELCOME100', 'Flat ₹100 instant discount on orders above ₹399', 'FLAT', 100.00, 399.00, 100.00, '2025-01-01 00:00:00', '2028-12-31 23:59:59', 10000, 480, TRUE),
(3, 'FREESHIP', 'Free delivery fee waived on orders above ₹249', 'FLAT', 35.00, 249.00, 35.00, '2025-01-01 00:00:00', '2028-12-31 23:59:59', 2000, 89, TRUE);

-- 8. Rider Profiles (with Fair Pay stats & real-time telemetry)
INSERT INTO rider_profiles (id, user_id, vehicle_type, vehicle_number, driving_license, is_kyc_approved, is_online, is_available, current_latitude, current_longitude, last_ping_time, total_deliveries, rating, active_order_id, wallet_balance)
VALUES
(1, 3, 'Ather 450X EV', 'KA-03-EM-8842', 'DL-0420110098234', TRUE, TRUE, FALSE, 12.9735000, 77.6370000, CURRENT_TIMESTAMP, 384, 4.9, 2, 1420.00),
(2, 7, 'Honda Activa 6G', 'KA-01-HR-4519', 'DL-0920150034112', TRUE, TRUE, TRUE, 12.9760000, 77.6410000, CURRENT_TIMESTAMP, 219, 4.8, NULL, 890.00);

-- 9. Orders in Multiple States (Historical Delivered, Active Out For Delivery, Live in Kitchen)
INSERT INTO orders (id, order_number, customer_id, restaurant_id, rider_id, delivery_address_id, status, subtotal, restaurant_discount, coupon_id, coupon_discount, packaging_fee, delivery_fee, platform_fee, gst_tax, total_amount, payment_mode, payment_status, idempotency_key, eta_min_minutes, eta_max_minutes, estimated_delivery_at, actual_delivery_at, is_goodwill_credit_awarded, special_instructions)
VALUES
-- Order 1: Delivered yesterday with full 3-way ratings
(1, 'ORD-20261024-001', 1, 1, 1, 1, 'DELIVERED', 600.00, 0.00, 1, 150.00, 15.00, 35.00, 5.00, 23.25, 528.25, 'RAZORPAY', 'PAID', 'IDEMP-ORD-001', 30, 40, '2026-10-24 19:40:00', '2026-10-24 19:34:00', FALSE, 'Please ring the doorbell and leave at door.'),
-- Order 2: Currently PICKED_UP (Out for delivery!)
(2, 'ORD-20261025-002', 1, 1, 1, 1, 'PICKED_UP', 430.00, 0.00, 3, 35.00, 15.00, 35.00, 5.00, 19.75, 469.75, 'COD', 'PENDING', 'IDEMP-ORD-002', 25, 35, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE), NULL, FALSE, 'Keep biryani extra hot please.'),
-- Order 3: Currently PREPARING in Chef Rohan kitchen
(3, 'ORD-20261025-003', 5, 1, NULL, 3, 'PREPARING', 520.00, 0.00, 2, 100.00, 15.00, 35.00, 5.00, 21.00, 496.00, 'RAZORPAY', 'PAID', 'IDEMP-ORD-003', 30, 45, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE), NULL, FALSE, 'Mild spice level for kids.'),
-- Order 4: Newly PLACED waiting kitchen acceptance
(4, 'ORD-20261025-004', 1, 2, NULL, 1, 'PLACED', 349.00, 0.00, NULL, 0.00, 15.00, 35.00, 5.00, 17.45, 421.45, 'COD', 'PENDING', 'IDEMP-ORD-004', 35, 45, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 40 MINUTE), NULL, FALSE, 'Well done crispy crust.');

-- 10. Order Items
INSERT INTO order_items (id, order_id, menu_item_id, item_name, variant_name, unit_price, quantity, total_price, addon_names, addon_total)
VALUES
(1, 1, 1, 'Paneer Butter Masala', NULL, 280.00, 1, 280.00, 'Extra Garlic Butter Glaze', 25.00),
(2, 1, 2, 'Hyderabadi Chicken Biryani', 'Full (2-3 Persons)', 500.00, 1, 500.00, NULL, 0.00),
(3, 2, 2, 'Hyderabadi Chicken Biryani', 'Half (1 Person)', 320.00, 1, 320.00, 'Spicy Mirchi Ka Salan & Raita Bowl', 40.00),
(4, 2, 4, 'Crispy Masala Dosa', NULL, 110.00, 1, 110.00, NULL, 0.00),
(5, 3, 1, 'Paneer Butter Masala', NULL, 280.00, 1, 280.00, NULL, 0.00),
(6, 3, 3, 'Dal Makhani', NULL, 240.00, 1, 240.00, NULL, 0.00),
(7, 4, 7, 'Woodfired Margherita Pizza', 'Regular (10 Inch)', 349.00, 1, 349.00, 'Extra Buffalo Mozzarella', 60.00);

-- 11. Order Events Audit Trail
INSERT INTO order_events (id, order_id, previous_status, new_status, triggered_by_user_id, reason, latitude, longitude)
VALUES
(1, 1, NULL, 'PLACED', 1, 'Customer placed order with Razorpay test payment', 12.9783692, 77.6408356),
(2, 1, 'PLACED', 'ACCEPTED', 2, 'Kitchen accepted order', 12.9715987, 77.6350000),
(3, 1, 'ACCEPTED', 'PREPARING', 2, 'Chef started preparation', 12.9715987, 77.6350000),
(4, 1, 'PREPARING', 'READY', 2, 'Food packed and labeled', 12.9715987, 77.6350000),
(5, 1, 'READY', 'PICKED_UP', 3, 'Rider verified order bag OTP', 12.9715987, 77.6350000),
(6, 1, 'PICKED_UP', 'DELIVERED', 3, 'Delivered to customer doorstep', 12.9783692, 77.6408356),
(7, 2, NULL, 'PLACED', 1, 'Customer placed COD order', 12.9783692, 77.6408356),
(8, 2, 'PLACED', 'ACCEPTED', 2, 'Kitchen accepted order', 12.9715987, 77.6350000),
(9, 2, 'ACCEPTED', 'PREPARING', 2, 'Biryani simmering on low heat', 12.9715987, 77.6350000),
(10, 2, 'PREPARING', 'READY', 2, 'Dispatched to delivery staging table', 12.9715987, 77.6350000),
(11, 2, 'READY', 'PICKED_UP', 3, 'Rider collected thermal delivery bag', 12.9715987, 77.6350000);

-- 12. Delivery Dispatches (with Fair-Pay Protocol data)
INSERT INTO delivery_dispatches (id, order_id, rider_id, dispatch_status, offered_at, responded_at, base_pay, distance_pay, surge_pay, tip_amount, total_earning, wait_time_minutes, wait_time_pay)
VALUES
(1, 1, 1, 'ACCEPTED', '2026-10-24 19:05:00', '2026-10-24 19:05:15', 35.00, 22.00, 15.00, 30.00, 102.00, 4, 0.00),
(2, 2, 1, 'ACCEPTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 35.00, 18.00, 0.00, 20.00, 73.00, 9, 2.00);

-- 13. Rider Telemetry Logs (for live tracking on Leaflet map)
INSERT INTO rider_location_logs (id, rider_id, order_id, latitude, longitude, speed, heading)
VALUES
(1, 1, 2, 12.9720000, 77.6355000, 24.5, 45.0),
(2, 1, 2, 12.9740000, 77.6370000, 31.0, 50.0),
(3, 1, 2, 12.9760000, 77.6390000, 28.0, 40.0);

-- 14. Customer Reviews
INSERT INTO reviews (id, order_id, customer_id, restaurant_id, rider_id, food_rating, packaging_rating, delivery_rating, review_text, reply_text)
VALUES
(1, 1, 1, 1, 1, 5, 5, 5, 'Exceptional taste! The Hyderabadi Biryani was piping hot, spices were authentic, and delivery was 6 minutes earlier than the ETA.', 'Thank you John! We slow dum cook our biryanis with genuine saffron. Glad you loved it! - Chef Rohan');

-- 15. Platform Settings
INSERT INTO platform_settings (config_key, config_value, description)
VALUES
('platform_commission_percent', '15.00', 'Standard percentage commission charged to restaurant partners'),
('platform_convenience_fee', '5.00', 'Flat platform operational fee per order'),
('base_delivery_fee', '35.00', 'Base delivery fee charged up to 2 kilometers'),
('per_km_delivery_fee', '12.00', 'Delivery fee per kilometer beyond base distance'),
('gst_percent', '5.00', 'Applicable food service GST rate percentage'),
('goodwill_delay_minutes', '10', 'Delay threshold past upper ETA bound that triggers automatic goodwill credit'),
('goodwill_credit_amount', '50.00', 'Automatic credit amount deposited into user wallet on missed SLA'),
('rider_wait_fee_per_min', '2.00', 'Per minute compensation paid to rider for restaurant wait exceeding 8 minutes');

-- 16. Sample Dispute
INSERT INTO disputes (id, order_id, customer_id, issue_type, description, photo_evidence_url, requested_refund_amount, auto_refund_approved, admin_status, resolution_notes, resolved_by_user_id, resolved_at)
VALUES
(1, 1, 5, 'MISSING_ITEM', 'Raita bowl was missing from delivery package.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300', 40.00, TRUE, 'APPROVED', 'Instant auto-refund approved as requested amount was under ₹100 auto-tier threshold.', 4, CURRENT_TIMESTAMP);

-- 17. Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id)
VALUES
(1, 1, 'Order On The Way 🛵', 'Vikram Singh has picked up your order ORD-20261025-002 from Spice Symphony & Grill.', 'ORDER', FALSE, 'ORD-20261025-002'),
(2, 2, 'New Order Placed 🔔', 'New order ORD-20261025-004 received! Check your kitchen board.', 'ORDER', FALSE, 'ORD-20261025-004'),
(3, 3, 'Delivery Accepted ✅', 'Order ORD-20261025-002 assigned. Total guaranteed payout: ₹73.00.', 'DISPATCH', TRUE, 'ORD-20261025-002');
