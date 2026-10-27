import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

CITIES = {
    "Bangalore": {
        "state": "Karnataka",
        "restaurants": [
            ("Spice Symphony & Grill", "Indiranagar", 12.9716, 77.6350, "North Indian, Biryani, Mughlai", 4.8, 1420, "Plot 88, 100 Feet Rd, HAL 2nd Stage, Indiranagar", [
                ("Paneer Butter Masala", 280, 280, True, 15),
                ("Hyderabadi Chicken Biryani", 340, 340, False, 20),
                ("Dal Makhani", 240, 240, True, 12),
                ("Butter Naan", 50, 50, True, 8),
                ("Tandoori Chicken Full", 450, 450, False, 25)
            ]),
            ("Pizza Palace Indiranagar", "Indiranagar", 12.9790, 77.6420, "Pizza, Italian, Fast Food", 4.5, 980, "34, 12th Main, Indiranagar", [
                ("Woodfired Margherita Pizza", 420, 420, True, 20),
                ("Smoky BBQ Chicken Pizza", 520, 520, False, 22),
                ("Truffle Garlic Bread", 180, 180, True, 12),
                ("Penne Arbiata Pasta", 360, 360, True, 18)
            ]),
            ("Meghana Foods Koramangala", "Koramangala", 12.9352, 77.6245, "Biryani, Andhra, South Indian", 4.7, 18200, "124, 1st Cross, 5th Block, Koramangala", [
                ("Meghana Special Chicken Biryani", 350, 350, False, 18),
                ("Chilli Chicken Andhra Style", 310, 310, False, 15),
                ("Paneer Biryani", 290, 290, True, 16),
                ("Lemon Chicken", 300, 300, False, 15)
            ]),
            ("Burger House HSR", "HSR Layout", 12.9121, 77.6446, "Burgers, American, Shakes", 4.6, 2150, "52, Sector 1, HSR Layout", [
                ("Classic Smash Beef Burger", 320, 320, False, 15),
                ("Crispy Zesty Veg Burger", 220, 220, True, 12),
                ("Peri Peri Loaded Fries", 160, 160, True, 10),
                ("Belgian Chocolate Shake", 190, 190, True, 8)
            ]),
            ("Sushi World Whitefield", "Whitefield", 12.9698, 77.7499, "Japanese, Sushi, Asian", 4.8, 860, "Prestige Shantiniketan, Whitefield", [
                ("Salmon Nigiri 4pcs", 550, 550, False, 20),
                ("California Crab Maki", 480, 480, False, 18),
                ("Crispy Tempura Roll", 420, 420, True, 15),
                ("Miso Soup Bowl", 160, 160, True, 10)
            ]),
            ("Vidyarthi Bhavan Gandhi Bazaar", "Basavanagudi", 12.9438, 77.5739, "South Indian, Breakfast", 4.9, 32000, "32 Gandhi Bazaar Main Rd, Basavanagudi", [
                ("Crispy Masala Dosa", 90, 90, True, 8),
                ("Filter Coffee Strong", 40, 40, True, 5),
                ("Rava Vada 2pcs", 60, 60, True, 8),
                ("Poori Saagu Set", 85, 85, True, 10)
            ]),
            ("Truffles St Marks Road", "Church Street", 12.9729, 77.6012, "American, Burgers, Steaks", 4.7, 28000, "22 St Marks Rd, Ashok Nagar", [
                ("All American Cheese Burger", 280, 280, False, 16),
                ("Ferrero Rocher Shake", 210, 210, True, 8),
                ("Pasta Alfredo with Grilled Chicken", 340, 340, False, 18),
                ("Crispy Mozzarella Sticks", 190, 190, True, 12)
            ]),
            ("Empire Restaurant Church Street", "Church Street", 12.9744, 77.6067, "Mughlai, Kebabs, Biryani", 4.4, 15400, "36 Church Street, Shanthala Nagar", [
                ("Empire Special Ghee Rice", 170, 170, True, 10),
                ("Coin Parotta 3pcs", 75, 75, True, 8),
                ("Empire Pepper Chicken Fry", 280, 280, False, 15),
                ("Grilled Chicken Half", 290, 290, False, 20)
            ]),
            ("Corner House Ice Cream Jayanagar", "Jayanagar", 12.9250, 77.5938, "Desserts, Ice Cream", 4.9, 19500, "15, 9th Main Rd, 4th Block, Jayanagar", [
                ("Death By Chocolate Sundae", 260, 260, True, 8),
                ("Hot Fudge Nut Sundae", 210, 210, True, 8),
                ("Brownie Delight", 190, 190, True, 6),
                ("Vanilla Scoop Double", 90, 90, True, 5)
            ])
        ]
    },
    "Hyderabad": {
        "state": "Telangana",
        "restaurants": [
            ("Paradise Biryani Secunderabad", "Secunderabad", 17.4411, 78.4983, "Biryani, Hyderabadi, Mughlai", 4.6, 35000, "SD Road, Sappu Bagh, Secunderabad", [
                ("Royal Mutton Dum Biryani", 440, 440, False, 22),
                ("Special Chicken Dum Biryani", 360, 360, False, 18),
                ("Mirchi Ka Salan", 120, 120, True, 10),
                ("Double Ka Meetha", 130, 130, True, 8)
            ]),
            ("Bawarchi Restaurant Nallakunta", "RTC Cross Roads", 17.4042, 78.4984, "Hyderabadi, Biryani, Tandoor", 4.7, 42000, "RTC X Roads, Musheerabad", [
                ("Bawarchi Mutton Biryani", 410, 410, False, 20),
                ("Chicken Tangdi Kebab 4pcs", 320, 320, False, 18),
                ("Paneer Butter Masala", 250, 250, True, 14),
                ("Rumali Roti 2pcs", 40, 40, True, 6)
            ]),
            ("Shah Ghouse Gachibowli", "Gachibowli", 17.4401, 78.3489, "Hyderabadi, Haleem, Biryani", 4.6, 21000, "Near Bio Diversity Park, Gachibowli", [
                ("Shahi Mutton Haleem", 280, 280, False, 15),
                ("Special Chicken Biryani", 350, 350, False, 18),
                ("Boti Kebab", 290, 290, False, 16),
                ("Qubani Ka Meetha with Cream", 160, 160, True, 8)
            ]),
            ("Pista House Banjara Hills", "Banjara Hills", 17.4156, 78.4350, "Bakery, Sweets, Biryani", 4.7, 19000, "Road No 12, Banjara Hills", [
                ("Authentic Mutton Haleem", 290, 290, False, 12),
                ("Zafrani Mutton Biryani", 420, 420, False, 20),
                ("Osmania Biscuits Box 400g", 180, 180, True, 5),
                ("Karachi Fruit Biscuits", 210, 210, True, 5)
            ]),
            ("Chutneys Banjara Hills", "Banjara Hills", 17.4239, 78.4482, "South Indian, Pure Veg", 4.5, 14800, "Road No 3, Banjara Hills", [
                ("Steam Dosa with 6 Chutneys", 180, 180, True, 10),
                ("Babai Idli with Ghee", 140, 140, True, 8),
                ("Guntur Idli Spicy", 150, 150, True, 8),
                ("South Indian Filter Kaapi", 55, 55, True, 5)
            ]),
            ("Rayalaseema Ruchulu Jubilee Hills", "Jubilee Hills", 17.4319, 78.4073, "Andhra, Rayalaseema, Spices", 4.6, 11200, "Road No 36, Jubilee Hills", [
                ("Ragi Sankati with Natukodi Pulusu", 420, 420, False, 25),
                ("Ulavacharu Biryani", 360, 360, False, 20),
                ("Gongura Mutton Curry", 410, 410, False, 22),
                ("Prawns Iguru Andhra Style", 450, 450, False, 20)
            ]),
            ("Farzi Cafe Jubilee Hills", "Jubilee Hills", 17.4348, 78.4022, "Modern Indian, Fusion", 4.7, 8500, "Road No 59, Jubilee Hills", [
                ("Dal Chawal Arancini", 345, 345, True, 15),
                ("Braised Lamb Boti Tacos", 495, 495, False, 18),
                ("Butter Chicken Bao 3pcs", 445, 445, False, 16),
                ("Rasmalai Tres Leches", 295, 295, True, 10)
            ]),
            ("Cream Stone Madhapur", "Madhapur", 17.4485, 78.3908, "Desserts, Stone Cold Ice Cream", 4.8, 16500, "Hitec City Main Rd, Madhapur", [
                ("Willy Wonka Chocolate Stone", 260, 260, True, 10),
                ("Nutty Karat Sundae", 240, 240, True, 10),
                ("Ferrero O Nutella Jar", 280, 280, True, 8),
                ("Fruit Exotica Stone", 230, 230, True, 10)
            ]),
            ("Niloufer Cafe Red Hills", "Lakdikapul", 17.3998, 78.4645, "Irani Chai, Bakery, Fast Food", 4.9, 28000, "Old MLA Quarters Rd, Red Hills", [
                ("Special Mawa Irani Chai 2 Cups", 90, 90, True, 5),
                ("Bun Maska Fresh Churned", 60, 60, True, 5),
                ("Maskabun with Jam", 70, 70, True, 5),
                ("Dum Ke Roat 250g", 190, 190, True, 5)
            ])
        ]
    },
    "Mumbai": {
        "state": "Maharashtra",
        "restaurants": [
            ("Britannia & Co Fort", "Ballard Estate", 18.9348, 72.8384, "Parsi, Iranian, Continental", 4.8, 16200, "Wakefield House, 11 Sprott Rd, Fort", [
                ("Berry Pulao Chicken", 550, 550, False, 20),
                ("Mutton Dhansak with Brown Rice", 580, 580, False, 22),
                ("Salli Boti with Pav", 420, 420, False, 18),
                ("Caramel Custard Signature", 160, 160, True, 6)
            ]),
            ("Gajalee Seafood Vile Parle", "Vile Parle East", 19.1025, 72.8530, "Malvani, Seafood, Konkan", 4.7, 14500, "Kadambari, Hanuman Rd, Vile Parle", [
                ("Tandoori Butter Garlic Crab", 850, 850, False, 25),
                ("Surmai Fry Coastal Spices", 520, 520, False, 18),
                ("Bombil Fry Crispy 4pcs", 380, 380, False, 15),
                ("Sol Kadhi Kokum Cooler", 90, 90, True, 5)
            ]),
            ("Bademiya Colaba", "Colaba", 18.9221, 72.8329, "Mughlai, Rolls, Kebabs", 4.5, 26000, "Tulloch Rd, Behind Taj Mahal Palace, Colaba", [
                ("Chicken Baida Roti", 280, 280, False, 15),
                ("Mutton Seekh Kebab Roll", 290, 290, False, 14),
                ("Paneer Tikka Roll", 220, 220, True, 12),
                ("Chicken Bhuna Roll", 270, 270, False, 14)
            ]),
            ("Bastian Bandra", "Bandra West", 19.0601, 72.8344, "Seafood, Asian, Contemporary", 4.8, 9800, "Linking Road, Bandra West", [
                ("Bastian Lobster Roll", 950, 950, False, 20),
                ("Spicy Crab Thermidor", 850, 850, False, 22),
                ("Avocado Poke Bowl", 520, 520, True, 15),
                ("Pull-apart Garlic Bread with Burrata", 490, 490, True, 15)
            ]),
            ("Cafe Madras Matunga", "Matunga East", 19.0278, 72.8539, "South Indian, Breakfast", 4.8, 22000, "Kamachha Bldg, Bhaudaji Rd, Matunga", [
                ("Butter Podi Idli 2pcs", 95, 95, True, 6),
                ("Ragi Masala Dosa", 110, 110, True, 10),
                ("Filter Coffee Hot", 45, 45, True, 5),
                ("Upma Podi Ghee Loaded", 85, 85, True, 8)
            ]),
            ("Kyani & Co Marine Lines", "Marine Lines", 18.9439, 72.8277, "Irani Cafe, Bakery, Breakfast", 4.6, 17500, "JSS Rd, Jer Mahal Estate, Marine Lines", [
                ("Bun Maska with Irani Chai", 75, 75, True, 5),
                ("Mutton Kheema Ghotala with Pav", 240, 240, False, 12),
                ("Chicken Cheese Pattice", 65, 65, False, 5),
                ("Mawa Cake Slice", 45, 45, True, 5)
            ]),
            ("Mahesh Lunch Home Fort", "Fort", 18.9312, 72.8335, "Mangalorean, Seafood, Coastal", 4.7, 18500, "8-B Cawasji Patel St, Fort", [
                ("Mangalorean Prawn Ghee Roast", 590, 590, False, 20),
                ("Neer Dosa 3pcs", 80, 80, True, 8),
                ("Surmai Curry Mangalorean", 540, 540, False, 22),
                ("Crab Sukka Coastal", 750, 750, False, 25)
            ]),
            ("Theobroma Colaba", "Colaba Causeway", 18.9215, 72.8324, "Bakery, Patisserie, Coffee", 4.8, 19200, "Cusrow Baug, Colaba Causeway", [
                ("Overload Brownie", 125, 125, True, 5),
                ("Red Velvet Pastry", 140, 140, True, 5),
                ("Chocolate Mousse Cup", 120, 120, True, 5),
                ("Cold Brew Coffee Bottle", 160, 160, True, 5)
            ]),
            ("Sardar Refreshments Tardeo", "Tardeo", 18.9712, 72.8163, "Street Food, Pav Bhaji", 4.6, 21000, "166-A, Tardeo Rd, Junction, Mumbai", [
                ("Amul Butter Pav Bhaji", 210, 210, True, 10),
                ("Cheese Butter Pav Bhaji", 260, 260, True, 10),
                ("Extra Butter Pav Pair", 40, 40, True, 5),
                ("Fresh Mosambi Juice", 90, 90, True, 5)
            ])
        ]
    }
}

