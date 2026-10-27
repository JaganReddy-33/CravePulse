import json
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

# 52 Authentic Bangalore Restaurants
# Spanning Indiranagar, Koramangala, Jayanagar, Malleshwaram, Church Street, HSR Layout, Whitefield, Basavanagudi, Frazer Town, Kalyan Nagar
RESTAURANTS_DATA = [
    # Indiranagar
    {
        "name": "Meghana Foods Indiranagar",
        "locality": "Indiranagar",
        "landmark": "Near 100ft Road Metro",
        "pincode": "560038",
        "lat": 12.9784, "lng": 77.6408,
        "address": "544, 1st Cross, CMH Road, Indiranagar, Bengaluru",
        "cuisine": "Biryani, Andhra, South Indian, Seafood",
        "rating": 4.6, "reviews": 18450, "pure_veg": False, "price_tier": "$$", "cost_for_two": 600,
        "phone": "+918025219999", "email": "indiranagar@meghanafoods.co.in", "banner": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200",
        "dishes": [
            ("Meghana Special Chicken Biryani", "Signature spicy Andhra style biryani with marinated boneless chicken chunks layered with fragrant long-grain basmati.", 340, "NON_VEG", "SPICY", "Gluten", True, True, 20),
            ("Meghana Special Mutton Biryani", "Slow cooked tender succulent mutton pieces steeped in fiery Guntur chili spices and royal saffron basmati.", 420, "NON_VEG", "SPICY", "Gluten", True, True, 25),
            ("Paneer Biryani", "Fresh malai paneer cubes tossed in house-secret Andhra masala layered over fragrant ghee rice.", 290, "VEG", "MEDIUM", "Dairy", True, False, 18),
            ("Chicken 65 (Boneless)", "Deep fried crunchy boneless chicken morsels tempered with curry leaves, slit green chillies, and yogurt.", 310, "NON_VEG", "SPICY", "Eggs", True, False, 15),
            ("Chilli Chicken Andhra Style", "Authentic green-chilli spiked shredded chicken stir-fried with onions and southern aromatics.", 310, "NON_VEG", "EXTRA_SPICY", "Soy", True, False, 15),
            ("Apollo Fish", "Fresh river sole fillets tossed in spicy spiced curd sauce with curry leaves and crushed garlic.", 360, "NON_VEG", "MEDIUM", "Fish", False, False, 18),
            ("Guntur Chicken Curry", "Fiery chicken gravy prepared with sun-dried Guntur chillies, poppy seeds, and fresh grated coconut.", 320, "NON_VEG", "EXTRA_SPICY", "Nuts", False, False, 20),
            ("Pappu Charu with Rice", "Traditional Andhra tangy spiced lentil broth served with piping hot steamed sona masoori and ghee.", 180, "VEG", "MEDIUM", "None", False, False, 12),
            ("Gongura Mutton Curry", "Tender mutton chunks slow-cooked with sour and tangy sorrel leaves and country spices.", 430, "NON_VEG", "SPICY", "None", True, True, 25),
            ("Meghana Special Veg Biryani", "Farm-fresh vegetables, baby corn, florets, and paneer cubes cooked in dum style with mint and browned onions.", 260, "VEG", "MEDIUM", "Dairy", False, False, 18),
            ("Crispy Corn Pepper Fry", "Sweet corn kernels tossed with crushed black pepper, sea salt, spring onions, and garlic flakes.", 230, "VEG", "MILD", "Gluten", False, False, 12),
            ("Egg Biryani", "Hard-boiled golden seared eggs nestled in aromatic seasoned basmati rice served with mirchi ka salan.", 250, "EGG", "MEDIUM", "Eggs", False, False, 15),
            ("Curd Rice Andhra Style", "Creamy tempered yogurt rice with mustard seeds, pomegranate arils, roasted cashews, and ginger.", 150, "VEG", "MILD", "Dairy", False, False, 10),
            ("Chicken Lollipops (6 Pcs)", "Frenched chicken winglets coated in spicy red batter, deep-fried crisp, served with hot garlic dip.", 320, "NON_VEG", "MEDIUM", "Eggs, Gluten", True, False, 16),
            ("Lemon Chicken", "Tender pan-seared chicken bits laced with freshly squeezed nimbu juice and cracked black pepper.", 300, "NON_VEG", "MILD", "None", False, False, 15),
            ("Prawns Biryani", "Juicy ocean prawns sautéed in caramelized onions and spices, layered with royal fragrant basmati rice.", 450, "NON_VEG", "MEDIUM", "Crustacean", True, True, 22)
        ]
    },
    {
        "name": "Toit Brewpub Indiranagar",
        "locality": "Indiranagar",
        "landmark": "100 Feet Road, Near Domlur Flyover",
        "pincode": "560038",
        "lat": 12.9793, "lng": 77.6403,
        "address": "298, 100 Feet Rd, Near KFC Signal, Indiranagar, Bengaluru",
        "cuisine": "Pizza, Burgers, Continental, European",
        "rating": 4.7, "reviews": 24300, "pure_veg": False, "price_tier": "$$$", "cost_for_two": 1200,
        "phone": "+919019713388", "email": "brewery@toit.in", "banner": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200",
        "dishes": [
            ("Toit Baked Nachos", "Crisp tortilla chips baked with cheddar, refried beans, pickled jalapeños, salsa, and sour cream.", 325, "VEG", "MILD", "Dairy", True, False, 15),
            ("Wood-Fired Margherita Pizza", "San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil leaves, and cold-pressed extra virgin olive oil.", 450, "VEG", "MILD", "Dairy, Gluten", True, False, 20),
            ("Smoky BBQ Chicken Pizza", "Mesquite smoked chicken breast, house barbecue reduction, caramelised onions, and aged mozzarella.", 525, "NON_VEG", "MEDIUM", "Dairy, Gluten", True, True, 20),
            ("Toit Beef Chilli (Buffalo)", "Tender strips of seasoned buffalo meat tossed with green chillies, garlic pods, and dark soy reduction.", 420, "NON_VEG", "SPICY", "Soy", True, True, 18),
            ("Beer Battered Fish & Chips", "Golden ale battered bhetki fillets served with hand-cut sea salted fries and house tartare sauce.", 510, "NON_VEG", "MILD", "Fish, Gluten", True, False, 20),
            ("Truffled Wild Mushroom Risotto", "Arborio rice simmered in white wine broth with porcini and cremini mushrooms, topped with shaved parmesan.", 480, "VEG", "MILD", "Dairy", False, True, 22),
            ("Spicy Chicken Wings", "Crispy fried jumbo wings glazed in hot habanero butter glaze served with creamy blue cheese dip.", 390, "NON_VEG", "SPICY", "Dairy", True, False, 16),
            ("Pepperoni & Bacon Pizza", "Imported pork pepperoni slices, crisp bacon strips, mozzarella, and chili-infused organic honey.", 620, "NON_VEG", "MEDIUM", "Pork, Dairy, Gluten", True, True, 22),
            ("Quattro Formaggi Pizza", "Four cheese white base pizza with mozzarella, gorgonzola, provolone, and parmesan.", 540, "VEG", "MILD", "Dairy, Gluten", False, False, 20),
            ("Crispy Calamari Rings", "Squid rings coated in spiced semolina crust, flash fried, served with roasted garlic aioli.", 440, "NON_VEG", "MILD", "Mollusc, Gluten", False, False, 15),
            ("Classic Caesar Salad", "Crisp romaine hearts, sourdough herb croutons, crispy bacon bites, parmesan shavings, and house dressing.", 360, "NON_VEG", "MILD", "Eggs, Dairy, Gluten", False, False, 12),
            ("Dark Chocolate Mud Cake", "Decadent warm Belgian dark chocolate cake with molten center and vanilla bean whipped ganache.", 290, "VEG", "MILD", "Dairy, Gluten", True, False, 10),
            ("Pulled Pork Sliders (3 Pcs)", "Braised pulled pork tossed in cider vinegar BBQ sauce topped with crisp apple slaw in brioche buns.", 460, "NON_VEG", "MEDIUM", "Pork, Gluten", False, False, 18),
            ("Stir-Fried Butter Garlic Prawns", "Jumbo ocean prawns sautéed in roasted garlic butter with crushed red chillies and Italian parsley.", 540, "NON_VEG", "MILD", "Crustacean, Dairy", True, False, 16),
            ("Loaded Potato Wedges", "Golden skin-on potato wedges smothered in melted queso, smoky bacon bits, and chopped chives.", 310, "NON_VEG", "MILD", "Dairy", False, False, 14)
        ]
    },
    {
        "name": "The Rameshwaram Cafe Indiranagar",
        "locality": "Indiranagar",
        "landmark": "12th Main Road, HAL 2nd Stage",
        "pincode": "560038",
        "lat": 12.9721, "lng": 77.6415,
        "address": "2984, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
        "cuisine": "South Indian, Pure Veg, Street Food, Filter Coffee",
        "rating": 4.5, "reviews": 32100, "pure_veg": True, "price_tier": "$", "cost_for_two": 300,
        "phone": "+918045689000", "email": "indiranagar@rameshwaramcafe.org", "banner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200",
        "dishes": [
            ("Ghee Podi Thatte Idli", "Giant steamed thatte idli drenched in aromatic pure desi ghee and coated with spicy gun powder.", 110, "VEG", "MEDIUM", "Dairy", True, True, 8),
            ("Ghee Podi Masala Dosa", "Crispy golden fermented rice crepe smeared with red garlic chutney, spiced potato filling, and copious hot ghee.", 140, "VEG", "MEDIUM", "Dairy", True, True, 12),
            ("Open Butter Dosa", "Thick spongy dosa smeared with rich spicy chutney and crowned with a giant pat of country butter.", 130, "VEG", "MEDIUM", "Dairy", True, False, 10),
            ("Ghee Podi Button Idli (14 Pcs)", "Bite sized miniature idlis floating in aromatic sambar, coated with ghee and roasted lentil podi.", 120, "VEG", "MEDIUM", "Dairy", True, False, 8),
            ("Medu Vada (2 Pcs)", "Deep fried crispy golden lentil doughnuts flavored with whole peppercorns, fresh ginger, and coconut bits.", 80, "VEG", "MILD", "None", True, False, 8),
            ("Rava Masala Dosa", "Crispy lattice patterned semolina crepe laced with crushed cumin, green chillies, and cashew nuts.", 135, "VEG", "MEDIUM", "Dairy, Nuts", False, False, 14),
            ("Khara Bath", "Spiced semolina upma cooked with vegetables, mustard seeds, and rich aromatic clarified butter.", 75, "VEG", "MEDIUM", "Dairy", False, False, 8),
            ("Kesari Bath", "Sweet saffron-infused semolina halwa cooked in ghee with golden raisins and fried cashews.", 75, "VEG", "MILD", "Dairy, Nuts", True, False, 8),
            ("Pongal with Ghee", "Melt-in-mouth rice and moong dal porridge tempered with black pepper, fresh ginger, and cashew nuts.", 100, "VEG", "MILD", "Dairy, Nuts", True, False, 10),
            ("Curd Vada (2 Pcs)", "Crispy medu vadas soaked in chilled seasoned curd garnished with boondi, coriander, and roasted cumin.", 95, "VEG", "MILD", "Dairy", False, False, 8),
            ("Filter Coffee (Double Shot)", "Authentic South Indian chicory blend coffee frothed with boiled full-cream milk in brass dabara.", 45, "VEG", "MILD", "Dairy", True, True, 5),
            ("Badam Milk (Hot)", "Rich saffron almond milk infused with crushed cardamom, pistachios, and almond slivers.", 65, "VEG", "MILD", "Dairy, Nuts", False, False, 6),
            ("Ghee Onion Uttapam", "Thick rice batter pancake topped with caramelized red onions, green chillies, and fragrant ghee.", 125, "VEG", "MEDIUM", "Dairy", False, False, 12),
            ("Bisibelebath", "Classic Karnataka spicy rice, lentil, and vegetable mash topped with crisp boondi and a spoon of hot ghee.", 110, "VEG", "MEDIUM", "Dairy", True, False, 10),
            ("Podi Masala Vada (2 Pcs)", "Crunchy chana dal spiced patties topped with spicy podi and cold coconut chutney.", 85, "VEG", "MEDIUM", "None", False, False, 8)
        ]
    },
    {
        "name": "Dum Safar Biryani Indiranagar",
        "locality": "Indiranagar",
        "landmark": "100 Feet Road, Near Domlur Signal",
        "pincode": "560038",
        "lat": 12.9691, "lng": 77.6392,
        "address": "639, 100 Feet Rd, Indiranagar, Bengaluru",
        "cuisine": "Biryani, North Indian, Mughlai, Kebabs",
        "rating": 4.4, "reviews": 8900, "pure_veg": False, "price_tier": "$$", "cost_for_two": 650,
        "phone": "+918049652000", "email": "order@dumsafar.com", "banner": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200",
        "dishes": [
            ("Dum Safar Murgh Biryani", "Aromatic slow dum-cooked chicken biryani infused with kewra water, saffron strands, and roasted spices.", 349, "NON_VEG", "MEDIUM", "Dairy", True, True, 20),
            ("Awadhi Gosht Dum Biryani", "Mutton shank marinated in papaya paste and royal Awadhi spices, layered with aged basmati in sealed clay pot.", 449, "NON_VEG", "MEDIUM", "Dairy", True, True, 25),
            ("Subz E Khas Biryani", "Garden vegetables, baby potatoes, and paneer cubes cooked in rich curd marinade with long-grain rice.", 279, "VEG", "MILD", "Dairy", False, False, 18),
            ("Murgh Angaar Kebab (6 Pcs)", "Charcoal grilled fiery boneless chicken pieces infused with smoked red chili paste and mustard oil.", 329, "NON_VEG", "SPICY", "Dairy", True, False, 18),
            ("Galouti Kebab with Paratha", "Melt-in-mouth smoked lamb patties infused with 32 secret spices, served with mini saffron sheermal.", 419, "NON_VEG", "MEDIUM", "Dairy, Gluten", True, True, 20),
            ("Dahi Ke Kebab (6 Pcs)", "Velvety hung curd patties seasoned with chopped coriander, green chillies, and mint, pan-fried to crisp perfection.", 269, "VEG", "MILD", "Dairy, Gluten", False, False, 15),
            ("Paneer Tikka Zaffrani", "Creamy cottage cheese cubes marinated in saffron yogurt cream, bell peppers, and carom seeds.", 299, "VEG", "MEDIUM", "Dairy", True, False, 16),
            ("Murgh Makhani (Butter Chicken)", "Tandoori chicken pulled and simmered in velvety smooth tomato, butter, and cashew nut gravy.", 359, "NON_VEG", "MILD", "Dairy, Nuts", True, True, 18),
            ("Dal Dum Safar", "Rich slow-simmered black lentils cooked overnight on clay oven with cultured butter and fresh cream.", 259, "VEG", "MILD", "Dairy", True, False, 15),
            ("Garlic Naan", "Tandoori flatbread studded with minced garlic and chopped coriander brushed with melted butter.", 69, "VEG", "MILD", "Dairy, Gluten", False, False, 8),
            ("Gulab Jamun with Rabdi (2 Pcs)", "Warm khoya dumplings soaked in rose syrup served over chilled saffron pistachio rabdi.", 149, "VEG", "MILD", "Dairy, Nuts", True, False, 6),
            ("Shahi Tukda", "Crispy ghee-fried bread triangles soaked in fragrant sugar syrup and topped with condensed saffron milk.", 159, "VEG", "MILD", "Dairy, Gluten, Nuts", False, False, 8),
            ("Bhuna Gosht", "Tender goat meat cubes stir-fried on iron griddle with whole spices, browned onions, and thick masala.", 439, "NON_VEG", "SPICY", "None", True, False, 22),
            ("Raita & Salan Combo", "Classic boondi burani raita paired with traditional Hyderabadi spicy peanut and sesame salan.", 89, "VEG", "MEDIUM", "Dairy, Peanuts", False, False, 5),
            ("Firni Dum Safar", "Traditional Kashmiri ground rice pudding flavored with green cardamom and saffron, set in earthen pots.", 129, "VEG", "MILD", "Dairy, Nuts", False, False, 6)
        ]
    },
    {
        "name": "Nagarjuna Indiranagar",
        "locality": "Indiranagar",
        "landmark": "Near Double Road Signal, 100ft Road",
        "pincode": "560038",
        "lat": 12.9712, "lng": 77.6365,
        "address": "195, Double Rd, Stage 2, Indiranagar, Bengaluru",
        "cuisine": "Andhra, South Indian, Biryani, Spicy Curries",
        "rating": 4.5, "reviews": 16200, "pure_veg": False, "price_tier": "$$", "cost_for_two": 700,
        "phone": "+918025265555", "email": "indiranagar@nagarjunarestaurants.com", "banner": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200",
        "dishes": [
            ("Nagarjuna Andhra Meals (Non-Veg)", "Unlimited banana leaf spread: rice, pappu, sambar, rasam, kootu, vepudu, curd, ghee, and gun powder.", 280, "NON_VEG", "SPICY", "Dairy", True, True, 12),
            ("Andhra Chilli Chicken", "The original fiery green chilli and ginger chicken fry that made Nagarjuna iconic.", 325, "NON_VEG", "EXTRA_SPICY", "None", True, True, 16),
            ("Chicken Sholay Kebab", "Crispy battered boneless chicken strips tossed with curry leaves, crushed chillies, and beaten curd.", 335, "NON_VEG", "SPICY", "Eggs, Dairy", True, False, 16),
            ("Nagarjuna Roast Mutton", "Boneless baby goat cubes pan-roasted in black pepper, garlic, and caramelized shallots.", 445, "NON_VEG", "SPICY", "None", True, True, 22),
            ("Annavaram Chicken Biryani", "Mildly spiced fragrant seeraga samba rice cooked with tender farm chicken in Andhra home style.", 330, "NON_VEG", "MEDIUM", "Dairy", True, False, 18),
            ("Guntur Royyalu (Prawn Fry)", "Fresh tiger prawns tossed in sun-dried chilli paste and toasted cumin until dry and aromatic.", 460, "NON_VEG", "SPICY", "Crustacean", True, False, 20),
            ("Nethili Fish Fry", "Crisp fried anchovies marinated in red chilli paste, lemon juice, and rice flour.", 295, "NON_VEG", "MEDIUM", "Fish", False, False, 14),
            ("Tomato Pappu with Ghee", "Homestyle Andhra yellow dal simmered with ripe tomatoes, garlic, and fresh green chillies.", 160, "VEG", "MEDIUM", "Dairy", False, False, 10),
            ("Mushroom Pepper Fry", "Button mushrooms stir-fried on cast iron with crushed Tellicherry black peppercorns and curry leaves.", 250, "VEG", "MEDIUM", "None", False, False, 14),
            ("Alu Dum Andhra", "Baby potatoes braised in tangy tamarind and toasted sesame seed gravy.", 210, "VEG", "MEDIUM", "Sesame", False, False, 14),
            ("Kodi Vepudu (Chicken Fry)", "Dry fried spicy chicken morsels with onions, garlic, and authentic Andhra garam masala.", 320, "NON_VEG", "SPICY", "None", True, False, 18),
            ("Nagarjuna Special Biryani Rice", "Fragrant saffron and ghee infused biryani rice served with spicy gravy and onion pachadi.", 190, "NON_VEG", "MEDIUM", "Dairy", False, False, 10),
            ("Majiga Pulusu", "Traditional Andhra spiced buttermilk stew tempered with mustard, fenugreek, and ginger.", 130, "VEG", "MILD", "Dairy", False, False, 8),
            ("Carrot Halwa with Khoya", "Fresh grated Ooty red carrots cooked in pure ghee, whole milk, and dry fruits.", 140, "VEG", "MILD", "Dairy, Nuts", True, False, 6),
            ("Double Ka Meetha", "Crispy ghee-fried bread soaked in rich saffron syrup, condensed cardamom milk, and silver vark.", 150, "VEG", "MILD", "Dairy, Gluten, Nuts", False, False, 8)
        ]
    },
    {
        "name": "Glen's Bakehouse Indiranagar",
        "locality": "Indiranagar",
        "landmark": "Near Defence Colony, 80 Feet Road",
        "pincode": "560038",
        "lat": 12.9765, "lng": 77.6378,
        "address": "297, 100 Feet Rd, Defence Colony, Indiranagar, Bengaluru",
        "cuisine": "Bakery, Desserts, Italian, Cafe, Breakfast",
        "rating": 4.6, "reviews": 19800, "pure_veg": False, "price_tier": "$$", "cost_for_two": 600,
        "phone": "+918041229898", "email": "glens@glensbakehouse.com", "banner": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200",
        "dishes": [
            ("Mini Red Velvet Cupcakes (6 Pcs)", "The legendary signature Glen's miniature red velvet cupcakes crowned with velvety cream cheese frosting.", 180, "VEG", "MILD", "Dairy, Gluten", True, True, 5),
            ("Almond Croissant", "Twice-baked flaky butter croissant filled with frangipane almond cream and topped with toasted almond flakes.", 140, "VEG", "MILD", "Dairy, Gluten, Nuts", True, False, 6),
            ("Wood-Fired Thin Crust Farmhouse Pizza", "Crisp base topped with roasted zucchini, bell peppers, button mushrooms, olives, and mozzarella.", 390, "VEG", "MILD", "Dairy, Gluten", False, False, 20),
            ("Creamy Alfredo Chicken Pasta", "Penne pasta tossed in rich parmesan garlic cream sauce with grilled herb chicken strips.", 380, "NON_VEG", "MILD", "Dairy, Gluten", True, False, 18),
            ("Belgian Dark Chocolate Tart", "Rich 70% dark Belgian chocolate ganache in a crisp buttery sablé pastry shell.", 170, "VEG", "MILD", "Dairy, Gluten", True, True, 5),
            ("Roast Chicken & Mustard Sandwich", "Shredded roast chicken breast, Dijon mustard mayo, and crisp lettuce in house-baked sourdough.", 260, "NON_VEG", "MILD", "Gluten, Mustard", True, False, 12),
            ("Classic Blueberry Cheesecake", "New York style baked cream cheese cake topped with sweet and tart Canadian blueberry compote.", 220, "VEG", "MILD", "Dairy, Gluten", True, False, 5),
            ("Cinnamon Bun with Cream Glaze", "Warm fluffy cinnamon spiced swirl brioche smothered in sweet vanilla cream cheese frosting.", 120, "VEG", "MILD", "Dairy, Gluten", False, False, 6),
            ("Spicy Arrabiata Pasta", "Al dente penne pasta tossed in fiery crushed tomato sauce with garlic, red pepper flakes, and fresh basil.", 320, "VEG", "MEDIUM", "Gluten", False, False, 16),
            ("Mushroom & Cheese Sourdough Toast", "Sautéed wild mushrooms and melted Gruyère cheese on thick sliced artisan sourdough.", 240, "VEG", "MILD", "Dairy, Gluten", False, False, 12),
            ("Iced Hazelnut Latte", "Espresso poured over chilled milk, hazelnut syrup, and ice cubes.", 190, "VEG", "MILD", "Dairy, Nuts", True, False, 5),
            ("English Breakfast Platter", "Scrambled eggs, chicken sausages, grilled tomatoes, hash browns, baked beans, and buttered toast.", 360, "NON_VEG", "MILD", "Eggs, Gluten, Dairy", True, False, 15),
            ("Chocolate Walnut Brownie", "Fudgy Belgian chocolate brownie loaded with toasted California walnuts.", 130, "VEG", "MILD", "Dairy, Gluten, Nuts", False, False, 5),
            ("Chicken Lasagna", "Layers of durum pasta, slow-cooked chicken bolognese, béchamel sauce, and bubbling mozzarella.", 390, "NON_VEG", "MILD", "Dairy, Gluten", True, False, 22),
            ("Cold Coffee with Ice Cream", "Thick blended cold coffee topped with a generous scoop of vanilla bean ice cream.", 180, "VEG", "MILD", "Dairy", True, False, 5)
        ]
    },
    {
        "name": "Truffles Indiranagar",
        "locality": "Indiranagar",
        "landmark": "100 Feet Road, Near Sony Center",
        "pincode": "560038",
        "lat": 12.9734, "lng": 77.6402,
        "address": "307, 100 Feet Rd, Stage 1, Indiranagar, Bengaluru",
        "cuisine": "Burgers, American, Continental, Pastas, Shakes",
        "rating": 4.6, "reviews": 28900, "pure_veg": False, "price_tier": "$", "cost_for_two": 500,
        "phone": "+918041466565", "email": "indiranagar@truffles.in", "banner": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200",
        "dishes": [
            ("All American Cheese Burger", "Juicy minced chicken patty, melted cheddar slice, gherkins, caramelized onions, and secret burger sauce.", 240, "NON_VEG", "MILD", "Dairy, Gluten, Sesame", True, True, 15),
            ("Crispy Chicken Burger", "Crumb-fried golden chicken fillet topped with spicy mayo and shredded iceberg lettuce in toasted sesame bun.", 220, "NON_VEG", "MEDIUM", "Gluten, Eggs", True, False, 15),
            ("Truffles Peri Peri Chicken Burger", "Spicy grilled chicken patty glazed in fiery peri peri reduction, pickled jalapenos, and melted cheese.", 260, "NON_VEG", "SPICY", "Dairy, Gluten", True, True, 15),
            ("Veg XL Sloppy Burger", "Double crispy vegetable patty, double cheese slice, sauteed mushrooms, and smoky house dressing.", 220, "VEG", "MILD", "Dairy, Gluten", False, False, 15),
            ("Lamb Double Patty Burger", "Succulent seasoned minced lamb patties, caramelized onions, mint mayo, and fried egg.", 340, "NON_VEG", "MEDIUM", "Eggs, Gluten, Dairy", True, True, 18),
            ("Cheese Jalapeno Poppers (6 Pcs)", "Crumb coated crispy bites stuffed with molten cheese and chopped fiery jalapenos, served with herb mayo.", 190, "VEG", "MEDIUM", "Dairy, Gluten", True, False, 12),
            ("Peri Peri Crinkle Fries", "Golden crinkle cut potato fries tossed in tangy fiery African peri peri spice blend.", 140, "VEG", "SPICY", "None", True, False, 10),
            ("Creamy Chicken Mac & Cheese", "Cavatappi pasta baked in four-cheese mornay sauce with diced seasoned chicken breast and breadcrumb crust.", 310, "NON_VEG", "MILD", "Dairy, Gluten", True, False, 18),
            ("Paneer Steak in Mushroom Sauce", "Grilled cottage cheese steak served over herbed butter rice, sautéed vegetables, and brown mushroom sauce.", 290, "VEG", "MILD", "Dairy", False, False, 18),
            ("Belgian Chocolate Shake", "Thick blended shake prepared with rich Belgian chocolate fudge and chocolate ice cream.", 180, "VEG", "MILD", "Dairy", True, False, 5),
            ("Ferrero Rocher Shake", "Premium thick shake blended with whole Ferrero Rocher pralines, Nutella, and roasted hazelnuts.", 220, "VEG", "MILD", "Dairy, Nuts", True, True, 5),
            ("Crispy Fish Fingers", "Panko crumb coated river sole fingers flash fried, served with tartar sauce and fresh lemon wedge.", 270, "NON_VEG", "MILD", "Fish, Gluten, Eggs", False, False, 14),
            ("Chicken Pot Pie", "Slow cooked chicken and vegetables in creamy herb velouté topped with golden puff pastry lid.", 290, "NON_VEG", "MILD", "Dairy, Gluten", False, False, 20),
            ("Oreo Fantasy Sundae", "Warm chocolate brownie layered with crushed Oreos, vanilla ice cream, and hot chocolate fudge.", 180, "VEG", "MILD", "Dairy, Gluten", True, False, 6),
            ("Spicy BBQ Chicken Wings (6 Pcs)", "Crisp roasted chicken wings tossed in tangy chipotle barbecue glaze with sesame seeds.", 250, "NON_VEG", "MEDIUM", "Sesame", True, False, 15)
        ]
    },
    # Koramangala
    {
        "name": "Meghana Foods Koramangala",
        "locality": "Koramangala",
        "landmark": "Near Jyoti Nivas College, 5th Block",
        "pincode": "560095",
        "lat": 12.9352, "lng": 77.6143,
        "address": "124, 1st Cross, 5th Block, Koramangala, Bengaluru",
        "cuisine": "Biryani, Andhra, South Indian, Seafood",
        "rating": 4.6, "reviews": 22100, "pure_veg": False, "price_tier": "$$", "cost_for_two": 600,
        "phone": "+918025537777", "email": "koramangala@meghanafoods.co.in", "banner": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200",
        "dishes": [
            ("Meghana Special Chicken Biryani", "Signature spicy Andhra style biryani with marinated boneless chicken chunks layered with fragrant long-grain basmati.", 340, "NON_VEG", "SPICY", "Gluten", True, True, 20),
            ("Meghana Special Mutton Biryani", "Slow cooked tender succulent mutton pieces steeped in fiery Guntur chili spices and royal saffron basmati.", 420, "NON_VEG", "SPICY", "Gluten", True, True, 25),
            ("Paneer 65", "Cubes of malai paneer crisp fried and tossed with green chillies, curry leaves, and spicy red masala.", 280, "VEG", "SPICY", "Dairy", True, False, 15),
            ("Chilli Chicken Andhra Style", "Authentic green-chilli spiked shredded chicken stir-fried with onions and southern aromatics.", 310, "NON_VEG", "EXTRA_SPICY", "Soy", True, False, 15),
            ("Lemon Chicken", "Tender pan-seared chicken bits laced with freshly squeezed nimbu juice and cracked black pepper.", 300, "NON_VEG", "MILD", "None", False, False, 15),
            ("Chicken Lollipop (6 Pcs)", "Frenched chicken winglets coated in spicy red batter, deep-fried crisp, served with hot garlic dip.", 320, "NON_VEG", "MEDIUM", "Eggs, Gluten", True, False, 16),
            ("Guntur Chicken Curry", "Fiery chicken gravy prepared with sun-dried Guntur chillies, poppy seeds, and fresh grated coconut.", 320, "NON_VEG", "EXTRA_SPICY", "Nuts", False, False, 20),
            ("Pappu Charu with Rice", "Traditional Andhra tangy spiced lentil broth served with piping hot steamed sona masoori and ghee.", 180, "VEG", "MEDIUM", "None", False, False, 12),
            ("Egg Biryani", "Hard-boiled golden seared eggs nestled in aromatic seasoned basmati rice served with mirchi ka salan.", 250, "EGG", "MEDIUM", "Eggs", False, False, 15),
            ("Gongura Chicken Curry", "Chicken cooked in traditional Andhra sour sorrel leaves gravy with crushed green chillies.", 330, "NON_VEG", "SPICY", "None", True, True, 20),
            ("Apollo Fish Fry", "Crispy river sole fish fingers tossed with curry leaves, yogurt, and aromatic Andhra spices.", 360, "NON_VEG", "MEDIUM", "Fish", False, False, 18),
            ("Paneer Biryani", "Fresh malai paneer cubes tossed in house-secret Andhra masala layered over fragrant ghee rice.", 290, "VEG", "MEDIUM", "Dairy", True, False, 18),
            ("Crispy Babycorn Pepper Fry", "Tender babycorns tossed with crushed black pepper, sea salt, spring onions, and garlic flakes.", 240, "VEG", "MEDIUM", "Gluten", False, False, 14),
            ("Curd Rice Andhra Style", "Creamy tempered yogurt rice with mustard seeds, pomegranate arils, roasted cashews, and ginger.", 150, "VEG", "MILD", "Dairy", False, False, 10),
            ("Fish Curry Andhra Style", "Fresh bhetki fish simmered in tangy raw mango, tamarind, and spicy red chilli paste gravy.", 370, "NON_VEG", "SPICY", "Fish", False, False, 20)
        ]
    },
    {
        "name": "Empire Restaurant Koramangala",
        "locality": "Koramangala",
        "landmark": "Near BDA Complex, 80 Feet Road",
        "pincode": "560095",
        "lat": 12.9348, "lng": 77.6201,
        "address": "103, Industrial Layout, 5th Block, Koramangala, Bengaluru",
        "cuisine": "North Indian, Mughlai, Biryani, Shawarma, Late Night",
        "rating": 4.3, "reviews": 31200, "pure_veg": False, "price_tier": "$$", "cost_for_two": 550,
        "phone": "+918040414041", "email": "koramangala@hotelempire.in", "banner": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200",
        "dishes": [
            ("Empire Special Butter Chicken", "The legendary Bangalore late-night sweet and savory butter chicken simmered in rich cashew cream.", 310, "NON_VEG", "MILD", "Dairy, Nuts", True, True, 15),
            ("Empire Coin Parotta (4 Pcs)", "Flaky multi-layered miniature Malabar style parottas cooked on flat iron tawa with country ghee.", 100, "VEG", "MILD", "Gluten, Dairy", True, True, 10),
            ("Chicken Shawarma Roll", "Slow-roasted spit chicken shaved and wrapped in fresh kuboos with garlic toum and pickled gherkins.", 140, "NON_VEG", "MILD", "Gluten", True, True, 8),
            ("Empire Grilled Chicken (Half)", "Chicken marinated in Arabian spiced yogurt, charcoal rotisserie grilled with smoky charred crust.", 260, "NON_VEG", "MEDIUM", "Dairy", True, False, 18),
            ("Empire Mutton Biryani", "Fragrant jeera samba rice cooked with tender meat cuts and coastal Kerala-Mughlai spices.", 360, "NON_VEG", "MEDIUM", "Dairy", True, False, 18),
            ("Ghee Rice with Chicken Kebab", "Aromatic short-grain rice cooked in pure ghee, paired with 4 pieces of deep-fried spicy red chicken kebabs.", 290, "NON_VEG", "MEDIUM", "Dairy, Eggs", True, True, 15),
            ("Dragon Chicken", "Indo-Chinese style shredded crispy chicken tossed with cashews, dried red chillies, and honey chilli glaze.", 290, "NON_VEG", "SPICY", "Soy, Nuts", False, False, 15),
            ("Paneer Tikka Masala", "Clay oven roasted paneer cubes simmered in spiced onion-tomato gravy with capsicum.", 260, "VEG", "MEDIUM", "Dairy", False, False, 16),
            ("Tandoori Chicken (Full)", "Whole spring chicken marinated in Kashmiri degi mirch and hung curd, roasted in clay tandoor.", 440, "NON_VEG", "MEDIUM", "Dairy", True, False, 22),
            ("Chicken Clear Soup", "Light chicken broth flavored with spring onions, shredded chicken, and cracked white pepper.", 120, "NON_VEG", "MILD", "None", False, False, 10),
            ("Mutton Brain Fry", "Tender goat brain cooked on iron tawa with minced onions, green chillies, and freshly ground pepper.", 290, "NON_VEG", "SPICY", "None", False, True, 16),
            ("Kerala Parotta with Veg Kurma", "Flaky layered parottas served with fragrant coconut milk vegetable kurma.", 180, "VEG", "MILD", "Gluten, Coconut", False, False, 12),
            ("Falooda Royal", "Chilled rose milk layered with sabja seeds, falooda vermicelli, kulfi ice cream, and dry fruits.", 160, "VEG", "MILD", "Dairy, Nuts", True, False, 6),
            ("Egg Kothu Parotta", "Shredded flaky parotta scrambled on flat griddle with eggs, minced onions, and spicy salan.", 190, "EGG", "SPICY", "Gluten, Eggs", True, False, 14),
            ("Chicken Biryani (Empire Style)", "Classic Bengaluru style chicken biryani served with boiled egg and raita.", 280, "NON_VEG", "MEDIUM", "Eggs, Dairy", True, False, 15)
        ]
    },
    {
        "name": "The Hole in the Wall Cafe Koramangala",
        "locality": "Koramangala",
        "landmark": "4th Block, Near Maharaja Signal",
        "pincode": "560034",
        "lat": 12.9339, "lng": 77.6256,
        "address": "4, 8th Main Rd, 4th Block, Koramangala, Bengaluru",
        "cuisine": "Cafe, European, Breakfast, Waffles, Burgers",
        "rating": 4.6, "reviews": 21500, "pure_veg": False, "price_tier": "$$", "cost_for_two": 650,
        "phone": "+918040949494", "email": "holeinthewall@cafe.com", "banner": "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=1200",
        "dishes": [
            ("The All-Day English Breakfast", "Fried eggs, chicken sausages, bacon rashers, baked beans, grilled tomato, hash browns, and buttered toast.", 380, "NON_VEG", "MILD", "Eggs, Dairy, Gluten, Pork", True, True, 18),
            ("Farmer's Breakfast Scramble", "Fluffy scrambled eggs with sautéed mushrooms, spinach, cheddar cheese, and rustic country bread.", 280, "EGG", "MILD", "Eggs, Dairy, Gluten", True, False, 14),
            ("Nutella & Banana Waffles", "Crisp Belgian waffle topped with warm Nutella spread, sliced bananas, whipped cream, and chocolate sauce.", 250, "VEG", "MILD", "Dairy, Gluten, Nuts", True, True, 12),
            ("Classic Blueberry Pancakes (3 Pcs)", "Fluffy American buttermilk pancakes layered with blueberry compote and warm maple syrup.", 240, "VEG", "MILD", "Dairy, Gluten", True, False, 14),
            ("Smoked Chicken & Cheese Omelette", "Three-egg folded omelette filled with hickory smoked chicken, cheddar, and herbs, served with hash brown.", 260, "NON_VEG", "MILD", "Eggs, Dairy", True, False, 12),
            ("The Goan Chorizo Pao", "Spicy pickled Goan pork chorizo sauteed with onions and stuffed into crusty warm buttered pao buns.", 310, "NON_VEG", "SPICY", "Pork, Gluten", True, True, 15),
            ("Grilled BBQ Pulled Pork Burger", "Slow-cooked pulled pork tossed in house bourbon BBQ sauce topped with apple cider coleslaw.", 340, "NON_VEG", "MEDIUM", "Pork, Gluten", True, False, 16),
            ("Mushroom Melt Sandwich", "Sautéed button and shiitake mushrooms with melted mozzarella and caramelized onions in panini.", 250, "VEG", "MILD", "Dairy, Gluten", False, False, 12),
            ("Pasta Carbonara (Bacon)", "Spaghetti tossed in egg yolk, cracked black pepper, crispy bacon bits, and aged parmesan.", 390, "NON_VEG", "MILD", "Eggs, Dairy, Gluten, Pork", True, False, 18),
            ("Avocado & Poached Egg Toast", "Mashed Hass avocado on toasted whole-wheat sourdough topped with two runny poached eggs and chili flakes.", 320, "EGG", "MILD", "Eggs, Gluten", True, False, 12),
            ("Warm Apple Crumble Pie", "Cinnamon spiced Granny Smith apples baked under buttery oat crumble served with vanilla ice cream.", 210, "VEG", "MILD", "Dairy, Gluten", False, False, 10),
            ("Iced Cold Brew Coffee", "Single-origin Chikmagalur Arabica steeped cold for 18 hours, served over clear ice.", 160, "VEG", "MILD", "None", True, False, 5),
            ("Crispy Chicken Tenders", "Buttermilk marinated chicken strips coated in spiced panko crumbs, served with honey mustard dip.", 260, "NON_VEG", "MILD", "Gluten, Mustard", False, False, 14),
            ("Grilled Mediterranean Veg Sandwich", "Char-grilled bell peppers, zucchini, hummus, and feta cheese layered in whole wheat focaccia.", 260, "VEG", "MILD", "Dairy, Gluten, Sesame", False, False, 12),
            ("Hot Chocolate with Marshmallows", "Rich melted dark chocolate whisked with hot whole milk and topped with toasted marshmallows.", 190, "VEG", "MILD", "Dairy", True, False, 6)
        ]
    },
    {
        "name": "Third Wave Coffee Koramangala",
        "locality": "Koramangala",
        "landmark": "Near Sony World Signal, 4th Block",
        "pincode": "560034",
        "lat": 12.9341, "lng": 77.6231,
        "address": "984, 80 Feet Rd, 4th Block, Koramangala, Bengaluru",
        "cuisine": "Coffee, Cafe, Bakery, Breakfast, Desserts",
        "rating": 4.6, "reviews": 14200, "pure_veg": False, "price_tier": "$$", "cost_for_two": 550,
        "phone": "+918049653300", "email": "koramangala@thirdwavecoffee.in", "banner": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200",
        "dishes": [
            ("Classic Cold Brew", "16-hour slow steeped specialty estate Arabica coffee with crisp chocolate and berry notes.", 190, "VEG", "MILD", "None", True, True, 4),
            ("Sea Salt Mocha Frappe", "Espresso blended with dark chocolate ganache, sea salt crystals, milk, and whipped cream.", 250, "VEG", "MILD", "Dairy", True, True, 6),
            ("Spanish Latte (Hot)", "Rich double espresso poured over velvety steamed milk and sweet condensed milk.", 220, "VEG", "MILD", "Dairy", True, False, 5),
            ("Hummus & Pita Platter", "Creamy tahini hummus drizzled with extra virgin olive oil, served with warm whole wheat pita triangles.", 260, "VEG", "MILD", "Gluten, Sesame", False, False, 10),
            ("Pesto Paneer Sourdough Sandwich", "Fresh basil pesto, sliced grilled paneer, and sundried tomatoes pressed in artisan sourdough.", 270, "VEG", "MILD", "Dairy, Gluten, Nuts", True, False, 12),
            ("Sriracha Chicken Bagel", "Toasted multiseed bagel filled with fiery sriracha pulled chicken, gherkins, and cream cheese.", 290, "NON_VEG", "MEDIUM", "Gluten, Dairy, Sesame", True, False, 12),
            ("Butter Croissant", "Authentic French butter laminated pastry baked to flaky golden perfection.", 130, "VEG", "MILD", "Dairy, Gluten", True, False, 4),
            ("Almond Cinnamon Tart", "Buttery sweet pastry filled with rich almond frangipane and dusted with ground Ceylon cinnamon.", 160, "VEG", "MILD", "Dairy, Gluten, Nuts", False, False, 5),
            ("Mushroom & Mozzarella Croissant", "Warm flaky butter croissant stuffed with sautéed garlic mushrooms and melted mozzarella.", 210, "VEG", "MILD", "Dairy, Gluten", False, False, 8),
            ("Avocado & Feta Toast", "Crushed Hass avocado on toasted country bread topped with crumbled Greek feta, cherry tomatoes, and microgreens.", 310, "VEG", "MILD", "Dairy, Gluten", True, True, 10),
            ("Lotus Biscoff Cheesecake", "Creamy baked cheesecake layered over crunchy Lotus Biscoff crumb crust topped with warm Biscoff spread.", 240, "VEG", "MILD", "Dairy, Gluten", True, True, 4),
            ("Matcha Green Tea Latte", "Ceremonial grade Japanese Uji matcha whisked with steamed oat milk.", 240, "VEG", "MILD", "None", False, False, 6),
            ("Double Chocolate Cookie", "Giant soft-baked cookie loaded with dark and milk chocolate chunks.", 110, "VEG", "MILD", "Dairy, Gluten", False, False, 4),
            ("Smoked Turkey & Cheese Sandwich", "Sliced smoked turkey breast, Dijon mustard, and Swiss cheese in rye sourdough bread.", 330, "NON_VEG", "MILD", "Gluten, Dairy, Mustard", False, False, 12),
            ("Banana Walnut Tea Cake", "Moist loaf cake prepared with ripe bananas, toasted walnuts, and brown sugar.", 120, "VEG", "MILD", "Gluten, Nuts", False, False, 4)
        ]
    },
    # Jayanagar
    {
        "name": "Vidyarthi Bhavan Jayanagar",
        "locality": "Jayanagar",
        "landmark": "Near Gandhi Bazaar / Jayanagar 3rd Block",
        "pincode": "560011",
        "lat": 12.9298, "lng": 77.5824,
        "address": "32, 33rd Cross, 11th Main, 4th Block, Jayanagar, Bengaluru",
        "cuisine": "South Indian, Traditional, Pure Veg, Dosa Heritage",
        "rating": 4.8, "reviews": 38400, "pure_veg": True, "price_tier": "$", "cost_for_two": 250,
        "phone": "+918026677588", "email": "heritage@vidyarthibhavan.in", "banner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200",
        "dishes": [
            ("Vidyarthi Bhavan Masale Dose", "The legendary 1943 heritage thick golden-brown crispy dosa drenched in melted butter with spiced potato palya.", 95, "VEG", "MILD", "Dairy", True, True, 10),
            ("Sagoo Masale Dose", "Signature thick crispy dosa layered with traditional Karnataka vegetable sagoo and spiced red chutney.", 95, "VEG", "MILD", "Dairy", True, False, 10),
            ("Plain Dose", "Thick golden crusted heritage plain dosa roasted with generous dollops of pure clarified butter.", 80, "VEG", "MILD", "Dairy", False, False, 8),
            ("Crispy Medu Vade (1 Pc)", "Crunchy golden urad dal fritter with whole black peppercorns served with chilled thick coconut chutney.", 45, "VEG", "MILD", "None", True, False, 6),
            ("Poori Sagoo (2 Pcs)", "Piping hot puffed whole wheat pooris served with coconut, poppy seed, and mixed vegetable sagoo.", 85, "VEG", "MILD", "Gluten", True, False, 10),
            ("Rava Vade (1 Pc)", "Crunchy semolina and spiced onion fritter with green chillies and fresh coriander.", 50, "VEG", "MEDIUM", "Gluten", False, False, 8),
            ("Kesari Bath", "Sweet roasted semolina halwa cooked with pure ghee, pineapple chunks, saffron, and cashew nuts.", 65, "VEG", "MILD", "Dairy, Nuts", True, False, 6),
            ("Khara Bath", "Traditional Karnataka semolina upma spiced with mustard, curry leaves, ginger, and ghee.", 60, "VEG", "MEDIUM", "Dairy", False, False, 6),
            ("Idli (2 Pcs) with Chutney", "Steamed melt-in-mouth rice cakes served with Vidyarthi Bhavan's world-famous thick green coconut chutney.", 55, "VEG", "MILD", "None", False, False, 6),
            ("Dip Sambar Vade", "Crispy medu vada immersed in a bowl of piping hot aromatic lentil and vegetable sambar.", 65, "VEG", "MILD", "None", True, False, 6),
            ("Filter Coffee", "Heritage strong chicory-blended South Indian coffee brewed in traditional brass drip filter with full cream milk.", 35, "VEG", "MILD", "Dairy", True, True, 4),
            ("Badam Halwa", "Decadent rich almond paste confection simmered in pure ghee and saffron.", 90, "VEG", "MILD", "Dairy, Nuts", True, False, 5),
            ("Chiroti with Badam Milk", "Traditional Karnataka flaky layered pastry crushed and served with warm sweetened almond milk.", 95, "VEG", "MILD", "Dairy, Gluten, Nuts", False, False, 8),
            ("Gulab Jamun (2 Pcs)", "Soft khoya milk solids balls soaked in rose and green cardamom syrup.", 60, "VEG", "MILD", "Dairy, Gluten", False, False, 4),
            ("Mosaru Vade (Curd Vada)", "Golden vada soaked in sweet and savory seasoned yogurt tempered with mustard and boondi.", 70, "VEG", "MILD", "Dairy", False, False, 6)
        ]
    },
    {
        "name": "Taaza Thindi Jayanagar",
        "locality": "Jayanagar",
        "landmark": "Near Jayanagar 4th T Block Post Office",
        "pincode": "560041",
        "lat": 12.9245, "lng": 77.5843,
        "address": "1004, 26th Main, 4th T Block, Jayanagar, Bengaluru",
        "cuisine": "South Indian, Pure Veg, Clean Kitchen, Budget Breakfast",
        "rating": 4.8, "reviews": 29800, "pure_veg": True, "price_tier": "$", "cost_for_two": 150,
        "phone": "+918026543210", "email": "contact@taazathindi.com", "banner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200",
        "dishes": [
            ("Masala Dosa", "Unbelievably crisp golden dosa roasted with pure butter, filled with spiced potato palya and spicy red chutney.", 40, "VEG", "MILD", "Dairy", True, True, 8),
            ("Plain Dosa", "Crispy golden crepe served with freshly ground thick green coconut chutney.", 30, "VEG", "MILD", "Dairy", False, False, 6),
            ("Idli (2 Pcs)", "Cotton-soft steamed rice and urad dal cakes paired with unlimited authentic coconut chutney.", 25, "VEG", "MILD", "None", True, True, 5),
            ("Vada (1 Pc)", "Super crunchy outside, airy soft inside, lentil donut tempered with peppercorns and ginger.", 25, "VEG", "MILD", "None", True, True, 5),
            ("Khara Bath (Chow Chow Bath)", "Rich and flavorful semolina upma cooked with ghee and seasonal vegetables.", 35, "VEG", "MEDIUM", "Dairy", True, False, 6),
            ("Kesari Bath", "Aromatic saffron and cardamom infused sweet semolina halwa with roasted cashews and raisins.", 35, "VEG", "MILD", "Dairy, Nuts", True, False, 6),
            ("Chow Chow Bath Combo", "The classic Karnataka twin breakfast: one scoop of savory Khara Bath and one scoop of sweet Kesari Bath.", 65, "VEG", "MEDIUM", "Dairy, Nuts", True, True, 6),
            ("Filter Coffee", "Freshly brewed South Indian filter kaapi with thick froth and rich aroma.", 20, "VEG", "MILD", "Dairy", True, True, 4),
            ("Tea (South Indian Style)", "Strong Assam CTC tea boiled with milk, crushed ginger, and green cardamom.", 20, "VEG", "MILD", "Dairy", False, False, 4),
            ("Badam Milk (Hot)", "Nutritious hot milk infused with real almond paste, saffron strands, and crushed pistachios.", 30, "VEG", "MILD", "Dairy, Nuts", False, False, 5)
        ]
    },
    {
        "name": "Maiyas Jayanagar",
        "locality": "Jayanagar",
        "landmark": "Near Jayanagar 4th Block Complex",
        "pincode": "560011",
        "lat": 12.9288, "lng": 77.5830,
        "address": "459/30, 30th Cross, 4th Block, Jayanagar, Bengaluru",
        "cuisine": "South Indian, Sweets, Pure Veg, Traditional Meals",
        "rating": 4.5, "reviews": 18200, "pure_veg": True, "price_tier": "$$", "cost_for_two": 450,
        "phone": "+918043414444", "email": "jayanagar@maiyas.com", "banner": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200",
        "dishes": [
            ("Maiyas Royal Karnataka Thali", "Traditional silver plate feast: obbattu, kosambari, palya, huli, saaru, bisibelebath, curd rice, and sweets.", 260, "VEG", "MEDIUM", "Dairy", True, True, 15),
            ("Open Butter Masala Dosa", "Thick spongy golden dosa topped with potato palya, spicy red powder, and generous pat of butter.", 110, "VEG", "MEDIUM", "Dairy", True, False, 10),
            ("Traditional Bisibelebath", "Wholesome rice, toor dal, and vegetable stew simmered with freshly ground spices and ghee.", 90, "VEG", "MEDIUM", "Dairy", True, True, 8),
            ("Rava Idli (2 Pcs) with Potato Sagoo", "Steamed roasted semolina cakes garnished with mustard, curry leaves, and cashews, served with potato sagoo.", 80, "VEG", "MILD", "Dairy, Nuts, Gluten", True, False, 8),
            ("Holige / Obbattu (2 Pcs)", "Sweet flatbread stuffed with chana dal jaggery puran, served with warm milk and pure ghee.", 80, "VEG", "MILD", "Gluten, Dairy", True, True, 6),
            ("Gulab Jamun with Rabdi", "Warm khoya jamuns bathed in rich rabdi infused with saffron and pistachios.", 120, "VEG", "MILD", "Dairy, Nuts", False, False, 5),
            ("Mysore Pak (250g Box)", "Traditional melt-in-mouth gram flour fudge prepared with pure ghee and sugar.", 175, "VEG", "MILD", "Dairy", True, True, 4),
            ("Maddur Vada (2 Pcs)", "Crispy spiced onion, semolina, and rice flour fritters from Maddur town.", 60, "VEG", "MEDIUM", "Gluten", True, False, 6),
            ("Mangalore Buns (2 Pcs)", "Sweet fermented banana and flour deep-fried fluffy pooris served with coconut chutney and veg sagoo.", 80, "VEG", "MILD", "Gluten, Dairy", True, False, 8),
            ("Filter Kaapi", "Iconic freshly frothed filter coffee served in traditional steel tumbler and dabara.", 40, "VEG", "MILD", "Dairy", True, False, 4),
            ("Curd Vada (2 Pcs)", "Medu vadas soaked in creamy beaten curd garnished with roasted cumin, grated carrots, and coriander.", 85, "VEG", "MILD", "Dairy", False, False, 6),
            ("Set Dosa (3 Pcs)", "Trio of super soft, spongy dosas served with mixed vegetable sagoo and fresh coconut chutney.", 90, "VEG", "MILD", "Dairy", False, False, 8),
            ("Puliyogare (Tamarind Rice)", "Tangy spiced tamarind rice tempered with peanuts, curry leaves, and dry red chillies.", 80, "VEG", "MEDIUM", "Peanuts", True, False, 6),
            ("Dharwad Peda (250g Box)", "Rich caramelized milk fudge dusted with powdered sugar, authentic North Karnataka heritage sweet.", 180, "VEG", "MILD", "Dairy", False, False, 4),
            ("Kaju Katli (250g Box)", "Diamond cut cashew nut fudge adorned with delicate edible silver foil.", 260, "VEG", "MILD", "Nuts", False, False, 4)
        ]
    },
    # Malleshwaram
    {
        "name": "CTR Shri Sagar Malleshwaram",
        "locality": "Malleshwaram",
        "landmark": "7th Cross, Margosa Road",
        "pincode": "560003",
        "lat": 13.0031, "lng": 77.5705,
        "address": "7th Cross, Margosa Rd, Malleshwaram, Bengaluru",
        "cuisine": "South Indian, Pure Veg, Heritage Dosas, Filter Coffee",
        "rating": 4.8, "reviews": 36700, "pure_veg": True, "price_tier": "$", "cost_for_two": 250,
        "phone": "+918023344838", "email": "shrisagar@ctr.in", "banner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200",
        "dishes": [
            ("CTR Benne Masala Dosa", "The iconic Bengaluru golden butter dosa: crisp crackling outer crust, fluffy inside, stuffed with spiced potato palya.", 95, "VEG", "MILD", "Dairy", True, True, 10),
            ("Benne Plain Dosa", "Golden crisp butter dosa roasted on heavy seasoned iron tawa with pure white butter.", 80, "VEG", "MILD", "Dairy", False, False, 8),
            ("Benne Kali Dosa (Set of 2)", "Soft, thick, and spongy dosas roasted with butter, served with coconut chutney and sagoo.", 85, "VEG", "MILD", "Dairy", True, False, 10),
            ("Maddur Vada (2 Pcs)", "Authentic crunchy onion and semolina fritters flavored with curry leaves, hing, and green chillies.", 55, "VEG", "MEDIUM", "Gluten", True, True, 6),
            ("Mangalore Buns (2 Pcs)", "Mildly sweet banana-fermented deep-fried fluffy bread served with spicy coconut chutney.", 65, "VEG", "MILD", "Gluten, Dairy", True, False, 8),
            ("Poori Sagoo (3 Pcs)", "Fluffy whole wheat pooris served with coconut, poppy seed, and vegetable sagoo.", 80, "VEG", "MILD", "Gluten", False, False, 10),
            ("Crispy Medu Vada (1 Pc)", "Crunchy deep-fried black gram fritter served with fresh coconut chutney.", 40, "VEG", "MILD", "None", True, False, 6),
            ("Rava Idli (1 Pc)", "Steamed semolina cake seasoned with mustard, cashews, and coriander, served with potato sagoo and pure ghee.", 50, "VEG", "MILD", "Dairy, Nuts, Gluten", False, False, 6),
            ("Kesari Bath", "Rich sweet semolina halwa cooked in pure ghee with pineapple bits, saffron, and roasted cashews.", 60, "VEG", "MILD", "Dairy, Nuts", True, False, 5),
            ("Khara Bath", "Spicy roasted semolina upma cooked with ghee, mustard seeds, green chillies, and ginger.", 55, "VEG", "MEDIUM", "Dairy", False, False, 5),
            ("Dip Sambar Idli (2 Pcs)", "Steamed soft idlis dunked in a piping hot bowl of Karnataka sweet-tangy lentil sambar.", 60, "VEG", "MILD", "None", True, False, 6),
            ("Filter Coffee", "Iconic CTR strong South Indian chicory blend filter coffee served piping hot.", 35, "VEG", "MILD", "Dairy", True, True, 4),
            ("Badam Halwa", "Decadent pure almond halwa simmered in country ghee, scented with green cardamom.", 85, "VEG", "MILD", "Dairy, Nuts", True, False, 5),
            ("Chiroti with Sweet Milk", "Crispy multi-layered fried puff pastry served with warm sweetened almond milk.", 80, "VEG", "MILD", "Dairy, Gluten, Nuts", False, False, 8),
            ("Ghee Podi Idli (Mini 14 Pcs)", "Mini button idlis tossed in spicy roasted lentil powder and hot clarified butter.", 90, "VEG", "MEDIUM", "Dairy", True, False, 8)
        ]
    },
    {
        "name": "Veena Stores Malleshwaram",
        "locality": "Malleshwaram",
        "landmark": "Margosa Road, Near 15th Cross",
        "pincode": "560003",
        "lat": 13.0075, "lng": 77.5710,
        "address": "183, Margosa Rd, Malleshwaram, Bengaluru",
        "cuisine": "South Indian, Pure Veg, Street Food, Heritage Idli",
        "rating": 4.7, "reviews": 27400, "pure_veg": True, "price_tier": "$", "cost_for_two": 150,
        "phone": "+918023344839", "email": "info@veenastores.com", "banner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200",
        "dishes": [
            ("Veena Stores Soft Idli (2 Pcs)", "World-renowned ultra fluffy steamed idlis drenched in Veena Stores' signature mint-coconut chutney.", 35, "VEG", "MILD", "None", True, True, 5),
            ("Crispy Vada (1 Pc)", "Piping hot crunchy medu vada with black pepper and ginger, served with liberal ladle of cold coconut chutney.", 30, "VEG", "MILD", "None", True, True, 5),
            ("Khara Bath", "Traditional Karnataka savory upma cooked with fresh vegetables, mustard, and fragrant ghee.", 40, "VEG", "MEDIUM", "Dairy", True, False, 5),
            ("Kesari Bath", "Sweet saffron-tinted semolina halwa with golden raisins and cashew nuts in pure ghee.", 40, "VEG", "MILD", "Dairy, Nuts", True, False, 5),
            ("Chow Chow Bath", "Classic combo of one scoop spicy Khara Bath and one scoop sweet Kesari Bath.", 75, "VEG", "MEDIUM", "Dairy, Nuts", True, True, 5),
            ("Shavige Bath", "Delicate steamed rice vermicelli tempered with mustard seeds, lemon juice, turmeric, and peanuts.", 45, "VEG", "MILD", "Peanuts", True, False, 6),
            ("Bisi Bele Bath", "Wholesome spiced rice and lentil mash with vegetables, ghee, and crisp potato chips.", 55, "VEG", "MEDIUM", "Dairy", True, True, 6),
            ("Puliyogare", "Traditional temple-style tangy tamarind rice garnished with roasted peanuts and curry leaves.", 50, "VEG", "MEDIUM", "Peanuts", True, False, 6),
            ("Sweet Pongal", "Jaggery and moong dal rice pudding cooked with copious ghee, cardamom, and roasted cashews.", 50, "VEG", "MILD", "Dairy, Nuts", False, False, 5),
            ("Filter Coffee", "Strong, freshly brewed traditional South Indian filter coffee in steel cup.", 25, "VEG", "MILD", "Dairy", True, True, 4)
        ]
    },
    {
        "name": "Halli Mane Malleshwaram",
        "locality": "Malleshwaram",
        "landmark": "3rd Cross, Sampige Road",
        "pincode": "560003",
        "lat": 13.0012, "lng": 77.5718,
        "address": "14, 3rd Cross, Sampige Rd, Malleshwaram, Bengaluru",
        "cuisine": "Karnataka Traditional, South Indian, Pure Veg, Ragi Mudde",
        "rating": 4.5, "reviews": 16900, "pure_veg": True, "price_tier": "$$", "cost_for_two": 400,
        "phone": "+918023460000", "email": "hallimane@gmail.com", "banner": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200",
        "dishes": [
            ("Traditional Ragi Mudde Oota", "Steamed finger millet ball served with Karnataka soppu saaru (greens curry), vegetable palya, rice, and buttermilk.", 180, "VEG", "MEDIUM", "Dairy", True, True, 12),
            ("Akki Rotti (2 Pcs)", "Authentic Karnataka rice flour flatbread kneaded with chopped dill leaves, onions, and cumin, served with brinjal yennegai.", 110, "VEG", "MEDIUM", "None", True, True, 12),
            ("Jolada Rotti Oota", "North Karnataka sorghum flatbreads served with stuffed baby eggplant yennegai, sprouted moong usli, and shenga chutney.", 190, "VEG", "SPICY", "Peanuts", True, True, 15),
            ("Neer Dosa (3 Pcs)", "Delicate lace-thin steamed rice crepes from Coastal Karnataka served with coconut jaggery mixture and spicy chutney.", 100, "VEG", "MILD", "Coconut", True, False, 10),
            ("Mangalore Buns (2 Pcs)", "Deep-fried sweet banana pooris served with coconut chutney and veg sagoo.", 75, "VEG", "MILD", "Gluten, Dairy", False, False, 8),
            ("Halli Mane Special Masala Dosa", "Crispy village-style dosa smeared with spicy red chutney and spiced potato mash.", 95, "VEG", "MEDIUM", "Dairy", True, False, 10),
            ("Bisi Bele Bath with Boondi", "Flavorful spicy Karnataka lentil rice topped with crunchy spiced boondi and country ghee.", 85, "VEG", "MEDIUM", "Dairy", True, False, 8),
            ("Obbattu (Chana Dal Puran)", "Karnataka sweet flatbread stuffed with cooked Bengal gram and organic jaggery, served with ghee.", 50, "VEG", "MILD", "Gluten, Dairy", True, False, 6),
            ("Kayirasa", "Sweet and sour pineapple and capsicum curry prepared with coconut and mustard paste.", 120, "VEG", "MEDIUM", "Mustard, Coconut", False, False, 10),
            ("Majjige Huli", "Traditional Karnataka bottle gourd simmered in spiced buttermilk and coconut gravy.", 110, "VEG", "MILD", "Dairy, Coconut", False, False, 10),
            ("Filter Coffee", "Strong aromatic South Indian coffee brewed in traditional brass filters.", 35, "VEG", "MILD", "Dairy", True, False, 4),
            ("Dharwad Peda (2 Pcs)", "Authentic caramelized milk fudge from Dharwad.", 50, "VEG", "MILD", "Dairy", False, False, 4)
        ]
    },
    # Church Street / MG Road / Brigade Road
    {
        "name": "Koshy's Parade Cafe Church Street",
        "locality": "Church Street",
        "landmark": "St. Marks Road Junction",
        "pincode": "560001",
        "lat": 12.9742, "lng": 77.6012,
        "address": "39, St. Marks Rd, Shanthala Nagar, Ashok Nagar, Bengaluru",
        "cuisine": "Heritage, Anglo-Indian, Continental, Kerala, Breakfast",
        "rating": 4.4, "reviews": 15800, "pure_veg": False, "price_tier": "$$", "cost_for_two": 700,
        "phone": "+918022213793", "email": "heritage@koshys.com", "banner": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
        "dishes": [
            ("Koshy's Chicken Liver on Toast", "The historic Bangalore intellectual classic: tender chicken liver sautéed with onions, green chillies, and spices on buttered toast.", 260, "NON_VEG", "MEDIUM", "Gluten, Dairy", True, True, 14),
            ("Koshy's Fish & Chips", "Golden fried crumbed seer fish fillet served with French fries and homemade tartar sauce.", 440, "NON_VEG", "MILD", "Fish, Gluten, Eggs", True, True, 18),
            ("Appam with Mutton Stew (2 Pcs)", "Lace-edged fermented rice pancakes served with tender mutton stewed in velvety spiced coconut milk.", 390, "NON_VEG", "MILD", "Coconut", True, True, 18),
            ("Spanish Omelette", "Thick skillet omelette with diced potatoes, onions, tomatoes, and cheddar cheese.", 210, "EGG", "MILD", "Eggs, Dairy", True, False, 12),
            ("Roast Chicken with Stuffing", "Tender oven-roasted chicken leg quarter served with bread stuffing, roasted potatoes, and pan gravy.", 390, "NON_VEG", "MILD", "Gluten, Dairy", True, False, 20),
            ("Chicken Cutlets (2 Pcs)", "Spiced minced chicken and potato croquettes coated in crispy breadcrumbs, served with mustard sauce.", 220, "NON_VEG", "MEDIUM", "Gluten, Eggs", True, False, 12),
            ("Anglo-Indian Shepherd's Pie", "Minced mutton simmered with carrots and peas topped with creamy piped mashed potatoes and baked brown.", 360, "NON_VEG", "MILD", "Dairy", True, False, 20),
            ("Caramel Custard", "Silky smooth baked egg and milk custard topped with bittersweet golden caramel sauce.", 140, "EGG", "MILD", "Eggs, Dairy", True, True, 5),
            ("Filter Coffee", "Freshly brewed hot South Indian coffee served in classic porcelain cup.", 60, "VEG", "MILD", "Dairy", True, False, 4),
            ("Cold Coffee with Cream", "Old-school blended espresso with chilled milk and a dollop of fresh cream.", 130, "VEG", "MILD", "Dairy", False, False, 5),
            ("Vegetable Stew with Appam (2 Pcs)", "Carrots, beans, and potatoes cooked in aromatic coconut milk and green cardamom broth with soft appams.", 250, "VEG", "MILD", "Coconut", False, False, 16),
            ("Cheese Toast", "Thick sliced bread smothered in melted cheddar cheese with green chillies and toasted crisp.", 160, "VEG", "MILD", "Dairy, Gluten", False, False, 10),
            ("Crumb Fried Prawns", "Jumbo prawns marinated in lime and pepper, crumb fried, served with garlic mayo.", 460, "NON_VEG", "MILD", "Crustacean, Gluten", True, False, 16),
            ("Mutton Biryani (Koshy's Style)", "Fragrant rice cooked with baby mutton cuts in subtle Anglo-Indian aromatic spice mix.", 390, "NON_VEG", "MEDIUM", "Dairy", False, False, 18),
            ("Pork Sausages (3 Pcs)", "Grilled English pork sausages served with buttered mash, caramelized onions, and brown gravy.", 340, "NON_VEG", "MILD", "Pork, Dairy", True, False, 15)
        ]
    },
    {
        "name": "Church Street Social",
        "locality": "Church Street",
        "landmark": "Cobblestone Church Street, Near Metro",
        "pincode": "560001",
        "lat": 12.9751, "lng": 77.6042,
        "address": "46/1, Cobalt Building, Church St, Shanthala Nagar, Bengaluru",
        "cuisine": "Modern Indian, Continental, Burgers, Street Food, Pub Grub",
        "rating": 4.5, "reviews": 23600, "pure_veg": False, "price_tier": "$$", "cost_for_two": 900,
        "phone": "+918041713036", "email": "churchstreet@socialoffline.in", "banner": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200",
        "dishes": [
            ("Butter Chicken Biryani", "Layered fragrant basmati rice topped with rich tandoori butter chicken and boiled egg.", 390, "NON_VEG", "MILD", "Dairy, Eggs", True, True, 18),
            ("Awesomosas (4 Pcs)", "Crispy samosas stuffed with creamy butter chicken or spiced mushroom cheese, served with mint chutney.", 260, "NON_VEG", "MEDIUM", "Gluten, Dairy", True, True, 12),
            ("Social Tenderloin Burger", "Charcoal grilled juicy beef patty, smoked bacon rashers, cheddar cheese, and house relish.", 410, "NON_VEG", "MEDIUM", "Gluten, Dairy, Pork", True, True, 18),
            ("Fully Loaded Nachos", "Crisp nacho chips smothered in cheese fondue, refried beans, pico de gallo, and sour cream.", 340, "VEG", "MILD", "Dairy", True, False, 15),
            ("Fish & Chips Social Style", "Crisp beer-battered bhetki fish fillet served with masala fries and kashmiri chilli tartare.", 460, "NON_VEG", "MILD", "Fish, Gluten", True, False, 18),
            ("Black Truffle & Mushroom Pasta", "Penne tossed in decadent creamy black truffle oil and wild mushroom reduction with parmesan.", 420, "VEG", "MILD", "Dairy, Gluten", False, True, 18),
            ("Chilli Chicken Black Pepper China Box", "Indo-Chinese street style chilli chicken tossed with egg fried rice or hakka noodles in a signature box.", 360, "NON_VEG", "SPICY", "Soy, Eggs, Gluten", True, True, 15),
            ("Vada Pao Bao (3 Pcs)", "Spicy potato batata vada stuffed inside steamed pillowy Chinese bao buns with garlic chutney.", 240, "VEG", "SPICY", "Gluten", True, False, 12),
            ("Death By Chocolate Shake", "Over-the-top thick chocolate milkshake loaded with brownie chunks, whipped cream, and chocolate fudge.", 240, "VEG", "MILD", "Dairy, Gluten", True, False, 6),
            ("Sticky Date & Toffee Pudding", "Warm steamed date sponge soaked in rich warm toffee butterscotch sauce with vanilla ice cream.", 250, "VEG", "MILD", "Dairy, Gluten", True, True, 8),
            ("Crispy Calamari Peri Peri", "Crispy fried tender squid rings dusted with hot African peri peri rub, served with citrus dip.", 390, "NON_VEG", "SPICY", "Mollusc, Gluten", False, False, 14),
            ("Paneer Tikka Kathi Roll", "Smoky tandoori paneer cubes wrapped in layered parotta with sliced onions and mint mayo.", 280, "VEG", "MEDIUM", "Gluten, Dairy", False, False, 14),
            ("Momos from Hell (Steamed 6 Pcs)", "Fiery steamed chicken dumplings tossed in hot ghost pepper bhut jolokia sauce.", 290, "NON_VEG", "EXTRA_SPICY", "Gluten, Soy", True, False, 12),
            ("Pulled Tandoori Chicken Poutine", "Golden french fries smothered in tandoori chicken gravy, cheese curds, and shredded chicken.", 320, "NON_VEG", "MEDIUM", "Dairy", False, False, 14),
            ("Ghee Roast Mutton Tacos (3 Pcs)", "Tender Mangalorean ghee roast mutton stuffed in crispy corn taco shells with pickled onions.", 440, "NON_VEG", "SPICY", "Dairy", True, True, 16)
        ]
    },
    # HSR Layout
    {
        "name": "Leon's Burgers & Wings HSR",
        "locality": "HSR Layout",
        "landmark": "27th Main Road, Sector 1",
        "pincode": "560102",
        "lat": 12.9125, "lng": 77.6445,
        "address": "452, 27th Main Rd, Sector 1, HSR Layout, Bengaluru",
        "cuisine": "Burgers, Fried Chicken, Fast Food, American",
        "rating": 4.5, "reviews": 19200, "pure_veg": False, "price_tier": "$", "cost_for_two": 450,
        "phone": "+918049652288", "email": "hsr@leonsburgers.in", "banner": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200",
        "dishes": [
            ("Leon's Royal Chicken Burger", "Crumb-fried crispy whole chicken breast fillet, iceberg lettuce, mayo, and cheese in glazed brioche bun.", 229, "NON_VEG", "MILD", "Gluten, Dairy, Eggs", True, True, 12),
            ("Peri Peri Fried Chicken Wings (6 Pcs)", "Super crunchy double-battered fried chicken wings tossed in hot peri peri dust.", 269, "NON_VEG", "SPICY", "Gluten", True, True, 14),
            ("Spicy Zinger Fillet Burger", "Fiery marinated fried chicken fillet, spicy dynamite sauce, pickled jalapeños, and cheddar cheese.", 249, "NON_VEG", "SPICY", "Gluten, Dairy", True, False, 12),
            ("Leon's Falafel Veg Burger", "Crunchy chickpea falafel patty, tahini mayo, fresh cucumber, and tomatoes in toasted bun.", 189, "VEG", "MILD", "Gluten, Sesame", False, False, 12),
            ("Smoky BBQ Chicken Wings (6 Pcs)", "Crispy fried wings glazed in rich hickory smoke barbecue reduction topped with white sesame.", 269, "NON_VEG", "MEDIUM", "Sesame, Soy", True, False, 14),
            ("Crispy Chicken Popcorn (Large)", "Bite-sized seasoned chicken breast nuggets flash fried golden crisp, served with cheese dip.", 199, "NON_VEG", "MILD", "Gluten", True, False, 10),
            ("Peri Peri Crinkle Fries", "Golden crinkle cut potato fries tossed in hot African peri peri seasoning.", 129, "VEG", "SPICY", "None", True, False, 8),
            ("Cheese Loaded Fries", "Hot crinkle fries smothered in warm cheddar cheese sauce and chopped jalapeños.", 169, "VEG", "MILD", "Dairy", True, False, 8),
            ("Chocolate Thick Shake", "Decadent blended ice cream shake prepared with rich chocolate sauce and malt.", 169, "VEG", "MILD", "Dairy", True, False, 5),
            ("Crispy Fish Burger", "Golden crumb fried river bhetki fillet topped with tartar sauce and fresh lettuce in bun.", 279, "NON_VEG", "MILD", "Fish, Gluten, Eggs", False, False, 14),
            ("Chicken Strips (4 Pcs)", "Hand-breaded whole chicken tenderloins fried crisp, served with honey mustard dip.", 219, "NON_VEG", "MILD", "Gluten, Mustard", True, False, 12),
            ("Mushroom Swiss Veg Burger", "Crispy vegetable patty topped with sautéed button mushrooms and melted Swiss cheese slice.", 219, "VEG", "MILD", "Gluten, Dairy", False, False, 12),
            ("Red Velvet Jar Cake", "Layers of moist red velvet sponge and cream cheese frosting packed in reusable glass jar.", 149, "VEG", "MILD", "Dairy, Gluten", False, False, 4),
            ("Salted Caramel Frappe", "Chilled espresso blended with salted caramel syrup, whole milk, and whipped cream.", 189, "VEG", "MILD", "Dairy", False, False, 5),
            ("Grilled Chicken Salad", "Herb-grilled chicken breast strips over fresh greens, cherry tomatoes, cucumbers, and lemon vinaigrette.", 249, "NON_VEG", "MILD", "None", False, False, 12)
        ]
    },
    {
        "name": "Paakashala HSR Layout",
        "locality": "HSR Layout",
        "landmark": "14th Main Road, Sector 7",
        "pincode": "560102",
        "lat": 12.9082, "lng": 77.6430,
        "address": "1515, 14th Main Rd, Sector 7, HSR Layout, Bengaluru",
        "cuisine": "South Indian, North Indian, Pure Veg, Chinese",
        "rating": 4.5, "reviews": 17800, "pure_veg": True, "price_tier": "$$", "cost_for_two": 500,
        "phone": "+918043743333", "email": "hsr@paakashala.com", "banner": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200",
        "dishes": [
            ("Paakashala Special South Indian Thali", "Grand spread: 2 pooris, vegetable sagoo, sambar, rasam, kootu, 2 vegetable curries, curd rice, papad, and sweet.", 220, "VEG", "MEDIUM", "Dairy, Gluten", True, True, 15),
            ("Open Butter Masala Dosa", "Thick fluffy golden dosa topped with spicy red chutney, potato palya, and melted white butter.", 115, "VEG", "MEDIUM", "Dairy", True, True, 10),
            ("Rava Masala Dosa", "Crispy thin semolina crepe with cumin, green chillies, cashews, and spiced potato filling.", 125, "VEG", "MEDIUM", "Dairy, Gluten, Nuts", True, False, 12),
            ("Paneer Butter Masala", "Cottage cheese cubes simmered in velvety tomato-cashew silky butter gravy.", 270, "VEG", "MILD", "Dairy, Nuts", True, False, 16),
            ("Dal Makhani", "Slow simmered black lentils cooked overnight with cream, butter, and mild spices.", 230, "VEG", "MILD", "Dairy", True, False, 14),
            ("Butter Naan", "Soft leavened refined flour flatbread baked in tandoor and brushed with fresh butter.", 55, "VEG", "MILD", "Gluten, Dairy", False, False, 8),
            ("Veg Dum Biryani", "Aromatic long-grain basmati rice layered with garden vegetables, mint, and saffron in sealed pot.", 240, "VEG", "MEDIUM", "Dairy", True, False, 18),
            ("Gobi Manchurian Dry", "Crispy cauliflower florets tossed in tangy soya, chilli, garlic, and spring onion glaze.", 210, "VEG", "MEDIUM", "Gluten, Soy", True, False, 14),
            ("Bisi Bele Bath with Boondi", "Traditional spicy lentil rice cooked with vegetables and ghee, served with crisp boondi.", 95, "VEG", "MEDIUM", "Dairy", True, False, 8),
            ("Idli (2 Pcs) & Vada (1 Pc)", "Trio combo: two soft steamed idlis and one crispy medu vada served with sambar and coconut chutney.", 85, "VEG", "MILD", "None", True, False, 6),
            ("Filter Coffee", "Freshly brewed aromatic South Indian filter coffee in steel cup.", 35, "VEG", "MILD", "Dairy", True, True, 4),
            ("Kaju Masala", "Roasted whole cashew nuts simmered in rich spiced onion-tomato and cashew gravy.", 310, "VEG", "MEDIUM", "Nuts, Dairy", False, False, 16),
            ("Mushroom Chilli Fry", "Button mushrooms stir-fried with green bell peppers, onions, soy sauce, and green chillies.", 230, "VEG", "SPICY", "Soy, Gluten", False, False, 14),
            ("Kesari Bath", "Sweet semolina halwa with golden raisins and cashews infused with real saffron.", 60, "VEG", "MILD", "Dairy, Nuts", False, False, 5),
            ("Curd Rice", "Creamy seasoned curd rice tempered with mustard, curry leaves, ginger, and pomegranate.", 120, "VEG", "MILD", "Dairy", False, False, 6)
        ]
    },
    {
        "name": "Nandhana Palace HSR Layout",
        "locality": "HSR Layout",
        "landmark": "Near BDA Complex, 27th Main",
        "pincode": "560102",
        "lat": 12.9110, "lng": 77.6470,
        "address": "28, 27th Main Rd, Sector 1, HSR Layout, Bengaluru",
        "cuisine": "Andhra, Biryani, South Indian, Non-Veg",
        "rating": 4.4, "reviews": 15400, "pure_veg": False, "price_tier": "$$", "cost_for_two": 650,
        "phone": "+918041113333", "email": "hsr@nandhanarestaurants.com", "banner": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200",
        "dishes": [
            ("Nandhana Andhra Chicken Biryani", "Authentic Andhra spiced seeraga samba rice cooked with marinated chicken pieces and fiery spices.", 310, "NON_VEG", "SPICY", "Dairy", True, True, 18),
            ("Andhra Chilli Chicken", "The legendary green chilli spiced tender shredded chicken fry with curry leaves and garlic.", 315, "NON_VEG", "EXTRA_SPICY", "None", True, True, 15),
            ("Kshatriya Kebab (6 Pcs)", "Deep fried crunchy chicken winglets coated in secret royal warrior red spices.", 310, "NON_VEG", "SPICY", "Eggs", True, True, 16),
            ("Nandhana Mutton Biryani", "Tender baby goat cuts slow cooked with seasoned fragrant basmati rice and roasted spices.", 410, "NON_VEG", "SPICY", "Dairy", True, False, 22),
            ("Sholay Chicken Kebab", "Boneless chicken strips tossed in spicy curd batter, curry leaves, and green chillies.", 325, "NON_VEG", "SPICY", "Dairy, Eggs", True, False, 15),
            ("Nandhana Non-Veg Carrier Meals", "Packed banana leaf meal: rice, Andhra chicken curry, pappu, sambar, rasam, curd, and gun powder.", 340, "NON_VEG", "SPICY", "Dairy", True, True, 14),
            ("Guntur Mutton Fry", "Boneless mutton pieces pan-roasted on iron griddle with black pepper, garlic, and fiery Guntur chillies.", 430, "NON_VEG", "EXTRA_SPICY", "None", True, False, 20),
            ("Tomato Pappu with Ghee", "Tangy Andhra toor dal cooked with ripe country tomatoes and tempered in fresh ghee.", 160, "VEG", "MEDIUM", "Dairy", False, False, 10),
            ("Crispy Babycorn Pepper Fry", "Golden fried babycorn tossed with crushed black pepper, sea salt, and curry leaves.", 230, "VEG", "MEDIUM", "Gluten", False, False, 12),
            ("Paneer Sholay Kebab", "Fresh paneer fingers tossed in spicy curd batter and fried with green chillies and curry leaves.", 270, "VEG", "SPICY", "Dairy", False, False, 14),
            ("Chicken Lemon Coriander Soup", "Zesty chicken broth with lemon juice, fresh coriander, and black pepper.", 130, "NON_VEG", "MILD", "None", False, False, 8),
            ("Prawns Pepper Fry", "Fresh tiger prawns tossed in black pepper and caramelized shallots.", 440, "NON_VEG", "SPICY", "Crustacean", True, False, 18),
            ("Andhra Veg Meals", "Unlimited traditional Andhra vegetarian feast with pappu, gun powder, ghee, sambar, and rasam.", 220, "VEG", "MEDIUM", "Dairy", False, False, 12),
            ("Curd Rice Andhra Style", "Creamy seasoned curd rice with pomegranate arils, mustard seeds, and ginger.", 140, "VEG", "MILD", "Dairy", False, False, 8),
            ("Carrot Halwa with Khoya", "Rich warm carrot halwa simmered with milk solids and pure ghee.", 130, "VEG", "MILD", "Dairy, Nuts", False, False, 5)
        ]
    },
    # Whitefield
    {
        "name": "Windmills Craftworks Whitefield",
        "locality": "Whitefield",
        "landmark": "Near EPIP Zone, ITPL Main Road",
        "pincode": "560066",
        "lat": 12.9822, "lng": 77.7289,
        "address": "331, Road 5B, EPIP Zone, Whitefield, Bengaluru",
        "cuisine": "Craft Beer, Microbrewery, Continental, Indian, Kebabs",
        "rating": 4.7, "reviews": 21800, "pure_veg": False, "price_tier": "$$$", "cost_for_two": 1500,
        "phone": "+918880233322", "email": "whitefield@windmills.in", "banner": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200",
        "dishes": [
            ("Kakori Kebab (3 Pcs)", "The legendary Lucknowi melt-in-mouth smoked lamb seekh kebab with rose petals and cloves.", 525, "NON_VEG", "MEDIUM", "Dairy, Nuts", True, True, 20),
            ("Wood-Fired Truffle Funghi Pizza", "White sauce base with wild porcini mushrooms, fresh mozzarella, and aromatic white truffle oil.", 595, "VEG", "MILD", "Dairy, Gluten", True, True, 22),
            ("Bacon Wrapped Chicken Tenders", "Chicken breast tenders wrapped in applewood smoked bacon and roasted with maple glaze.", 495, "NON_VEG", "MILD", "Pork", True, False, 18),
            ("Kerala Style Tenderloin Fry (Buffalo)", "Tender buffalo strips roasted dry with coconut chips, crushed black pepper, and curry leaves.", 485, "NON_VEG", "SPICY", "Coconut", True, True, 18),
            ("Beer Battered Fish & Chips", "Golden ale battered bhetki fillets served with hand-cut fries and caper tartar sauce.", 545, "NON_VEG", "MILD", "Fish, Gluten", True, False, 20),
            ("Dahi Ke Kebab (6 Pcs)", "Pan-seared spiced hung yogurt patties flavored with cardamom and mint, served with apricot dip.", 395, "VEG", "MILD", "Dairy, Gluten", False, False, 15),
            ("Windmills Butter Chicken", "Old Delhi style pulled charcoal tandoori chicken simmered in rich creamy tomato gravy.", 475, "NON_VEG", "MILD", "Dairy, Nuts", True, False, 20),
            ("Dal Makhani Windmills", "Black lentils slow simmered for 24 hours on tandoor with churned country butter and cream.", 365, "VEG", "MILD", "Dairy", True, False, 16),
            ("Pepperoni & Jalapeno Pizza", "Imported pork pepperoni, mozzarella, sliced pickled jalapeños, and San Marzano tomato sauce.", 645, "NON_VEG", "MEDIUM", "Pork, Dairy, Gluten", True, False, 22),
            ("Belgian Dark Chocolate Fondant", "Warm molten Belgian dark chocolate cake served with Madagascar vanilla bean ice cream.", 345, "VEG", "MILD", "Dairy, Gluten", True, True, 12),
            ("Prawns Ghee Roast", "Succulent tiger prawns roasted in coastal Kundapur red chilli paste and clarified butter.", 595, "NON_VEG", "SPICY", "Crustacean, Dairy", True, False, 18),
            ("Pan Seared Salmon Fillet", "Norwegian salmon fillet seared with dill butter, served over crushed potatoes and asparagus.", 895, "NON_VEG", "MILD", "Fish, Dairy", False, True, 22),
            ("Artisan Bread Basket", "Freshly baked sourdough, focaccia, and lavash served with herb butter and olive tapenade.", 245, "VEG", "MILD", "Gluten, Dairy", False, False, 10),
            ("Burrata Caprese Salad", "Artisanal fresh burrata cheese, heirloom tomatoes, fresh basil, and balsamic reduction.", 445, "VEG", "MILD", "Dairy", False, False, 10),
            ("Churros with Dulce de Leche", "Crispy fried Spanish dough flutes dusted with cinnamon sugar served with warm caramel sauce.", 295, "VEG", "MILD", "Dairy, Gluten", True, False, 12)
        ]
    },
    {
        "name": "Biergarten Whitefield",
        "locality": "Whitefield",
        "landmark": "Doddanekkundi, ITPL Main Road",
        "pincode": "560048",
        "lat": 12.9780, "lng": 77.7150,
        "address": "Doddanekkundi Industrial Area, Whitefield, Bengaluru",
        "cuisine": "Continental, European, Asian, Microbrewery, Bar Food",
        "rating": 4.6, "reviews": 20400, "pure_veg": False, "price_tier": "$$$", "cost_for_two": 1300,
        "phone": "+918049652500", "email": "whitefield@biergarten.in", "banner": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200",
        "dishes": [
            ("German Sausage Platter", "Assortment of grilled bratwurst, bockwurst, and nürnberger sausages served with sauerkraut and mustard.", 595, "NON_VEG", "MILD", "Pork, Mustard", True, True, 18),
            ("Spicy Chicken Gyoza (6 Pcs)", "Pan-seared Japanese dumplings stuffed with seasoned minced chicken, served with chili ponzu dip.", 345, "NON_VEG", "MEDIUM", "Gluten, Soy", True, False, 14),
            ("Biergarten Loaded Nachos", "Corn tortilla chips layered with queso, refried beans, guacamole, sour cream, and jalapeños.", 345, "VEG", "MILD", "Dairy", True, False, 15),
            ("BBQ Pork Ribs (Half Rack)", "Slow smoked tender pork ribs glazed in Tennessee whiskey barbecue sauce with coleslaw.", 695, "NON_VEG", "MEDIUM", "Pork", True, True, 22),
            ("Wood-Fired Quattro Formaggi Pizza", "Four cheese pizza with mozzarella, gorgonzola, parmesan, and smoked scamorza.", 545, "VEG", "MILD", "Dairy, Gluten", False, False, 20),
            ("Crispy Calamari Rings", "Squid rings coated in spiced cornmeal crust, deep-fried crisp, served with lemon garlic dip.", 425, "NON_VEG", "MILD", "Mollusc, Gluten", True, False, 15),
            ("Crispy Chilli Paneer", "Cottage cheese cubes tossed in spicy Indo-Chinese wok sauce with bell peppers and spring onions.", 315, "VEG", "MEDIUM", "Dairy, Soy, Gluten", False, False, 14),
            ("Korean Fried Chicken Wings", "Double-fried crunchy wings glazed in sweet and fiery gochujang chili sauce.", 395, "NON_VEG", "SPICY", "Soy, Sesame", True, True, 16),
            ("Truffled Wild Mushroom Risotto", "Creamy arborio rice with shiitake and button mushrooms, white wine, and parmesan.", 465, "VEG", "MILD", "Dairy", False, False, 20),
            ("Classic Tiramisu", "Espresso dipped ladyfingers layered with rich mascarpone sabayon and dusted with cocoa powder.", 295, "EGG", "MILD", "Dairy, Eggs, Gluten", True, True, 6),
            ("Beer Batter Bhetki Fish & Chips", "Golden fried fish fillet served with sea salt french fries and tartare sauce.", 525, "NON_VEG", "MILD", "Fish, Gluten", True, False, 18),
            ("Smoked Chicken Caesar Salad", "Crisp romaine lettuce, smoked chicken strips, sourdough croutons, bacon bits, and caesar dressing.", 365, "NON_VEG", "MILD", "Dairy, Eggs, Gluten, Pork", False, False, 12),
            ("Spicy Veg Dim Sums (6 Pcs)", "Translucent steamed dumplings stuffed with water chestnuts, shiitake, and bok choy.", 295, "VEG", "MEDIUM", "Gluten, Soy", False, False, 12),
            ("Prawns Tempura (6 Pcs)", "Jumbo ocean prawns dipped in featherlight Japanese tempura batter, served with tentsuyu broth.", 525, "NON_VEG", "MILD", "Crustacean, Gluten", True, False, 15),
            ("Apple Strudel with Vanilla Ice Cream", "Spiced cinnamon apple filling wrapped in delicate flaky pastry served warm.", 265, "VEG", "MILD", "Gluten, Dairy", False, False, 10)
        ]
    },
    # Basavanagudi / VV Puram
    {
        "name": "Brahmin's Coffee Bar Basavanagudi",
        "locality": "Basavanagudi",
        "landmark": "Near Shankar Math, Ranga Rao Road",
        "pincode": "560004",
        "lat": 12.9438, "lng": 77.5702,
        "address": "Ranga Rao Rd, Near Shankar Math, Basavanagudi, Bengaluru",
        "cuisine": "South Indian, Pure Veg, Iconic Breakfast, Filter Coffee",
        "rating": 4.9, "reviews": 42000, "pure_veg": True, "price_tier": "$", "cost_for_two": 120,
        "phone": "+918026601111", "email": "heritage@brahminscoffeebar.com", "banner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200",
        "dishes": [
            ("Steamed Idli (2 Pcs)", "World-famous cloud-soft steamed idlis served with Brahmin's iconic watery spicy green coconut chutney.", 30, "VEG", "MILD", "None", True, True, 4),
            ("Crispy Medu Vada (1 Pc)", "The crunchiest golden vada in Bengaluru, infused with whole black peppercorns and fresh ginger.", 30, "VEG", "MILD", "None", True, True, 4),
            ("Khara Bath", "Traditional Karnataka semolina upma cooked in country ghee with mustard seeds, curry leaves, and ginger.", 35, "VEG", "MEDIUM", "Dairy", True, False, 5),
            ("Kesari Bath", "Sweet roasted semolina halwa with pure clarified butter, saffron, and golden raisins.", 35, "VEG", "MILD", "Dairy, Nuts", True, False, 5),
            ("Filter Coffee", "The benchmark for South Indian filter kaapi: perfectly roasted Arabica-Peaberry blend with thick boiled milk.", 20, "VEG", "MILD", "Dairy", True, True, 3),
            ("Tea (Brahmin's Style)", "Strong Assam tea brewed with whole milk and crushed ginger.", 20, "VEG", "MILD", "Dairy", False, False, 3),
            ("Badam Milk (Hot)", "Rich whole milk simmered with natural almond paste and green cardamom.", 30, "VEG", "MILD", "Dairy, Nuts", False, False, 4)
        ]
    },
    {
        "name": "VB Bakery VV Puram",
        "locality": "VV Puram",
        "landmark": "Sajjan Rao Circle, Food Street",
        "pincode": "560004",
        "lat": 12.9515, "lng": 77.5780,
        "address": "20, Sajjan Rao Circle, VV Puram, Bengaluru",
        "cuisine": "Bakery, Snacks, Traditional Biscuits, Heritage",
        "rating": 4.7, "reviews": 21000, "pure_veg": True, "price_tier": "$", "cost_for_two": 200,
        "phone": "+918026677000", "email": "heritage@vbbakery.com", "banner": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200",
        "dishes": [
            ("Congress Bun with Butter", "Soft sweet bun sliced and layered with generous Amul butter and spicy roasted Congress peanuts.", 45, "VEG", "MEDIUM", "Gluten, Dairy, Peanuts", True, True, 4),
            ("Kodu Bele (250g Pouch)", "Authentic crunchy Karnataka ring-shaped savoury snack spiced with hing, cumin, and red chillies.", 80, "VEG", "SPICY", "Gluten", True, True, 4),
            ("Damroot Halwa (Ash Gourd)", "Rich caramelised winter melon halwa slow cooked in pure ghee, sugar, and roasted cashews.", 70, "VEG", "MILD", "Dairy, Nuts", True, True, 5),
            ("Benne Biscuit (250g Box)", "Melt-in-mouth traditional butter cookies baked to golden perfection.", 90, "VEG", "MILD", "Gluten, Dairy", True, False, 4),
            ("Khara Biscuit (250g Box)", "Crispy savoury biscuits spiced with green chillies, curry leaves, and ginger.", 90, "VEG", "MEDIUM", "Gluten, Dairy", True, False, 4),
            ("Veg Puff", "Crispy flaky puff pastry stuffed with spiced potato, carrot, and green peas filling.", 30, "VEG", "MEDIUM", "Gluten", True, False, 6),
            ("Paneer Puff", "Flaky golden puff loaded with spiced paneer tikka filling.", 40, "VEG", "MEDIUM", "Gluten, Dairy", False, False, 6),
            ("Honey Cake Slice", "Traditional bakery sponge cake soaked in honey syrup, topped with mixed fruit jam and desiccated coconut.", 35, "VEG", "MILD", "Gluten", True, False, 4),
            ("Dilpasand (Full)", "Flaky puff pastry stuffed with sweet coconut, candied fruit tooty-frooty, and tutti frutti filling.", 90, "VEG", "MILD", "Gluten", True, False, 5),
            ("Apple Cake", "Soft spiced cake packed with stewed apple bits and cinnamon.", 40, "VEG", "MILD", "Gluten", False, False, 4)
        ]
    },
    # Frazer Town / Shivaji Nagar
    {
        "name": "Shivaji Military Hotel",
        "locality": "Shivaji Nagar",
        "landmark": "Near Jayanagar / Shivaji Nagar Heritage",
        "pincode": "560001",
        "lat": 12.9830, "lng": 77.6025,
        "address": "718, 1st C Main, 8th Block, Shivaji Nagar, Bengaluru",
        "cuisine": "Military Hotel, Mutton Biryani, Karnataka Non-Veg, Heritage",
        "rating": 4.6, "reviews": 25400, "pure_veg": False, "price_tier": "$$", "cost_for_two": 600,
        "phone": "+918026634444", "email": "shivaji@militaryhotel.com", "banner": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200",
        "dishes": [
            ("Mutton Donne Biryani", "Legendary Bengaluru donne biryani: fragrant short-grain seeraga samba rice cooked with tender mutton and served in palm-leaf cups.", 340, "NON_VEG", "SPICY", "Dairy", True, True, 18),
            ("Chicken Donne Biryani", "Aromatic green herb spiced seeraga samba rice cooked with succulent country chicken.", 260, "NON_VEG", "SPICY", "Dairy", True, True, 15),
            ("Mutton Dry Pepper Fry", "Tender baby goat cuts roasted dry on heavy iron tawa with crushed black pepper and onions.", 360, "NON_VEG", "EXTRA_SPICY", "None", True, True, 20),
            ("Chicken Dry Fry", "Country chicken pieces fried with green chillies, curry leaves, and Maratha military spices.", 280, "NON_VEG", "SPICY", "None", True, False, 16),
            ("Mutton Chops Curry", "Succulent mutton rib chops cooked in rich cilantro and poppy seed spiced gravy.", 370, "NON_VEG", "SPICY", "Nuts", True, True, 20),
            ("Mutton Keema Ball Curry (4 Pcs)", "Spiced minced meat meatballs simmered in traditional Karnataka military green curry.", 310, "NON_VEG", "SPICY", "None", True, False, 18),
            ("Mutton Brain Masala", "Tender goat brain tossed with onions, green chillies, and cracked Tellicherry black pepper.", 290, "NON_VEG", "SPICY", "None", True, False, 15),
            ("Mutton Liver Fry", "Pan-fried fresh mutton liver morsels with onions, garlic, and freshly roasted spices.", 280, "NON_VEG", "SPICY", "None", False, False, 16),
            ("Mutton Leg Soup (Paya)", "Traditional slow-simmered bone marrow broth with ginger, black pepper, and mint.", 180, "NON_VEG", "MEDIUM", "None", True, False, 12),
            ("Egg Biryani Donne", "Spiced seeraga samba donne rice served with two hard-boiled eggs and spicy gravy.", 210, "EGG", "SPICY", "Eggs", False, False, 14),
            ("Kushka Rice (Biryani Rice)", "Plain aromatic donne biryani rice cooked in seasoned mutton broth, served with salan and raita.", 160, "NON_VEG", "MEDIUM", "Dairy", True, False, 10),
            ("Chicken Kabab (6 Pcs)", "Crispy deep-fried bone-in spiced red chicken morsels with curry leaves.", 260, "NON_VEG", "SPICY", "Eggs", True, False, 14)
        ]
    },
    {
        "name": "Albert Bakery Frazer Town",
        "locality": "Frazer Town",
        "landmark": "Mosque Road, Frazer Town",
        "pincode": "560005",
        "lat": 12.9972, "lng": 77.6138,
        "address": "93, Mosque Rd, Cleveland Town, Pulikeshi Nagar, Bengaluru",
        "cuisine": "Bakery, Snacks, Mughlai, Ramadan Heritage",
        "rating": 4.8, "reviews": 28600, "pure_veg": False, "price_tier": "$", "cost_for_two": 250,
        "phone": "+918025482222", "email": "orders@albertbakery.in", "banner": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200",
        "dishes": [
            ("Mutton Samosa (2 Pcs)", "The iconic Bengaluru Ramadan treat: paper-thin crunchy triangular pastry stuffed with spicy minced mutton and mint.", 90, "NON_VEG", "MEDIUM", "Gluten", True, True, 5),
            ("Chicken Keema Naan", "Tandoori baked flatbread stuffed with spiced minced chicken, brushed with butter.", 120, "NON_VEG", "MEDIUM", "Gluten, Dairy", True, True, 8),
            ("Bheja Puff (Mutton Brain)", "Flaky puff pastry stuffed with spiced pan-tossed goat brain and chopped onions.", 110, "NON_VEG", "SPICY", "Gluten", True, False, 8),
            ("Chicken Cutlet (2 Pcs)", "Minced chicken patties blended with potatoes and spices, coated in breadcrumbs and fried crisp.", 80, "NON_VEG", "MEDIUM", "Gluten, Eggs", True, False, 6),
            ("Coconut Khova Naan", "Sweet tandoori naan stuffed with fresh grated coconut, khoya, and raisins, dusted with sugar.", 95, "VEG", "MILD", "Gluten, Dairy", True, True, 6),
            ("Cocktail Chicken Samosa (4 Pcs)", "Bite-sized miniature crispy samosas filled with spicy shredded chicken.", 80, "NON_VEG", "MEDIUM", "Gluten", True, False, 5),
            ("Mutton Seekh Roll", "Spiced minced mutton kebab wrapped in soft flatbread with green chutney and onions.", 130, "NON_VEG", "MEDIUM", "Gluten", True, False, 8),
            ("Plum Cake (250g)", "Traditional rich dark fruit cake soaked in spice syrup and loaded with raisins and candied peel.", 160, "EGG", "MILD", "Gluten, Eggs", True, True, 4),
            ("Chocolate Swiss Roll", "Fluffy chocolate sponge cake rolled with rich vanilla cream and dusted with cocoa.", 60, "EGG", "MILD", "Gluten, Eggs, Dairy", False, False, 4),
            ("Chicken Puff", "Golden flaky puff pastry filled with creamy curried chicken and boiled egg slice.", 45, "NON_VEG", "MEDIUM", "Gluten, Eggs", True, False, 6)
        ]
    }
]

