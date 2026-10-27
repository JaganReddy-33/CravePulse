import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { MenuItemSkeleton } from '../../components/Skeleton';
import { DEFAULT_HUB } from '../../config/panIndiaLocations';
import ModalPortal from '../../components/ModalPortal';

// Distinct, authentic gourmet menus tailored for each restaurant
const RESTAURANT_CATALOG = {
  1: {
    id: 1,
    name: 'Spice Symphony & Grill',
    headChef: 'Chef Lohith',
    bannerImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200',
    description: 'Authentic gourmet North Indian curries, fragrant slow-cooked dum biryanis, tandoori kebabs, and handcrafted desserts curated by Chef Lohith.',
    rating: 4.8,
    totalReviews: 1420,
    fssaiLicense: 'FSSAI-11223344556677',
    prepTimeMin: 20,
    prepTimeMax: 30,
    pureVeg: false,
    categories: [
      { id: 101, name: 'Chef Lohith Specials' },
      { id: 102, name: 'Royal Dum Biryanis' },
      { id: 103, name: 'Rich Curries' },
      { id: 104, name: 'Tandoori Breads' },
      { id: 105, name: 'Artisan Desserts' },
    ],
    items: [
      {
        id: 1001,
        restaurantId: 1,
        categoryId: 101,
        name: 'Paneer Butter Masala',
        description: 'Fresh farm malai paneer cubes simmered in a silky tomato-cashew butter gravy perfumed with hand-crushed kasuri methi.',
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
        dineInPrice: 280.00,
        platformPrice: 280.00,
        veg: true,
        prepTimeMinutes: 15,
        calorieCount: 480,
        variants: [
          { id: 1, variantName: 'Regular Portion', priceAdjustment: 0.00, isDefault: true },
          { id: 2, variantName: 'Jumbo Share Bowl', priceAdjustment: 140.00, isDefault: false },
        ],
        addons: [{ id: 1, addonName: 'Extra Garlic Butter Glaze', price: 25.00 }]
      },
      {
        id: 1002,
        restaurantId: 1,
        categoryId: 102,
        name: 'Hyderabadi Chicken Dum Biryani',
        description: 'Aromatic long-grain basmati rice layered with spiced tender chicken, saffron milk, caramelized onions, and slow-cooked in sealed handi.',
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
        dineInPrice: 320.00,
        platformPrice: 320.00,
        veg: false,
        prepTimeMinutes: 20,
        calorieCount: 650,
        variants: [
          { id: 3, variantName: 'Single Pot (1 Person)', priceAdjustment: 0.00, isDefault: true },
          { id: 4, variantName: 'Family Handi (2-3 Persons)', priceAdjustment: 220.00, isDefault: false }
        ],
        addons: [{ id: 2, addonName: 'Spicy Mirchi Ka Salan & Raita Bowl', price: 35.00 }]
      },
      {
        id: 1003,
        restaurantId: 1,
        categoryId: 103,
        name: 'Charcoal Dal Makhani',
        description: 'Black lentils slow cooked overnight on charcoal tandoor embers with churned country butter and organic cream.',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
        dineInPrice: 240.00,
        platformPrice: 240.00,
        veg: true,
        prepTimeMinutes: 12,
        calorieCount: 390,
        variants: [],
        addons: []
      },
      {
        id: 1004,
        restaurantId: 1,
        categoryId: 104,
        name: 'Garlic Butter Chur Chur Naan',
        description: 'Crushed multi-layered clay oven leavened bread brushed with garlic butter and fresh garden coriander.',
        imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500',
        dineInPrice: 65.00,
        platformPrice: 65.00,
        veg: true,
        prepTimeMinutes: 6,
        calorieCount: 190,
        variants: [],
        addons: []
      },
      {
        id: 1005,
        restaurantId: 1,
        categoryId: 105,
        name: 'Royal Shahi Rabdi Gulab Jamun',
        description: 'Warm melt-in-mouth milk solids dumplings soaked in cardamom saffron syrup, topped with thick condensed rabdi and pistachios.',
        imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
        dineInPrice: 150.00,
        platformPrice: 150.00,
        veg: true,
        prepTimeMinutes: 5,
        calorieCount: 380,
        variants: [],
        addons: []
      }
    ]
  },
  2: {
    id: 2,
    name: 'Pizza Palace',
    headChef: 'Chef Ajay Kumar',
    bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200',
    description: 'Artisanal wood-fired Neapolitan sourdough pizzas, freshly hand-rolled pasta, and rustic Italian starters curated by Chef Ajay Kumar.',
    rating: 4.6,
    totalReviews: 980,
    fssaiLicense: 'FSSAI-22334455667788',
    prepTimeMin: 22,
    prepTimeMax: 32,
    pureVeg: false,
    categories: [
      { id: 201, name: 'Wood-Fired Pizzas' },
      { id: 202, name: 'Artisan Pastas' },
      { id: 203, name: 'Sides & Garlic Breads' },
      { id: 204, name: 'Italian Dolci' },
    ],
    items: [
      {
        id: 2001,
        restaurantId: 2,
        categoryId: 201,
        name: 'San Marzano Margherita Pizza',
        description: '48-hour fermented sourdough base, imported San Marzano tomato sauce, fresh Fior di Latte mozzarella, extra virgin olive oil, and sweet basil leaves.',
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500',
        dineInPrice: 399.00,
        platformPrice: 399.00,
        veg: true,
        prepTimeMinutes: 18,
        calorieCount: 720,
        variants: [
          { id: 5, variantName: '10 inch Medium Crust', priceAdjustment: 0.00, isDefault: true },
          { id: 6, variantName: '12 inch Large Sourdough', priceAdjustment: 160.00, isDefault: false },
        ],
        addons: [{ id: 3, addonName: 'Fresh Buffalo Burrata Topping', price: 95.00 }]
      },
      {
        id: 2002,
        restaurantId: 2,
        categoryId: 201,
        name: 'Smoked Chicken & Truffle Pizza',
        description: 'Hickory smoked pulled chicken breast, roasted wild mushrooms, caramelized balsamic onions, and white truffle oil drizzle.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500',
        dineInPrice: 479.00,
        platformPrice: 479.00,
        veg: false,
        prepTimeMinutes: 20,
        calorieCount: 840,
        variants: [
          { id: 7, variantName: '10 inch Medium', priceAdjustment: 0.00, isDefault: true },
          { id: 8, variantName: '12 inch Large', priceAdjustment: 180.00, isDefault: false },
        ],
        addons: [{ id: 4, addonName: 'Extra Shaved Aged Parmesan', price: 45.00 }]
      },
      {
        id: 2003,
        restaurantId: 2,
        categoryId: 202,
        name: 'Truffle Mushroom Fettuccine',
        description: 'Hand-rolled fresh egg pasta ribbons tossed in creamy porcini mushroom sauce with cracked black pepper and parmesan.',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281741?w=500',
        dineInPrice: 349.00,
        platformPrice: 349.00,
        veg: true,
        prepTimeMinutes: 15,
        calorieCount: 560,
        variants: [],
        addons: []
      },
      {
        id: 2004,
        restaurantId: 2,
        categoryId: 203,
        name: 'Cheesy Garlic Sourdough Pull-Apart',
        description: 'Crusty sourdough loaf stuffed with roasted garlic herb butter, bubbling mozzarella, and chili flakes.',
        imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500',
        dineInPrice: 189.00,
        platformPrice: 189.00,
        veg: true,
        prepTimeMinutes: 10,
        calorieCount: 380,
        variants: [],
        addons: []
      },
      {
        id: 2005,
        restaurantId: 2,
        categoryId: 204,
        name: 'Classic Espresso Tiramisu',
        description: 'Savoiardi ladyfingers soaked in dark roast espresso and Marsala reduction, layered with whipped mascarpone cream and cocoa powder.',
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
        dineInPrice: 220.00,
        platformPrice: 220.00,
        veg: true,
        prepTimeMinutes: 5,
        calorieCount: 420,
        variants: [],
        addons: []
      }
    ]
  },
  3: {
    id: 3,
    name: 'Burger House',
    headChef: 'Chef Santhosh Reddy',
    bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
    description: 'Juicy smashed double patties, toasted brioche buns, golden hand-cut fries, and creamy thick shakes curated by Chef Santhosh Reddy.',
    rating: 4.6,
    totalReviews: 2150,
    fssaiLicense: 'FSSAI-33445566778899',
    prepTimeMin: 15,
    prepTimeMax: 25,
    pureVeg: false,
    categories: [
      { id: 301, name: 'Gourmet Smashed Burgers' },
      { id: 302, name: 'Loaded Fries' },
      { id: 303, name: 'Wings & Starters' },
      { id: 304, name: 'Thick Shakes' },
    ],
    items: [
      {
        id: 3001,
        restaurantId: 3,
        categoryId: 301,
        name: 'Double Smash Cheddar Cheeseburger',
        description: 'Two crispy-edged smashed patties with melted sharp yellow cheddar, house dill pickles, caramelized sweet onions, and secret Crave relish on toasted brioche.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        dineInPrice: 299.00,
        platformPrice: 299.00,
        veg: false,
        prepTimeMinutes: 12,
        calorieCount: 680,
        variants: [
          { id: 9, variantName: 'Double Patty Classic', priceAdjustment: 0.00, isDefault: true },
          { id: 10, variantName: 'Triple Patty Beast', priceAdjustment: 90.00, isDefault: false },
        ],
        addons: [{ id: 5, addonName: 'Crispy Smoked Bacon Rashers', price: 60.00 }]
      },
      {
        id: 3002,
        restaurantId: 3,
        categoryId: 301,
        name: 'Crispy Peri-Peri Fried Chicken Burger',
        description: 'Buttermilk soaked fried chicken thigh coated in zesty peri-peri dust, creamy coleslaw, and spicy sriracha mayo.',
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500',
        dineInPrice: 279.00,
        platformPrice: 279.00,
        veg: false,
        prepTimeMinutes: 14,
        calorieCount: 620,
        variants: [],
        addons: []
      },
      {
        id: 3003,
        restaurantId: 3,
        categoryId: 302,
        name: 'Truffle Parmesan Hand-Cut Fries',
        description: 'Double-fried Idaho russet potato sticks tossed with pure white truffle oil, grated pecorino parmesan, and fresh parsley.',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500',
        dineInPrice: 179.00,
        platformPrice: 179.00,
        veg: true,
        prepTimeMinutes: 8,
        calorieCount: 420,
        variants: [],
        addons: []
      },
      {
        id: 3004,
        restaurantId: 3,
        categoryId: 304,
        name: 'Belgian Dark Chocolate Thick Shake',
        description: 'Chilled rich dairy milkshake blended with 70% dark Belgian cocoa ganache and topped with whipped cream swirl.',
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500',
        dineInPrice: 189.00,
        platformPrice: 189.00,
        veg: true,
        prepTimeMinutes: 5,
        calorieCount: 450,
        variants: [],
        addons: []
      }
    ]
  },
  4: {
    id: 4,
    name: 'Sushi World',
    headChef: 'Chef Kenji Sato',
    bannerImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200',
    description: 'Ultra-fresh Japanese sushi rolls, Norwegian salmon nigiri, and steaming bowls of slow-simmered miso ramen.',
    rating: 4.8,
    totalReviews: 860,
    fssaiLicense: 'FSSAI-44556677889900',
    prepTimeMin: 25,
    prepTimeMax: 35,
    pureVeg: false,
    categories: [
      { id: 401, name: 'Signature Sushi Rolls' },
      { id: 402, name: 'Nigiri & Sashimi' },
      { id: 403, name: 'Ramen Bowls' },
    ],
    items: [
      {
        id: 4001,
        restaurantId: 4,
        categoryId: 401,
        name: 'Norwegian Salmon & Avocado Uramaki',
        description: 'Prime Atlantic fresh salmon, ripe Hass avocado, toasted sesame seeds, seasoned sushi rice, and wasabi glaze.',
        imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500',
        dineInPrice: 480.00,
        platformPrice: 480.00,
        veg: false,
        prepTimeMinutes: 16,
        calorieCount: 380,
        variants: [
          { id: 11, variantName: '4 Pieces', priceAdjustment: 0.00, isDefault: true },
          { id: 12, variantName: '8 Pieces Full Roll', priceAdjustment: 340.00, isDefault: false },
        ],
        addons: [{ id: 6, addonName: 'Pickled Ginger & Japanese Wasabi', price: 20.00 }]
      },
      {
        id: 4002,
        restaurantId: 4,
        categoryId: 403,
        name: 'Rich Miso Ramen with Chashu',
        description: '12-hour simmered savory pork bone & miso broth, springy ramen noodles, marinated soft boiled egg, nori sheet, and scallions.',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500',
        dineInPrice: 420.00,
        platformPrice: 420.00,
        veg: false,
        prepTimeMinutes: 18,
        calorieCount: 580,
        variants: [],
        addons: []
      }
    ]
  },
  5: {
    id: 5,
    name: 'Healthy Bites',
    headChef: 'Nutritionist Priya Sen',
    bannerImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
    description: 'Macro-balanced nutrient power bowls, avocado detox salads, and 100% pure cold-pressed immunity juices.',
    rating: 4.5,
    totalReviews: 740,
    fssaiLicense: 'FSSAI-55667788990011',
    prepTimeMin: 15,
    prepTimeMax: 25,
    pureVeg: true,
    categories: [
      { id: 501, name: 'Superfood Power Bowls' },
      { id: 502, name: 'Detox Salads' },
      { id: 503, name: 'Cold-Pressed Juices' },
    ],
    items: [
      {
        id: 5001,
        restaurantId: 5,
        categoryId: 501,
        name: 'Mediterranean Quinoa & Roasted Veg Bowl',
        description: 'Organic fluffy quinoa, roasted zucchini, bell peppers, Kalamata olives, creamy hummus, and lemon-tahini dressing.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
        dineInPrice: 299.00,
        platformPrice: 299.00,
        veg: true,
        prepTimeMinutes: 12,
        calorieCount: 360,
        variants: [],
        addons: []
      },
      {
        id: 5002,
        restaurantId: 5,
        categoryId: 503,
        name: 'Green Goddess Detox Cold-Pressed Juice',
        description: 'Fresh cold-pressed blend of celery, English cucumber, green apple, spinach, ginger root, and Persian lime.',
        imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500',
        dineInPrice: 160.00,
        platformPrice: 160.00,
        veg: true,
        prepTimeMinutes: 5,
        calorieCount: 110,
        variants: [],
        addons: []
      }
    ]
  }
};