sql = []
sql.append("-- ==============================================================================")
sql.append("-- CravePulse Multi-City Realistic Seed Data (Demo Environment Only)")
sql.append("-- Cities: Bangalore, Hyderabad, Mumbai | 27 Authentic Kitchens | Full Menus")
sql.append("-- NOTE: This file is intentionally NOT executed during automated production startup.")
sql.append("-- Default password for all demo accounts: Password@123")
sql.append("-- Hash: $2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq")
sql.append("-- ==============================================================================\n")

sql.append("SET FOREIGN_KEY_CHECKS = 0;\n")

# 1. Delivery Zones
sql.append("-- 1. Delivery Zones")
sql.append("""INSERT IGNORE INTO delivery_zones (id, zone_name, city, center_lat, center_lng, radius_km, is_active, surge_multiplier) VALUES
(1, 'Central Bangalore Metro', 'Bangalore', 12.9716, 77.5946, 18.00, TRUE, 1.00),
(2, 'Indiranagar-Koramangala Corridor', 'Bangalore', 12.9560, 77.6320, 12.00, TRUE, 1.10),
(3, 'Whitefield Tech Corridor', 'Bangalore', 12.9698, 77.7499, 15.00, TRUE, 1.00),
(4, 'Hyderabad Cyberabad Tech Hub', 'Hyderabad', 17.4401, 78.3489, 15.00, TRUE, 1.05),
(5, 'Hyderabad Old City & Secunderabad', 'Hyderabad', 17.4042, 78.4984, 16.00, TRUE, 1.00),
(6, 'South Mumbai Heritage Zone', 'Mumbai', 18.9348, 72.8384, 12.00, TRUE, 1.15),
(7, 'Bandra-Andheri Western Suburbs', 'Mumbai', 19.0800, 72.8400, 16.00, TRUE, 1.10);\n""")