print(f"Loaded template with {len(RESTAURANTS_DATA)} base core restaurants. Expanding catalog to 52 restaurants...")

# Additional authentic Bengaluru landmark restaurants to reach 52 total
ADDITIONAL_RESTAURANTS = [
    # Koramangala
    ("Prost Brew Pub Koramangala", "Koramangala", "80 Feet Road, 4th Block", "560034", 12.9358, 77.6225, "Brewpub, European, Continental, Pizza", 4.6, 17200, False, "$$$", 1200),
    ("Kota Kachori Koramangala", "Koramangala", "Near BDA Complex, 5th Block", "560095", 12.9340, 77.6180, "Street Food, North Indian, Pure Veg, Sweets", 4.4, 9800, True, "$", 300),
    ("Beijing Bites Koramangala", "Koramangala", "1st Cross, 5th Block", "560095", 12.9360, 77.6155, "Chinese, Thai, Asian, Noodles, Dim Sum", 4.3, 11400, False, "$$", 650),
    ("Onesta Koramangala", "Koramangala", "4th Block, 80 Feet Road", "560034", 12.9335, 77.6260, "Pizza, Italian, Desserts, Unlimited", 4.2, 14500, False, "$$", 550),
    ("Anupam's Coast II Coast Koramangala", "Koramangala", "Near Forum Mall, 5th Block", "560095", 12.9365, 77.6130, "Mangalorean, Seafood, Coastal, Ghee Roast", 4.5, 12800, False, "$$", 800),
    ("Chianti Italian Restaurant Koramangala", "Koramangala", "5th Block, 1st Cross", "560095", 12.9350, 77.6160, "Italian, Fine Dining, Pasta, Pizza, Wine", 4.7, 9200, False, "$$$", 1400),
    ("Buff Buffet Buff Koramangala", "Koramangala", "Industrial Layout, 5th Block", "560095", 12.9345, 77.6190, "Buffet, North Indian, Barbecue, Desserts", 4.3, 8900, False, "$$$", 1100),
    
    # Indiranagar
    ("Chinita Real Mexican Food Indiranagar", "Indiranagar", "Double Road, 2nd Stage", "560038", 12.9725, 77.6385, "Mexican, Tacos, Burritos, Quesadillas", 4.6, 8400, False, "$$", 900),
    ("Copper Chimney Indiranagar", "Indiranagar", "100 Feet Road, HAL 2nd Stage", "560038", 12.9750, 77.6405, "North Indian, Mughlai, Kebabs, Biryani", 4.5, 13100, False, "$$", 950),
    ("Burma Burma Indiranagar", "Indiranagar", "100 Feet Road, Near 12th Main", "560038", 12.9740, 77.6410, "Burmese, Asian, Tea Room, Pure Veg", 4.8, 14200, True, "$$$", 1100),
    ("Mamagoto Indiranagar", "Indiranagar", "12th Main Road, HAL 2nd Stage", "560038", 12.9715, 77.6420, "Pan-Asian, Sushi, Dim Sum, Bowls", 4.4, 9600, False, "$$", 1000),
    ("Smoke House Deli Indiranagar", "Indiranagar", "100 Feet Road, Near Domlur Flyover", "560038", 12.9770, 77.6400, "European, Cafe, Breakfast, Steaks", 4.5, 11800, False, "$$$", 1200),
    ("Smoor Chocolates Indiranagar", "Indiranagar", "100 Feet Road, 1st Stage", "560038", 12.9760, 77.6408, "Desserts, Chocolatier, Bakery, Cafe", 4.6, 16400, True, "$$", 700),
    ("Bob's Bar Indiranagar", "Indiranagar", "100 Feet Road, HAL 2nd Stage", "560038", 12.9730, 77.6395, "South Indian, Bar Food, Local, Andhra", 4.5, 18900, False, "$$", 750),

    # Jayanagar
    ("Cool Joint Jayanagar", "Jayanagar", "11th Main, 4th Block", "560011", 12.9290, 77.5835, "Sandwiches, Milkshakes, Ice Cream, Street Food", 4.5, 15400, True, "$", 250),
    ("Shiv Sagar Jayanagar", "Jayanagar", "3rd Block, 10th Main", "560011", 12.9310, 77.5815, "Fast Food, Chaat, Pav Bhaji, Pure Veg", 4.3, 11200, True, "$$", 450),
    ("Upahara Darshini Jayanagar", "Jayanagar", "8th Block, 27th Cross", "560070", 12.9220, 77.5800, "South Indian, Quick Service, Pure Veg, Filter Coffee", 4.6, 17800, True, "$", 180),
    ("Brahmin's Thatte Idli Jayanagar", "Jayanagar", "9th Block, 39th Cross", "560069", 12.9180, 77.5880, "South Indian, Thatte Idli, Pure Veg, Vada", 4.7, 13400, True, "$", 150),
    ("Corner House Ice Cream Jayanagar", "Jayanagar", "4th Block, 11th Main", "560011", 12.9280, 77.5840, "Ice Cream, DBC, Sundaes, Desserts", 4.8, 31200, True, "$", 300),

    # Malleshwaram
    ("Janatha Hotel Malleshwaram", "Malleshwaram", "8th Cross, Sampige Road", "560003", 13.0040, 77.5715, "Heritage South Indian, Pure Veg, Masala Dosa", 4.6, 14300, True, "$", 180),
    ("Raghavendra Stores Malleshwaram", "Malleshwaram", "Near Railway Station, 1st Main", "560003", 12.9980, 77.5730, "South Indian, Idli, Shavige Bath, Filter Coffee", 4.7, 18900, True, "$", 120),
    ("Asha Food Camp Malleshwaram", "Malleshwaram", "10th Cross, Temple Street", "560003", 13.0055, 77.5695, "Pure Veg, North Indian, South Indian, Chaat", 4.4, 9800, True, "$$", 450),
    ("Iyer Mess Malleshwaram", "Malleshwaram", "7th Cross, Between Margosa & Sampige", "560003", 13.0035, 77.5708, "Tamil Brahmin Meals, South Indian, Pure Veg", 4.7, 8600, True, "$", 160),

    # Church Street / Central
    ("Harima Japanese Restaurant", "Church Street", "Residency Road, Shanthala Nagar", "560025", 12.9705, 77.6045, "Japanese, Authentic, Sushi, Ramen, Sashimi", 4.6, 6800, False, "$$$", 1600),
    ("Matteo Coffea Church Street", "Church Street", "Church Street, Near Brigade Road", "560001", 12.9745, 77.6055, "Coffee, European Cafe, Desserts, Shakes", 4.5, 16900, False, "$$", 550),
    ("Blossom Book Cafe Church Street", "Church Street", "Church Street, Next to Bookhouse", "560001", 12.9748, 77.6030, "Cafe, Bakery, Sandwiches, Herbal Tea", 4.7, 7200, True, "$", 350),
    ("Coconut Grove Church Street", "Church Street", "Church Street, Near Museum Road", "560001", 12.9743, 77.6020, "Coastal, Kerala, Chettinad, Seafood, Appam", 4.4, 11400, False, "$$", 850),
    ("Nagarjuna Residency Road", "Church Street", "Residency Road, Near Galaxy Theatre", "560025", 12.9710, 77.6060, "Andhra, Meals, Biryani, Chilli Chicken", 4.6, 24500, False, "$$", 700),

    # HSR Layout
    ("Anjappar Chettinad HSR", "HSR Layout", "17th Cross, Sector 6", "560102", 12.9140, 77.6390, "Chettinad, South Indian, Non-Veg, Biryani", 4.3, 10800, False, "$$", 700),
    ("Mishmash Restobar HSR", "HSR Layout", "27th Main, Sector 1", "560102", 12.9130, 77.6450, "North Indian, Continental, Finger Food, Biryani", 4.4, 8200, False, "$$", 850),
    ("Sri Udupi Park HSR Layout", "HSR Layout", "14th Main, Sector 7", "560102", 12.9090, 77.6420, "South Indian, Pure Veg, Dosa, Thali, Snacks", 4.5, 14600, True, "$", 220),
    ("Meghana Foods HSR Layout", "HSR Layout", "19th Main, Sector 1", "560102", 12.9150, 77.6480, "Biryani, Andhra, Spicy Non-Veg, Curries", 4.6, 18900, False, "$$", 600),

    # Whitefield
    ("The Big Barbeque Whitefield", "Whitefield", "ITPL Main Road, Mahadevapura", "560048", 12.9910, 77.7010, "Buffet, Live Grills, North Indian, Desserts", 4.4, 16500, False, "$$$", 1200),
    ("Salt Indian Restaurant Whitefield", "Whitefield", "VR Bengaluru Mall, Mahadevapura", "560048", 12.9960, 77.6980, "Contemporary Indian, North Indian, Kebabs", 4.5, 8700, False, "$$$", 1100),
    ("Bloomsbury's Boutique Whitefield", "Whitefield", "Phoenix Marketcity, Mahadevapura", "560048", 12.9950, 77.6970, "Artisan Bakery, European, Cafe, Pastas", 4.6, 7900, False, "$$", 800),
    ("Mainland China Whitefield", "Whitefield", "ITPL Main Road, Brookefield", "560037", 12.9680, 77.7120, "Chinese, Authentic Cantonese, Dim Sum", 4.5, 13400, False, "$$$", 1300),

    # Basavanagudi / VV Puram
    ("Rotti Mane VV Puram", "VV Puram", "Food Street, Old Tharagupet", "560004", 12.9520, 77.5775, "Akki Rotti, Ragi Rotti, Jolada Rotti, Karnataka", 4.6, 11200, True, "$", 180),
    ("Arya Vysya Refreshments VV Puram", "VV Puram", "Old Tharagupet, Sajjan Rao Circle", "560004", 12.9510, 77.5785, "Traditional South Indian, Curd Vada, Sweets", 4.7, 9800, True, "$", 150),
    ("SLV Coffee House Basavanagudi", "Basavanagudi", "Gandhi Bazaar Main Road", "560004", 12.9440, 77.5720, "South Indian, Pure Veg, Masala Dosa, Filter Kaapi", 4.6, 16800, True, "$", 160),

    # Frazer Town & Kalyan Nagar
    ("Karama Restaurant Frazer Town", "Frazer Town", "Mosque Road, Frazer Town", "560005", 12.9980, 77.6145, "Arabic, Mandi, Mughlai, Barbecue, Seafood", 4.5, 15400, False, "$$", 850),
    ("Rahhams Frazer Town", "Frazer Town", "MM Road, Pulikeshi Nagar", "560005", 12.9965, 77.6120, "Mughlai, Biryani, Mutton Chops, Tandoor", 4.4, 13200, False, "$$", 750),
    ("Jalpaan Kalyan Nagar", "Kalyan Nagar", "HRBR Layout, 1st Block", "560043", 13.0180, 77.6450, "Pure Veg, North Indian, Fondue, Italian", 4.4, 9100, True, "$$$", 1000),
    ("Brewklyn Microbrewery Kalyan Nagar", "Kalyan Nagar", "CMR Road, HRBR Layout 2nd Block", "560043", 13.0210, 77.6480, "Craft Beer, Continental, Pizzas, Burgers", 4.5, 11800, False, "$$", 1100),
    ("Chulha Chauki Da Dhaba Kalyan Nagar", "Kalyan Nagar", "Kammanahalli Main Road", "560084", 13.0150, 77.6410, "North Indian Dhaba, Tandoori Roti, Dal Makhani", 4.4, 12600, False, "$$", 650)
]