const RestaurantDetail = () => {
  const { id, slug, city } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam = id || slug || '1';
  let restId = 1;

  // 1. Check explicit restaurant_id in query params (Swiggy format: ?restaurant_id=639418)
  const qRestId = searchParams.get('restaurant_id');
  if (qRestId && !isNaN(Number(qRestId))) {
    restId = Number(qRestId);
  } else if (/rest(\d+)/i.test(rawParam)) {
    // 2. Check Swiggy slug suffix format: -rest639418
    restId = Number(rawParam.match(/rest(\d+)/i)[1]);
  } else if (/^\d+/.test(rawParam)) {
    restId = Number(rawParam.match(/^(\d+)/)[1]);
  } else if (/-\d+$/.test(rawParam)) {
    restId = Number(rawParam.match(/-(\d+)$/)[1]);
  } else if (!isNaN(Number(rawParam))) {
    restId = Number(rawParam);
  } else {
    const slugMap = {
      'spice-symphony-grill': 1,
      'pizza-palace': 2,
      'burger-house': 3,
      'sushi-world': 4,
      'healthy-bites': 5
    };
    restId = slugMap[rawParam.toLowerCase()] || 1;
  }
  const { addItem, removeItem, cart } = useCart();
  const { openPriceExplainer } = useOutletContext() || {};

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  
  // Initialize filter states from URL search params (Swiggy style: ?query=Biryani&category=102&veg_only=true)
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || 'all');
  const [loading, setLoading] = useState(true);
  const [dishSearch, setDishSearch] = useState(() => searchParams.get('query') || '');
  const [pureVegOnly, setPureVegOnly] = useState(() => searchParams.get('veg_only') === 'true');

  // Sync state when URL search params change externally
  useEffect(() => {
    const q = searchParams.get('query');
    if (q !== null && q !== dishSearch) {
      setDishSearch(q);
    }
    const cat = searchParams.get('category');
    if (cat !== null && cat !== activeCategory) {
      setActiveCategory(cat);
    }
    const veg = searchParams.get('veg_only');
    if (veg !== null) {
      setPureVegOnly(veg === 'true');
    }
  }, [searchParams]);

  // Helper to sync state changes back into URL Search Parameters
  const updateUrlParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  };

  // Selected customer hub (City + Locality)
  const [customerHub, setCustomerHub] = useState(() => {
    const saved = localStorage.getItem('cravepulse_hub');
    return saved ? JSON.parse(saved) : DEFAULT_HUB;
  });

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('cravepulse_hub');
      if (saved) setCustomerHub(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const catalogInfo = RESTAURANT_CATALOG[restId] || RESTAURANT_CATALOG[1];

      try {
        const [restRes, menuRes] = await Promise.all([
          api.get(`/restaurants/${restId}`),
          api.get(`/menu/restaurant/${restId}`),
        ]);

        if (restRes.success && restRes.data) {
          setRestaurant(restRes.data);
        } else {
          setRestaurant(catalogInfo);
        }

        let loadedCats = [];
        let loadedItems = [];

        if (menuRes.success && menuRes.data && menuRes.data.items?.length > 0) {
          loadedCats = menuRes.data.categories || catalogInfo.categories;
          loadedItems = menuRes.data.items || [];
        } else {
          loadedCats = catalogInfo.categories;
          loadedItems = catalogInfo.items;
        }

        // Merge any newly added custom dishes saved by restaurant owner from localStorage
        const customDishes = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
        const restaurantCustoms = customDishes.filter(d => Number(d.restaurantId) === restId);
        if (restaurantCustoms.length > 0) {
          loadedItems = [...restaurantCustoms, ...loadedItems];
        }

        setCategories(loadedCats);
        setItems(loadedItems);
      } catch (e) {
        console.warn('API error fetching restaurant, loading catalog data', e);
        setRestaurant(catalogInfo);
        setCategories(catalogInfo.categories);
        setItems(catalogInfo.items);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restId]);

  const handleOpenCustomizer = (item) => {
    if (item.variants?.length > 0 || item.addons?.length > 0) {
      setCustomizingItem(item);
      setSelectedVariant(item.variants?.find(v => v.isDefault) || item.variants[0] || null);
      setSelectedAddons([]);
    } else {
      addItem({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        item,
      });
    }
  };

  const handleAddCustomized = () => {
    addItem({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      item: customizingItem,
      variant: selectedVariant,
      addons: selectedAddons,
    });
    setCustomizingItem(null);
  };

  const toggleAddon = (addon) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="shimmer-skeleton rounded-4 mb-4" style={{ height: 260 }}></div>
        <MenuItemSkeleton />
        <MenuItemSkeleton />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container text-center py-5">
        <h4>Restaurant Not Found</h4>
        <Link to="/" className="btn btn-primary mt-3">Back to Restaurants</Link>
      </div>
    );
  }

  // Filter items reliably with String conversion
  const filteredItems = items.filter(it => {
    const matchesCategory =
      activeCategory === 'all' ||
      !activeCategory ||
      String(it.categoryId) === String(activeCategory);

    const matchesSearch =
      !dishSearch.trim() ||
      it.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
      (it.description && it.description.toLowerCase().includes(dishSearch.toLowerCase()));

    const matchesVeg = !pureVegOnly || it.veg === true;

    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Breadcrumb Navigation - Swiggy Canonical Pattern */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small align-items-center">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Home</Link></li>
          <li className="breadcrumb-item"><Link to={`/?city=${customerHub.cityId || 'bangalore'}`} className="text-decoration-none text-muted">{customerHub.cityName || 'Bangalore'}</Link></li>
          <li className="breadcrumb-item"><span className="text-muted">{customerHub.name || 'Indiranagar'}</span></li>
          <li className="breadcrumb-item active fw-bold text-dark" aria-current="page">{restaurant.name}</li>
        </ol>
      </nav>

      {/* Restaurant Header Banner Card - Compact, Premium & Multi-device Optimized */}
      <div className="card border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
        <div className="row g-0 align-items-center">
          {/* Restaurant Image Thumbnail / Cover */}
          <div className="col-12 col-md-4 col-lg-3 position-relative" style={{ minHeight: 160, maxHeight: 210 }}>
            <img 
              src={restaurant.bannerImage} 
              alt={restaurant.name} 
              className="w-100 h-100 object-fit-cover"
              style={{ minHeight: 160, maxHeight: 210 }} 
            />
            <div className="position-absolute top-0 start-0 m-2 badge bg-success shadow-sm rounded-pill px-2.5 py-1.5 d-flex align-items-center gap-1 small">
              <i className="bi bi-shield-check"></i>
              <span>0% Markup Parity</span>
            </div>
            {restaurant.headChef && (
              <div className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75 backdrop-blur rounded-pill px-2.5 py-1 text-white border border-light border-opacity-25 small">
                👨‍🍳 {restaurant.headChef}
              </div>
            )}
          </div>

          {/* Restaurant Meta Details */}
          <div className="col-12 col-md-8 col-lg-9 p-3 p-md-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-2">
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h3 className="fw-extrabold mb-0 text-dark fs-4 fs-md-3">{restaurant.name}</h3>
                  {restaurant.pureVeg && (
                    <span className="badge bg-success-subtle text-success border border-success px-2 py-1 small">
                      🌱 Pure Veg
                    </span>
                  )}
                </div>
                <p className="text-muted small mb-1 mt-1 line-clamp-2" style={{ maxWidth: 700 }}>
                  {restaurant.description}
                </p>
              </div>

              {/* Rating Badge */}
              <div className="badge bg-warning-subtle text-dark border px-3 py-2 fs-6 fw-bold rounded-3 shadow-2xs d-inline-flex align-items-center gap-1 text-nowrap align-self-start">
                <span className="text-warning">★</span> {restaurant.rating}
                <span className="text-muted fw-normal small">({restaurant.totalReviews || 1200}+)</span>
              </div>
            </div>

            {/* Hub, Distance & Prep Time Pills */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2.5 text-secondary small">
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-geo-alt-fill text-danger"></i>
                <span className="fw-semibold text-dark">{customerHub.name}, {customerHub.cityName}</span>
                <span className="text-muted">• 1.4 km</span>
              </span>
              <span className="text-muted">•</span>
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-clock-history text-primary"></i>
                <span>Prep: {restaurant.prepTimeMin || 20}-{restaurant.prepTimeMax || 30} mins</span>
              </span>
              <span className="text-muted">•</span>
              <span className="badge bg-light text-secondary border">
                FSSAI: {restaurant.fssaiLicense}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-primary text-decoration-none fw-semibold ms-auto"
                onClick={openPriceExplainer}
              >
                Fair Pricing Audit ⓘ
              </button>
            </div>

            {/* Zero Markup Physical Dine-In Parity Note */}
            <div className="px-3 py-1.5 rounded-3 bg-light border small text-muted d-flex align-items-center gap-2">
              <i className="bi bi-patch-check-fill text-success fs-6"></i>
              <span>Zero price inflation. Every single dish online matches the restaurant's printed menu price.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Filter Controls & Category Sticky Tabs */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white sticky-top" style={{ top: 72, zIndex: 10 }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          
          {/* Category Tabs: Reliable Active Highlighting & Item Counts */}
          <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap transition ${
                activeCategory === 'all'
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-light border text-dark bg-white'
              }`}
              style={activeCategory === 'all' ? { background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' } : {}}
              onClick={() => {
                setActiveCategory('all');
                updateUrlParam('category', null);
              }}
            >
              All Items ({items.length})
            </button>

            {categories.map(cat => {
              const catItemCount = items.filter(it => String(it.categoryId) === String(cat.id)).length;
              const isActive = String(activeCategory) === String(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap transition ${
                    isActive
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-light border text-dark bg-white'
                  }`}
                  style={isActive ? { background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' } : {}}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    updateUrlParam('category', cat.id);
                  }}
                >
                  {cat.name} ({catItemCount})
                </button>
              );
            })}
          </div>

          {/* Search in Menu + Pure Veg Filter */}
          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm rounded-pill overflow-hidden border" style={{ minWidth: 200 }}>
              <span className="input-group-text bg-white border-0 ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 ps-1"
                placeholder="Search menu..."
                value={dishSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setDishSearch(val);
                  updateUrlParam('query', val.trim() ? val : null);
                }}
              />
              {dishSearch && (
                <button
                  className="btn btn-white border-0 pe-3 text-muted"
                  onClick={() => {
                    setDishSearch('');
                    updateUrlParam('query', null);
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2 border text-nowrap transition ${
                pureVegOnly ? 'btn-success text-white' : 'btn-light text-dark bg-white'
              }`}
              onClick={() => {
                const nextVeg = !pureVegOnly;
                setPureVegOnly(nextVeg);
                updateUrlParam('veg_only', nextVeg ? 'true' : null);
              }}
            >
              <span className={`badge ${pureVegOnly ? 'bg-white' : 'bg-success'} p-1 rounded-circle`} style={{ width: 8, height: 8 }}></span>
              Pure Veg
            </button>
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="row g-4 mb-5">
        {filteredItems.length === 0 ? (
          <div className="col-12 text-center py-5">
            <div className="fs-1 mb-2">🍽️</div>
            <h5 className="fw-bold">No dishes found matching criteria</h5>
            <p className="text-muted small">Try selecting another category, clearing your search query, or toggling off pure veg.</p>
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-4"
              onClick={() => { setDishSearch(''); setPureVegOnly(false); setActiveCategory('all'); }}
            >
              Show All Items
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const inCartItems = cart.items.filter(i => i.id === item.id);
            const totalItemQty = inCartItems.reduce((acc, curr) => acc + curr.quantity, 0);

            return (
              <div key={item.id} className="col-md-6 col-xl-4">
                <div className="card border-0 rounded-4 shadow-sm h-100 p-3 bg-white d-flex flex-row justify-content-between align-items-center hover-lift transition">
                  <div className="pe-3 flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className={`badge ${item.veg ? 'bg-success' : 'bg-danger'} p-1 rounded-circle`} style={{ width: 10, height: 10 }}></span>
                      <h6 className="fw-bold mb-0 text-dark">{item.name}</h6>
                    </div>
                    <p className="text-muted small mb-2" style={{ maxHeight: 42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.description}
                    </p>

                    {/* Price Parity Display (Dine-in vs Platform) */}
                    <div className="d-flex align-items-baseline gap-2 mb-2">
                      <span className="fs-5 fw-extrabold text-dark">₹{item.platformPrice}</span>
                      {item.dineInPrice && (
                        <small className="text-muted text-decoration-line-through">Dine-in: ₹{item.dineInPrice}</small>
                      )}
                      {Number(item.platformPrice) === Number(item.dineInPrice) && (
                        <span className="badge bg-success-subtle text-success border border-success small" style={{ fontSize: 10 }}>
                          0% Markup ✓
                        </span>
                      )}
                    </div>

                    <div className="small text-muted">
                      <i className="bi bi-fire text-danger me-1"></i> {item.calorieCount || 350} kcal • {item.prepTimeMinutes || 15}m prep
                    </div>
                  </div>

                  {/* Dish Image + Add Button / Quantity Stepper */}
                  <div className="position-relative text-center flex-shrink-0" style={{ width: 110 }}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="rounded-3 shadow-sm object-fit-cover"
                      style={{ width: 110, height: 100 }}
                    />

                    {totalItemQty > 0 ? (
                      <div 
                        className="btn-group btn-group-sm position-absolute bottom-0 start-50 translate-middle-x mb-n2 shadow rounded-pill bg-white border overflow-hidden" 
                        style={{ zIndex: 2 }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-light border-0 fw-bold px-2 text-danger"
                          onClick={() => removeItem(inCartItems[0].cartKey)}
                        >
                          -
                        </button>
                        <span className="btn btn-sm btn-white border-0 fw-extrabold px-2 text-dark bg-white" style={{ minWidth: 26, fontSize: 12 }}>
                          {totalItemQty}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border-0 fw-bold px-2 text-success"
                          onClick={() => handleOpenCustomizer(item)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-light border shadow-sm position-absolute bottom-0 start-50 translate-middle-x mb-n2 rounded-pill px-3 fw-bold text-primary transition hover-lift"
                        style={{ whiteSpace: 'nowrap', zIndex: 2, background: '#fff' }}
                        onClick={() => handleOpenCustomizer(item)}
                      >
                        ADD +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dish Customization Modal (Variants & Addons) */}
      {customizingItem && (
        <ModalPortal isOpen={!!customizingItem}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setCustomizingItem(null); }}
          >
            <div className="cravepulse-modal-dialog">
              <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
                <div className="modal-header border-0 bg-light p-3">
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Customize {customizingItem.name}</h5>
                    <small className="text-muted">Personalize your dish portion and addons</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setCustomizingItem(null)}></button>
                </div>
                <div className="modal-body p-4">
                  {/* Variant Selector */}
                  {customizingItem.variants?.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-2 small text-uppercase text-muted">Select Portion / Size</h6>
                      <div className="list-group">
                        {customizingItem.variants.map(v => (
                          <label key={v.id} className="list-group-item d-flex justify-content-between align-items-center py-2 cursor-pointer">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="radio"
                                name="variant"
                                className="form-check-input mt-0"
                                checked={selectedVariant?.id === v.id}
                                onChange={() => setSelectedVariant(v)}
                              />
                              <span className="fw-semibold">{v.variantName}</span>
                            </div>
                            <span className="small text-muted">+₹{v.priceAdjustment}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Addons Selector */}
                  {customizingItem.addons?.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-2 small text-uppercase text-muted">Select Add-ons</h6>
                      <div className="list-group">
                        {customizingItem.addons.map(a => (
                          <label key={a.id} className="list-group-item d-flex justify-content-between align-items-center py-2 cursor-pointer">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={selectedAddons.some(sel => sel.id === a.id)}
                                onChange={() => toggleAddon(a)}
                              />
                              <span className="fw-semibold">{a.addonName}</span>
                            </div>
                            <span className="small text-muted">+₹{a.price}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <div>
                      <span className="text-muted small d-block">Total Item Price</span>
                      <strong className="fs-5 text-dark">
                        ₹{
                          customizingItem.platformPrice +
                          (selectedVariant?.priceAdjustment || 0) +
                          selectedAddons.reduce((acc, curr) => acc + curr.price, 0)
                        }
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4 fw-bold shadow"
                      style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
                      onClick={handleAddCustomized}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default RestaurantDetail;