# 2. Users (Customers, Restaurant Partners, Riders, Admins)
sql.append("-- 2. Users (Customers, Restaurant Partners, Riders, Admins)")
sql.append("""INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role, status, avatar_url, wallet_balance) VALUES
(101, 'Ananya Sharma', 'ananya.customer@cravepulse.com', '+919811000101', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 1250.00),
(102, 'Rohan Verma', 'rohan.customer@cravepulse.com', '+919811000102', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 450.00),
(103, 'Priya Nair', 'priya.customer@cravepulse.com', '+919811000103', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 800.00),
(104, 'Vikram Deshmukh', 'vikram.customer@cravepulse.com', '+919811000104', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 2100.00),
(105, 'Kavya Reddy', 'kavya.customer@cravepulse.com', '+919811000105', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'CUSTOMER', 'ACTIVE', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 500.00),
(201, 'Karthik Rao', 'karthik.rider@cravepulse.com', '+919822000201', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RIDER', 'ACTIVE', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 2840.00),
(202, 'Syed Imran', 'imran.rider@cravepulse.com', '+919822000202', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RIDER', 'ACTIVE', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 3150.00),
(203, 'Suresh Patil', 'suresh.rider@cravepulse.com', '+919822000203', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RIDER', 'ACTIVE', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 1920.00),
(301, 'Platform Operations Lead', 'ops.admin@cravepulse.com', '+919833000301', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 150000.00);""")