# Standard curated dish catalog by cuisine category so every single restaurant has 15-20 distinct real dishes with 0% markup
CUISINE_DISH_TEMPLATES = {
    "South Indian": [
        ("Ghee Masala Dosa", "Crispy golden fermented crepe smeared with red garlic chutney, spiced potato mash, roasted in fresh ghee.", 90, "VEG", "MEDIUM", "Dairy", True, True, 10),
        ("Ghee Plain Dosa", "Crispy golden crepe roasted on heavy cast iron tawa with aromatic ghee, served with coconut chutney.", 75, "VEG", "MILD", "Dairy", False, False, 8),
        ("Soft Steamed Idli (2 Pcs)", "Piping hot cotton-soft steamed fermented rice and black gram cakes with sambar and coconut chutney.", 40, "VEG", "MILD", "None", True, True, 5),
        ("Medu Vada (1 Pc)", "Crunchy golden fried urad dal donut infused with crushed black pepper, ginger, and curry leaves.", 40, "VEG", "MILD", "None", True, False, 5),
        ("Rava Masala Dosa", "Crispy lace-patterned semolina crepe loaded with green chillies, cumin seeds, and potato filling.", 110, "VEG", "MEDIUM", "Dairy, Gluten, Nuts", True, False, 12),
        ("Bisi Bele Bath", "Classic Karnataka spicy rice, toor dal, and garden vegetables stew topped with pure ghee and potato boondi.", 90, "VEG", "MEDIUM", "Dairy", True, True, 8),
        ("Chow Chow Bath", "Trio combination of spicy vegetable khara bath and sweet saffron pineapple kesari bath.", 85, "VEG", "MEDIUM", "Dairy, Nuts", True, False, 6),
        ("Poori Sagoo (3 Pcs)", "Puffed golden whole-wheat flatbreads served with traditional Karnataka mixed vegetable coconut sagoo.", 85, "VEG", "MILD", "Gluten", True, False, 10),
        ("Ghee Podi Idli (14 Pcs)", "Mini button idlis tossed with fiery roasted gunpowder and hot clarified country butter.", 100, "VEG", "MEDIUM", "Dairy", True, False, 8),
        ("Curd Vada (2 Pcs)", "Medu vadas soaked in thick seasoned churned curd garnished with roasted cumin and fresh coriander.", 80, "VEG", "MILD", "Dairy", False, False, 6),
        ("Filter Coffee", "Heritage South Indian coffee brewed from fresh roasted chicory-blended beans with frothed boiled milk.", 35, "VEG", "MILD", "Dairy", True, True, 4),
        ("Mangalore Buns (2 Pcs)", "Sweet banana fermented deep-fried bread served with spicy coconut chutney and veg sagoo.", 75, "VEG", "MILD", "Gluten, Dairy", True, False, 8),
        ("Akki Rotti (2 Pcs)", "Crispy Karnataka rice flour flatbread with chopped dill leaves, onions, and cumin seeds.", 95, "VEG", "MEDIUM", "None", True, True, 12),
        ("Neer Dosa (3 Pcs)", "Delicate lace-thin steamed rice crepes from Coastal Karnataka served with coconut jaggery and chutney.", 90, "VEG", "MILD", "Coconut", False, False, 8),
        ("Badam Halwa", "Rich almond confection simmered in pure country ghee with saffron strands and cardamom.", 85, "VEG", "MILD", "Dairy, Nuts", False, False, 5)
    ],
    "Biryani / North Indian": [
        ("Special Dum Chicken Biryani", "Aromatic long-grain basmati rice layered with spiced marinated chicken in sealed handi.", 320, "NON_VEG", "SPICY", "Dairy", True, True, 20),
        ("Special Mutton Biryani", "Tender baby goat cuts slow-cooked with saffron, caramelised onions, and royal garam masala.", 420, "NON_VEG", "SPICY", "Dairy", True, True, 25),
        ("Butter Chicken (Murgh Makhani)", "Charcoal tandoor grilled chicken simmered in velvety tomato, butter, and cashew nut gravy.", 340, "NON_VEG", "MILD", "Dairy, Nuts", True, True, 18),
        ("Paneer Butter Masala", "Cubes of malai paneer simmered in silky tomato-cashew butter sauce with kasuri methi.", 280, "VEG", "MILD", "Dairy, Nuts", True, False, 16),
        ("Dal Makhani", "Slow simmered whole black lentils cooked overnight with cultured butter and fresh cream.", 240, "VEG", "MILD", "Dairy", True, False, 15),
        ("Chicken Tikka (6 Pcs)", "Boneless chicken morsels marinated in mustard oil, Kashmiri chilli, and curd, clay-oven roasted.", 310, "NON_VEG", "MEDIUM", "Dairy", True, False, 16),
        ("Paneer Tikka Tandoori (6 Pcs)", "Cottage cheese cubes with bell peppers and onions marinated in spiced yogurt and grilled.", 270, "VEG", "MEDIUM", "Dairy", True, False, 16),
        ("Garlic Butter Naan", "Tandoori baked refined flour flatbread studded with minced roasted garlic and fresh butter.", 60, "VEG", "MILD", "Gluten, Dairy", False, False, 8),
        ("Butter Roti", "Whole-wheat flatbread cooked on tandoor walls brushed with melted butter.", 40, "VEG", "MILD", "Gluten, Dairy", False, False, 6),
        ("Chicken 65", "Crispy deep-fried boneless chicken cubes tossed with curry leaves, slit green chillies, and yogurt.", 290, "NON_VEG", "SPICY", "Eggs", True, False, 15),
        ("Egg Biryani", "Boiled eggs roasted in spiced gravy layered with fragrant saffron basmati rice.", 240, "EGG", "MEDIUM", "Eggs", False, False, 15),
        ("Veg Dum Biryani", "Seasonal vegetables and paneer cooked with mint, browned onions, and aged basmati rice.", 250, "VEG", "MEDIUM", "Dairy", False, False, 18),
        ("Gulab Jamun (2 Pcs)", "Warm khoya milk solids balls soaked in rose and cardamom scented sugar syrup.", 70, "VEG", "MILD", "Dairy, Gluten", True, False, 5),
        ("Tandoori Chicken (Half)", "Spring chicken marinated in red chilli yogurt paste and roasted in clay tandoor.", 260, "NON_VEG", "MEDIUM", "Dairy", True, False, 20),
        ("Jeera Rice with Dal Tadka", "Basmati rice tempered with cumin seeds paired with yellow toor dal tempered with garlic and ghee.", 220, "VEG", "MILD", "Dairy", False, False, 12)
    ],
    "Continental / European / Cafe": [
        ("Wood-Fired Margherita Pizza", "San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.", 420, "VEG", "MILD", "Dairy, Gluten", True, True, 18),
        ("Smoky BBQ Chicken Pizza", "Mesquite smoked chicken breast, barbecue drizzle, caramelised onions, and mozzarella.", 490, "NON_VEG", "MEDIUM", "Dairy, Gluten", True, True, 20),
        ("Creamy Alfredo Chicken Pasta", "Penne tossed in garlic parmesan cream sauce with grilled herb chicken strips.", 380, "NON_VEG", "MILD", "Dairy, Gluten", True, False, 16),
        ("Arrabiata Pasta with Olives", "Spaghetti tossed in fiery plum tomato sauce, garlic, chilli flakes, and fresh basil.", 320, "VEG", "MEDIUM", "Gluten", False, False, 16),
        ("Crispy Chicken Burger", "Crumb fried chicken fillet with iceberg lettuce and spicy mayo in toasted brioche bun.", 240, "NON_VEG", "MEDIUM", "Gluten, Dairy, Eggs", True, True, 15),
        ("Peri Peri Fries", "Golden french fries tossed in hot African peri peri seasoning, served with cheese dip.", 140, "VEG", "SPICY", "None", True, False, 8),
        ("Loaded Chicken Nachos", "Corn chips baked with cheese sauce, diced chicken, salsa, jalapeños, and sour cream.", 320, "NON_VEG", "MILD", "Dairy", True, False, 14),
        ("Fish & Chips", "Golden ale battered bhetki fillets served with hand-cut fries and caper tartar sauce.", 460, "NON_VEG", "MILD", "Fish, Gluten", True, True, 18),
        ("Classic Caesar Salad", "Crisp romaine hearts, sourdough croutons, parmesan shavings, and house caesar dressing.", 290, "VEG", "MILD", "Dairy, Gluten, Eggs", False, False, 10),
        ("Belgian Dark Chocolate Brownie", "Fudgy warm dark chocolate brownie served with vanilla bean ice cream and hot fudge.", 160, "VEG", "MILD", "Dairy, Gluten", True, True, 6),
        ("Cold Brew Coffee", "16-hour cold steeped single estate Chikmagalur Arabica coffee served over ice.", 170, "VEG", "MILD", "None", True, False, 4),
        ("Spanish Iced Latte", "Double espresso shot with chilled milk and sweetened condensed milk.", 190, "VEG", "MILD", "Dairy", True, False, 4),
        ("Butter Croissant", "Laminated flaky French butter pastry baked golden brown.", 120, "VEG", "MILD", "Dairy, Gluten", False, False, 4),
        ("Grilled Mushroom Cheese Sandwich", "Sautéed wild mushrooms and melted mozzarella in grilled sourdough bread.", 240, "VEG", "MILD", "Dairy, Gluten", False, False, 12),
        ("Tiramisu", "Espresso soaked savoiardi biscuits layered with sweet mascarpone sabayon and dusted with cocoa.", 240, "EGG", "MILD", "Dairy, Eggs, Gluten", True, False, 5)
    ],
    "Asian / Chinese": [
        ("Chicken Hakka Noodles", "Wok-tossed noodles with shredded chicken, cabbage, bell peppers, carrots, and light soy sauce.", 240, "NON_VEG", "MILD", "Gluten, Soy, Eggs", True, True, 14),
        ("Veg Hakka Noodles", "Wok-tossed noodles with shredded vegetables, scallions, and light seasoning.", 200, "VEG", "MILD", "Gluten, Soy", False, False, 12),
        ("Chilli Chicken Gravy", "Crispy boneless chicken bites tossed with onions, green chillies, garlic, and dark soy reduction.", 280, "NON_VEG", "SPICY", "Gluten, Soy", True, True, 15),
        ("Chilli Paneer Dry", "Cottage cheese cubes tossed with capsicum, spring onions, and spicy Indo-Chinese chilli sauce.", 250, "VEG", "SPICY", "Dairy, Soy, Gluten", True, False, 14),
        ("Chicken Schezwan Fried Rice", "Wok-tossed basmati rice with chicken, eggs, and fiery house Schezwan chilli pepper paste.", 260, "NON_VEG", "SPICY", "Eggs, Soy", True, True, 15),
        ("Steamed Chicken Dim Sums (6 Pcs)", "Translucent pleated dumplings stuffed with juicy minced chicken and scallions.", 260, "NON_VEG", "MILD", "Gluten, Soy", True, False, 12),
        ("Crispy Corn Pepper Salt", "Golden fried sweet corn kernels tossed with cracked black pepper, garlic, and spring onions.", 210, "VEG", "MEDIUM", "Gluten", True, False, 10),
        ("Kung Pao Chicken", "Diced chicken stir-fried with roasted peanuts, dry red chillies, and sweet-spicy soy glaze.", 310, "NON_VEG", "MEDIUM", "Peanuts, Soy", True, False, 16),
        ("Veg Manchurian Gravy", "Crisp vegetable balls simmered in savory garlic, coriander, and soya broth.", 220, "VEG", "MEDIUM", "Gluten, Soy", False, False, 14),
        ("Chicken Manchow Soup", "Spicy and sour thick chicken soup with garlic, coriander, and crispy fried noodles.", 140, "NON_VEG", "MEDIUM", "Gluten, Soy", True, False, 10),
        ("Spring Rolls (4 Pcs)", "Crispy fried rolls stuffed with seasoned shredded vegetables, served with sweet chilli dip.", 180, "VEG", "MILD", "Gluten", False, False, 12),
        ("Honey Chilli Potatoes", "Crispy fried potato fingers glazed in honey, chilli garlic sauce, and toasted sesame seeds.", 190, "VEG", "MEDIUM", "Gluten, Sesame", True, False, 12),
        ("Chicken Thai Green Curry with Jasmine Rice", "Sliced chicken breast simmered in fragrant coconut milk green curry paste with Thai basil.", 380, "NON_VEG", "MEDIUM", "Coconut", True, True, 18),
        ("Wok Tossed Black Pepper Prawns", "Ocean prawns stir-fried in rich cracked Tellicherry black pepper and oyster glaze.", 440, "NON_VEG", "SPICY", "Crustacean, Soy", True, False, 18),
        ("Darsaan with Vanilla Ice Cream", "Honey glazed crispy fried flat noodles sprinkled with sesame seeds, served with vanilla ice cream.", 150, "VEG", "MILD", "Gluten, Dairy, Sesame", True, False, 6)
    ]
}