# Add restaurant owner users (IDs 401 to 427)
user_inserts = []
for i in range(1, 28):
    uid = 400 + i
    user_inserts.append(f"({uid}, 'Partner Kitchen {i}', 'partner{i}@cravepulse.com', '+919844000{uid}', '$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150', 45000.00)")
sql.append("INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role, status, avatar_url, wallet_balance) VALUES\n" + ",\n".join(user_inserts) + ";\n")

# 3. Rider Profiles
sql.append("-- 3. Rider Profiles")
sql.append("""INSERT IGNORE INTO rider_profiles (id, user_id, vehicle_type, vehicle_number, driving_license, is_kyc_approved, is_online, is_available, current_latitude, current_longitude, total_deliveries, rating, wallet_balance, cash_in_hand) VALUES
(201, 201, 'Ather 450X EV', 'KA-03-EM-4821', 'DL-KA-0320190014', TRUE, TRUE, TRUE, 12.9716, 77.6350, 482, 4.9, 2840.00, 420.00),
(202, 202, 'Bajaj Chetak EV', 'TS-09-EV-1934', 'DL-TS-0920200055', TRUE, TRUE, TRUE, 17.4401, 78.3489, 521, 4.8, 3150.00, 310.00),
(203, 203, 'TVS iQube EV', 'MH-01-EL-8891', 'DL-MH-0120180092', TRUE, TRUE, TRUE, 19.0601, 72.8344, 394, 4.9, 1920.00, 150.00);\n""")

# 4. User Addresses
sql.append("-- 4. Customer Addresses across 3 Cities")
sql.append("""INSERT IGNORE INTO user_addresses (id, user_id, title, address_line, landmark, city, state, postal_code, latitude, longitude, is_default) VALUES
(101, 101, 'Home', 'Penthouse 12B, Regency Heights, 12th Main Road, Indiranagar', 'Near 100ft Road Metro', 'Bangalore', 'Karnataka', '560038', 12.9784, 77.6408, TRUE),
(102, 102, 'Home', 'Flat 402, Oakwood Apartments, 5th Block, Koramangala', 'Near Sony Signal', 'Bangalore', 'Karnataka', '560095', 12.9352, 77.6245, TRUE),
(103, 103, 'Work', 'Tower 3, Level 7, Cyber Gateway, Hitec City', 'Opposite Cyber Towers', 'Hyderabad', 'Telangana', '500081', 17.4485, 78.3908, TRUE),
(104, 104, 'Home', 'Apt 8A, Sea Breeze Towers, Perry Cross Road, Bandra West', 'Near Carter Road Promenade', 'Mumbai', 'Maharashtra', '400050', 19.0601, 72.8344, TRUE),
(105, 105, 'Home', 'Plot 44, Road No 12, Banjara Hills', 'Near MLA Colony', 'Hyderabad', 'Telangana', '500034', 17.4156, 78.4350, TRUE);\n""")

# 5. Restaurants, Categories & Menu Items
sql.append("-- 5. Restaurants across Bangalore, Hyderabad, Mumbai with Full Menus")

rest_id = 100
cat_id = 100
item_id = 500

rest_rows = []
cat_rows = []
item_rows = []
hours_rows = []