print("Building 52 restaurants dataset...")

# Assemble the full 52 restaurants list
all_restaurants = list(RESTAURANTS_DATA)

for name, locality, landmark, pincode, lat, lng, cuisine, rating, reviews, pure_veg, price_tier, cost_for_two in ADDITIONAL_RESTAURANTS:
    # Pick matching dish template
    if "South Indian" in cuisine or "Dosa" in cuisine or "Idli" in cuisine or "Meals" in cuisine:
        template = CUISINE_DISH_TEMPLATES["South Indian"]
    elif "Biryani" in cuisine or "North Indian" in cuisine or "Mughlai" in cuisine or "Dhaba" in cuisine or "Chettinad" in cuisine:
        template = CUISINE_DISH_TEMPLATES["Biryani / North Indian"]
    elif "Chinese" in cuisine or "Asian" in cuisine or "Thai" in cuisine or "Sushi" in cuisine or "Dim Sum" in cuisine:
        template = CUISINE_DISH_TEMPLATES["Asian / Chinese"]
    else:
        template = CUISINE_DISH_TEMPLATES["Continental / European / Cafe"]

    slug = slugify(f"{name}-{locality}")
    dishes = list(template) # 15 dishes
    
    rest_obj = {
        "name": name,
        "locality": locality,
        "landmark": landmark,
        "pincode": pincode,
        "lat": lat,
        "lng": lng,
        "address": f"{landmark}, {locality}, Bengaluru",
        "cuisine": cuisine,
        "rating": rating,
        "reviews": reviews,
        "pure_veg": pure_veg,
        "price_tier": price_tier,
        "cost_for_two": cost_for_two,
        "phone": f"+9180{20000000 + len(all_restaurants) * 739}",
        "email": f"partner.{slug}@cravepulse.in",
        "banner": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
        "dishes": dishes
    }
    all_restaurants.append(rest_obj)