for city_name, city_info in CITIES.items():
    state = city_info["state"]
    for r in city_info["restaurants"]:
        rest_id += 1
        owner_id = 300 + (rest_id - 100)
        name, loc, lat, lng, cuisine, rating, reviews, addr, dishes = r
        slug = slugify(name)
        banner = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200"
        logo = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200"
        fssai = f"FSSAI-{rest_id}88992211"
        phone = f"+919800{rest_id:04d}"
        email = f"contact@{slug[:15]}.com"
        pure_veg = all(d[3] for d in dishes)
        
        rest_rows.append(f"({rest_id}, {owner_id}, '{name}', '{slug}', 'Authentic curated dining from {loc}, {city_name}. Fresh ingredients and radical price parity.', '{banner}', '{logo}', '{phone}', '{email}', '{cuisine}', {rating}, {reviews}, {'TRUE' if pure_veg else 'FALSE'}, '$$', 20, 35, {lat}, {lng}, '{addr}, {city_name}', '{fssai}', 15.00, 25, 3, TRUE, FALSE, TRUE)")
        
        # Operating hours Monday-Sunday
        for day in range(1, 8):
            hours_rows.append(f"({rest_id}, {day}, '09:00:00', '23:00:00', FALSE)")
            
        cat_id += 1
        cat_rows.append(f"({cat_id}, {rest_id}, 'House Specials & Classics', 1, TRUE)")
        
        for dish in dishes:
            item_id += 1
            d_name, dine_in, plat, is_v, prep = dish
            d_img = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" if is_v else "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500"
            desc = f"Handcrafted {d_name} freshly cooked using traditional regional spices and premium pantry ingredients."
            item_rows.append(f"({item_id}, {rest_id}, {cat_id}, '{d_name}', '{desc}', '{d_img}', {dine_in:.2f}, {plat:.2f}, {'TRUE' if is_v else 'FALSE'}, TRUE, {prep}, 450, 4.8, 120)")

sql.append("INSERT IGNORE INTO restaurant_profiles (id, user_id, name, slug, description, banner_image, logo_image, phone, email, cuisine_types, rating, total_reviews, pure_veg, price_tier, prep_time_min, prep_time_max, latitude, longitude, address, fssai_license, commission_rate, max_concurrent_orders, current_load, is_open, is_auto_throttled, is_kyc_approved) VALUES\n" + ",\n".join(rest_rows) + ";\n")

sql.append("INSERT IGNORE INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed) VALUES\n" + ",\n".join(hours_rows) + ";\n")

sql.append("INSERT IGNORE INTO menu_categories (id, restaurant_id, name, display_order, is_active) VALUES\n" + ",\n".join(cat_rows) + ";\n")

sql.append("INSERT IGNORE INTO menu_items (id, restaurant_id, category_id, name, description, image_url, dine_in_price, platform_price, is_veg, is_available, prep_time_minutes, calorie_count, rating, total_orders) VALUES\n" + ",\n".join(item_rows) + ";\n")

# 6. Coupons
sql.append("-- 6. Coupons & Discounts")
sql.append("""INSERT IGNORE INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, times_used, is_active, first_order_only) VALUES
(101, 'WELCOME100', 'Flat Rs.100 off on your inaugural CravePulse order', 'FLAT', 100.00, 299.00, 100.00, 10000, 421, TRUE, TRUE),
(102, 'FOOD50', '50% off up to Rs.120 across all partner kitchens', 'PERCENTAGE', 50.00, 199.00, 120.00, 50000, 1840, TRUE, FALSE),
(103, 'FREESHIP', 'Free zero-fee delivery on orders above Rs.349', 'FLAT', 35.00, 349.00, 35.00, 20000, 950, TRUE, FALSE),
(104, 'BANGALORE20', '20% off up to Rs.80 on curated Bangalore culinary icons', 'PERCENTAGE', 20.00, 249.00, 80.00, 15000, 320, TRUE, FALSE),
(105, 'HYDHERITAGE', 'Flat Rs.75 off on authentic Hyderabadi Dum Biryani & Haleem', 'FLAT', 75.00, 399.00, 75.00, 10000, 510, TRUE, FALSE),
(106, 'MUMBAIBITES', '25% off up to Rs.100 on Mumbai coastal seafood & street food', 'PERCENTAGE', 25.00, 299.00, 100.00, 10000, 275, TRUE, FALSE);\n""")

# 7. Historical Orders across DELIVERED, OUT_FOR_DELIVERY, PREPARING, PLACED
sql.append("-- 7. Historical Orders with Full Financials, Payments, Dispatches, and Reviews")
sql.append("""INSERT IGNORE INTO orders (id, order_number, customer_id, restaurant_id, rider_id, delivery_address_id, status, subtotal, restaurant_discount, coupon_id, coupon_discount, packaging_fee, delivery_fee, platform_fee, gst_tax, tip_amount, total_amount, payment_mode, payment_status, delivery_otp, eta_min_minutes, eta_max_minutes, created_at) VALUES
(2001, 'CP-BLR-2026-001', 101, 101, 201, 101, 'DELIVERED', 620.00, 0.00, 102, 120.00, 15.00, 35.00, 5.00, 25.75, 30.00, 610.75, 'RAZORPAY', 'PAID', '4821', 25, 35, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2002, 'CP-BLR-2026-002', 102, 103, 201, 102, 'DELIVERED', 660.00, 0.00, 101, 100.00, 15.00, 35.00, 5.00, 28.75, 20.00, 663.75, 'RAZORPAY', 'PAID', '3192', 20, 30, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2003, 'CP-HYD-2026-003', 103, 110, 202, 103, 'DELIVERED', 800.00, 0.00, 105, 75.00, 15.00, 35.00, 5.00, 37.75, 50.00, 867.75, 'RAZORPAY', 'PAID', '9041', 25, 35, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(2004, 'CP-BOM-2026-004', 104, 119, 203, 104, 'DELIVERED', 1130.00, 0.00, 106, 100.00, 15.00, 35.00, 5.00, 52.25, 50.00, 1187.25, 'RAZORPAY', 'PAID', '7218', 30, 40, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2005, 'CP-BLR-2026-005', 101, 102, 201, 101, 'OUT_FOR_DELIVERY', 940.00, 0.00, 103, 35.00, 15.00, 35.00, 5.00, 46.00, 20.00, 1026.00, 'RAZORPAY', 'PAID', '5521', 25, 35, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(2006, 'CP-HYD-2026-006', 105, 113, 202, 105, 'PREPARING', 570.00, 0.00, NULL, 0.00, 15.00, 35.00, 5.00, 29.25, 0.00, 654.25, 'COD', 'PENDING', '1182', 30, 40, DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(2007, 'CP-BOM-2026-007', 104, 122, NULL, 104, 'PLACED', 1470.00, 0.00, NULL, 0.00, 15.00, 35.00, 5.00, 74.25, 30.00, 1629.25, 'RAZORPAY', 'PAID', '8834', 35, 45, DATE_SUB(NOW(), INTERVAL 4 MINUTE));\n""")

# 8. Order Items
sql.append("-- 8. Order Items")
sql.append("""INSERT IGNORE INTO order_items (id, order_id, menu_item_id, item_name, unit_price, quantity, total_price) VALUES
(3001, 2001, 501, 'Paneer Butter Masala', 280.00, 1, 280.00),
(3002, 2001, 502, 'Hyderabadi Chicken Biryani', 340.00, 1, 340.00),
(3003, 2002, 510, 'Meghana Special Chicken Biryani', 350.00, 1, 350.00),
(3004, 2002, 511, 'Chilli Chicken Andhra Style', 310.00, 1, 310.00),
(3005, 2003, 538, 'Royal Mutton Dum Biryani', 440.00, 1, 440.00),
(3006, 2003, 539, 'Special Chicken Dum Biryani', 360.00, 1, 360.00),
(3007, 2004, 574, 'Berry Pulao Chicken', 550.00, 1, 550.00),
(3008, 2004, 575, 'Mutton Dhansak with Brown Rice', 580.00, 1, 580.00),
(3009, 2005, 506, 'Woodfired Margherita Pizza', 420.00, 1, 420.00),
(3010, 2005, 507, 'Smoky BBQ Chicken Pizza', 520.00, 1, 520.00),
(3011, 2006, 550, 'Authentic Mutton Haleem', 290.00, 1, 290.00),
(3012, 2006, 551, 'Zafrani Mutton Biryani', 280.00, 1, 280.00),
(3013, 2007, 586, 'Bastian Lobster Roll', 950.00, 1, 950.00),
(3014, 2007, 588, 'Avocado Poke Bowl', 520.00, 1, 520.00);\n""")

# 9. Payments
sql.append("-- 9. Payments Ledger")
sql.append("""INSERT IGNORE INTO payments (id, order_id, payment_mode, razorpay_order_id, razorpay_payment_id, amount, status) VALUES
(4001, 2001, 'RAZORPAY', 'order_demo_2001', 'pay_demo_2001', 610.75, 'SUCCESS'),
(4002, 2002, 'RAZORPAY', 'order_demo_2002', 'pay_demo_2002', 663.75, 'SUCCESS'),
(4003, 2003, 'RAZORPAY', 'order_demo_2003', 'pay_demo_2003', 867.75, 'SUCCESS'),
(4004, 2004, 'RAZORPAY', 'order_demo_2004', 'pay_demo_2004', 1187.25, 'SUCCESS'),
(4005, 2005, 'RAZORPAY', 'order_demo_2005', 'pay_demo_2005', 1026.00, 'SUCCESS'),
(4006, 2006, 'COD', NULL, NULL, 654.25, 'PENDING'),
(4007, 2007, 'RAZORPAY', 'order_demo_2007', 'pay_demo_2007', 1629.25, 'SUCCESS');\n""")