print(f"Total restaurants to insert: {len(all_restaurants)}")

total_dishes_count = sum(len(r["dishes"]) for r in all_restaurants)
print(f"Total dishes to insert: {total_dishes_count}")

# Generate SQL script
sql_lines = []
sql_lines.append("-- ==============================================================================")
sql_lines.append("-- CravePulse V6 Migration: Authentic Bangalore Food Scene Catalog")
sql_lines.append(f"-- 52 Iconic Restaurants, {total_dishes_count} Authentic Dishes, 0% Markup Dine-In Price Parity")
sql_lines.append("-- ==============================================================================\n")

# Starting user_id for partners = 20
user_id = 20
rest_id = 6 # (IDs 1-5 already exist in V2__seed.sql)
cat_id = 20
item_id = 20
variant_id = 20
addon_id = 20
parity_id = 1

for r in all_restaurants:
    r_slug = slugify(f"{r['name']}-{r['locality']}")
    u_email = f"owner.{r_slug[:40]}@cravepulse.in"
    u_phone = r["phone"]
    u_name = f"Partner {r['name'][:30]}"
    
    # 1. Insert User for restaurant owner
    sql_lines.append(f"INSERT INTO users (id, full_name, email, phone, password_hash, role, status, wallet_balance) "
                     f"VALUES ({user_id}, '{u_name}', '{u_email}', '{u_phone}', "
                     f"'$2a$10$eEBaAZPnJwFRucHuTj0louKN9D/rqRBbTuP9T.dJ7QR/PYnqgOwgq', 'RESTAURANT_OWNER', 'ACTIVE', 5000.00) "
                     f"ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);")
    
    # 2. Insert Restaurant Profile
    sql_lines.append(f"INSERT INTO restaurant_profiles (id, user_id, name, slug, description, banner_image, logo_image, "
                     f"phone, email, cuisine_types, rating, total_reviews, pure_veg, price_tier, prep_time_min, prep_time_max, "
                     f"latitude, longitude, address, fssai_license, commission_rate, max_concurrent_orders, current_load, is_open, is_auto_throttled, is_kyc_approved, "
                     f"gst_number, cost_for_two, hygiene_rating, locality, landmark, pincode) "
                     f"VALUES ({rest_id}, {user_id}, '{r['name']}', '{r_slug}', 'Authentic {r['cuisine']} in {r['locality']}, Bengaluru. 0% markup dine-in price parity guaranteed.', "
                     f"'{r['banner']}', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200', '{u_phone}', '{u_email}', "
                     f"'{r['cuisine']}', {r['rating']}, {r['reviews']}, {1 if r['pure_veg'] else 0}, '{r['price_tier']}', 15, 30, "
                     f"{r['lat']}, {r['lng']}, '{r['address']}', 'FSSAI-{29000000000000 + rest_id}', 15.00, 25, 0, TRUE, FALSE, TRUE, "
                     f"'29AAAAA{rest_id:04d}A1Z5', {r['cost_for_two']}, 4.8, '{r['locality']}', '{r['landmark']}', '{r['pincode']}') "
                     f"ON DUPLICATE KEY UPDATE name=VALUES(name), locality=VALUES(locality), cost_for_two=VALUES(cost_for_two);")

    # 3. Create Categories for this restaurant
    categories = [
        (cat_id, "Signature Specialties", 1),
        (cat_id + 1, "Popular Mains & Combos", 2),
        (cat_id + 2, "Starters & Accompaniments", 3),
        (cat_id + 3, "Beverages & Desserts", 4)
    ]
    for c_id, c_name, c_order in categories:
        sql_lines.append(f"INSERT INTO menu_categories (id, restaurant_id, name, display_order, is_active) "
                         f"VALUES ({c_id}, {rest_id}, '{c_name}', {c_order}, TRUE) "
                         f"ON DUPLICATE KEY UPDATE name=VALUES(name);")

    # 4. Insert Menu Items with 0% Markup Dine-In = Platform Price Parity
    for i, dish_tuple in enumerate(r["dishes"]):
        dish_name, dish_desc, price, food_type, spice, allergen, is_best, is_chef, prep_time = dish_tuple
        d_slug = slugify(f"{dish_name}-{r['locality']}")
        d_cat = cat_id + (i % 4) # distribute into categories
        is_v = (food_type == "VEG")
        img = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" if is_v else "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500"
        
        escaped_desc = dish_desc.replace("'", "''")
        escaped_name = dish_name.replace("'", "''")

        sql_lines.append(f"INSERT INTO menu_items (id, restaurant_id, category_id, name, slug, description, image_url, "
                         f"dine_in_price, platform_price, is_veg, food_type, spice_level, packaging_charge, is_bestseller, is_chef_special, "
                         f"is_available, prep_time_minutes, calorie_count, rating, total_orders, allergen_info) "
                         f"VALUES ({item_id}, {rest_id}, {d_cat}, '{escaped_name}', '{d_slug}', '{escaped_desc}', '{img}', "
                         f"{price}.00, {price}.00, {1 if is_v else 0}, '{food_type}', '{spice}', 10.00, {1 if is_best else 0}, {1 if is_chef else 0}, "
                         f"TRUE, {prep_time}, 450, 4.8, 120, '{allergen}') "
                         f"ON DUPLICATE KEY UPDATE platform_price=VALUES(platform_price), dine_in_price=VALUES(dine_in_price);")

        # 5. Insert Price Parity Proof
        sql_lines.append(f"INSERT INTO price_parity_proofs (id, restaurant_id, menu_item_id, dine_in_menu_photo_url, difference_amount) "
                         f"VALUES ({parity_id}, {rest_id}, {item_id}, 'https://cravepulse.org/proofs/{r_slug}-{d_slug}.jpg', 0.00) "
                         f"ON DUPLICATE KEY UPDATE difference_amount=0.00;")
        parity_id += 1

        # Add variants for first 2 items of each category
        if i < 4:
            sql_lines.append(f"INSERT INTO menu_item_variants (id, menu_item_id, variant_name, price_adjustment, is_default, is_available) "
                             f"VALUES ({variant_id}, {item_id}, 'Regular Portion', 0.00, TRUE, TRUE), "
                             f"({variant_id + 1}, {item_id}, 'Large Portion', 50.00, FALSE, TRUE) "
                             f"ON DUPLICATE KEY UPDATE price_adjustment=VALUES(price_adjustment);")
            variant_id += 2

        # Add addon
        if i < 3:
            sql_lines.append(f"INSERT INTO menu_item_addons (id, menu_item_id, addon_name, price) "
                             f"VALUES ({addon_id}, {item_id}, 'Extra Portion / Dip', 30.00) "
                             f"ON DUPLICATE KEY UPDATE price=VALUES(price);")
            addon_id += 1

        item_id += 1

    cat_id += 4
    user_id += 1
    rest_id += 1

sql_content = "\n".join(sql_lines)

output_path = "c:\\Users\\ragip\\OneDrive\\Desktop\\100_Days_Full_Stack_Dev_Challenge\\Food_delivery_application\\backend\\src\\main\\resources\\db\\migration\\V6__phase3_bangalore_catalog.sql"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(sql_content)

print(f"Generated {output_path} successfully ({len(sql_lines)} lines, {len(all_restaurants)} restaurants, {item_id - 20} dishes).")