# 10. Delivery Dispatches
sql.append("-- 10. Delivery Dispatches")
sql.append("""INSERT IGNORE INTO delivery_dispatches (id, order_id, rider_id, dispatch_status, base_pay, distance_pay, surge_pay, tip_amount, total_earning, wait_time_minutes, wait_time_pay) VALUES
(5001, 2001, 201, 'ACCEPTED', 35.00, 18.00, 0.00, 30.00, 83.00, 4, 0.00),
(5002, 2002, 201, 'ACCEPTED', 35.00, 14.00, 0.00, 20.00, 69.00, 2, 0.00),
(5003, 2003, 202, 'ACCEPTED', 35.00, 22.00, 10.00, 50.00, 117.00, 6, 12.00),
(5004, 2004, 203, 'ACCEPTED', 35.00, 16.00, 15.00, 50.00, 116.00, 3, 0.00),
(5005, 2005, 201, 'ACCEPTED', 35.00, 15.00, 5.00, 20.00, 75.00, 0, 0.00);\n""")

# 11. Multi-Dimensional Reviews
sql.append("-- 11. Customer Reviews")
sql.append("""INSERT IGNORE INTO reviews (id, order_id, customer_id, restaurant_id, rider_id, food_rating, packaging_rating, delivery_rating, review_text) VALUES
(6001, 2001, 101, 101, 201, 5, 5, 5, 'Superb authentic flavours. Paneer was melt-in-mouth and the delivery was lightning fast. Great price parity!'),
(6002, 2002, 102, 103, 201, 5, 4, 5, 'The legendary Meghana Biryani never disappoints. Steaming hot and generous chicken portions.'),
(6003, 2003, 103, 110, 202, 5, 5, 5, 'Best Royal Dum Biryani in Hyderabad! Perfectly seasoned basmati rice and tender lamb.'),
(6004, 2004, 104, 119, 203, 5, 5, 5, 'Iconic Berry Pulao from Britannia! Arrived in leak-proof packaging within 30 minutes.');\n""")

# 12. Support Tickets
sql.append("-- 12. Support Tickets")
sql.append("""INSERT IGNORE INTO support_tickets (id, ticket_number, user_id, order_id, category, subject, description, status, priority, resolution_notes) VALUES
(7001, 'TICK-2026-001', 102, 2002, 'ORDER_INQUIRY', 'Extra cutlery request', 'Requested eco-friendly cutlery for office lunch delivery.', 'RESOLVED', 'LOW', 'Cutlery added and confirmed with restaurant partner.'),
(7002, 'TICK-2026-002', 101, 2005, 'DELIVERY_ETA', 'Delivery location pin check', 'Confirming delivery address landmark near Indiranagar 100ft road.', 'OPEN', 'MEDIUM', NULL);\n""")

# 13. Customer Favorites
sql.append("-- 13. Customer Favorites")
sql.append("""INSERT IGNORE INTO favorites (id, user_id, restaurant_id) VALUES
(8001, 101, 101),
(8002, 101, 102),
(8003, 102, 103),
(8004, 103, 110),
(8005, 104, 119),
(8006, 104, 122);\n""")

# 14. Coupon Usages
sql.append("-- 14. Coupon Usages")
sql.append("""INSERT IGNORE INTO coupon_usages (id, user_id, coupon_id, order_id, discount_applied) VALUES
(9001, 101, 102, 2001, 120.00),
(9002, 102, 101, 2002, 100.00),
(9003, 103, 105, 2003, 75.00),
(9004, 104, 106, 2004, 100.00),
(9005, 101, 103, 2005, 35.00);\n""")

sql.append("SET FOREIGN_KEY_CHECKS = 1;\n")

content = "\n".join(sql)
with open("c:/Users/ragip/OneDrive/Desktop/100_Days_Full_Stack_Dev_Challenge/Food_delivery_application/backend/src/main/resources/db/seed-demo.sql", "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated seed-demo.sql successfully with {len(sql)} SQL blocks.")
