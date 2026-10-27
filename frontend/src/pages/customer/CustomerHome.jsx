import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { RestaurantCardSkeleton } from '../../components/Skeleton';

import { DEFAULT_HUB } from '../../config/panIndiaLocations';

const CATEGORIES = [
  { name: 'All', icon: '🍽️', count: 15 },
  { name: 'North Indian', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=150', count: 6 },
  { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150', count: 4 },
  { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150', count: 3 },
  { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150', count: 3 },
  { name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150', count: 1 },
  { name: 'Salads', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150', count: 2 },
  { name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=150', count: 2 },
];

const FALLBACK_RESTAURANTS = [
  {
    id: 1,
    name: 'Spice Symphony & Grill',
    headChef: 'Chef Lohith',
    slug: 'spice-symphony-grill',
    description: 'Authentic gourmet North Indian curries, royal dum biryanis, and tandoori kebabs curated by Chef Lohith.',
    bannerImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200',
    cuisineTypes: 'North Indian, Biryani, Mughlai',
    rating: 4.8,
    totalReviews: 1420,
    pureVeg: false,
    priceTier: '$$',
    prepTimeMin: 20,
    prepTimeMax: 30,
    street: 'Plot 88, 100 Feet Rd',
    isOpen: true,
    isAutoThrottled: false,
    distanceKm: 0.9,
    deliveryFee: 35.00
  },
  {
    id: 2,
    name: 'Pizza Palace',
    headChef: 'Chef Ajay Kumar',
    slug: 'pizza-palace',
    description: 'Artisanal wood-fired Neapolitan sourdough pizzas and freshly tossed hand-rolled pasta curated by Chef Ajay Kumar.',
    bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200',
    cuisineTypes: 'Pizza, Italian, Fast Food',
    rating: 4.6,
    totalReviews: 980,
    pureVeg: false,
    priceTier: '$$',
    prepTimeMin: 22,
    prepTimeMax: 32,
    street: '34, Main Gourmet Avenue',
    isOpen: true,
    isAutoThrottled: false,
    distanceKm: 0.4,
    deliveryFee: 35.00
  },
  {
    id: 3,
    name: 'Burger House',
    headChef: 'Chef Santhosh Reddy',
    slug: 'burger-house',
    description: 'Juicy smashed beef & smash veg burgers, double-fried crispy onion rings, loaded fries, and thick shakes curated by Chef Santhosh Reddy.',
    bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
    cuisineTypes: 'Burgers, American, Fast Food',
    rating: 4.6,
    totalReviews: 2150,
    pureVeg: false,
    priceTier: '$',
    prepTimeMin: 15,
    prepTimeMax: 25,
    street: '12, Central Food Street',
    isOpen: true,
    isAutoThrottled: false,
    distanceKm: 0.7,
    deliveryFee: 35.00
  },
  {
    id: 4,
    name: 'Sushi World',
    headChef: 'Chef Kenji Sato',
    slug: 'sushi-world',
    description: 'Ultra-fresh Japanese sushi rolls, Norwegian salmon nigiri, and steaming bowls of slow-simmered miso ramen.',
    bannerImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200',
    cuisineTypes: 'Sushi, Japanese, Asian',
    rating: 4.8,
    totalReviews: 860,
    pureVeg: false,
    priceTier: '$$$',
    prepTimeMin: 25,
    prepTimeMax: 40,
    street: '56, Defense Enclave',
    isOpen: true,
    isAutoThrottled: false,
    distanceKm: 1.1,
    deliveryFee: 35.00
  },
  {
    id: 5,
    name: 'Healthy Bites',
    headChef: 'Nutritionist Priya Sen',
    slug: 'healthy-bites',
    description: 'Macro-balanced nutrient-packed salad bowls, organic cold-pressed juices, and protein energy smoothies.',
    bannerImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
    cuisineTypes: 'Salads, Healthy, Organic',
    rating: 4.5,
    totalReviews: 740,
    pureVeg: true,
    priceTier: '$$',
    prepTimeMin: 15,
    prepTimeMax: 25,
    street: '77, Wellness Boulevard',
    isOpen: true,
    isAutoThrottled: false,
    distanceKm: 1.2,
    deliveryFee: 35.00
  }
];

const CustomerHome = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time URL query parameter bindings (Swiggy / Zomato parity)
  const [search, setSearch] = useState(() => searchParams.get('query') || searchParams.get('search') || '');
  const [selectedCuisine, setSelectedCuisine] = useState(() => searchParams.get('cuisine') || '');
  const [vegOnly, setVegOnly] = useState(() => searchParams.get('veg_only') === 'true' || searchParams.get('veg') === 'true');
  const [minRating, setMinRating] = useState(() => searchParams.get('rating') ? Number(searchParams.get('rating')) : null);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState(() => searchParams.get('time') ? Number(searchParams.get('time')) : null);
  const [selectedPriceTier, setSelectedPriceTier] = useState(() => searchParams.get('price') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'relevance');

  const [currentHub, setCurrentHub] = useState(() => {
    const saved = localStorage.getItem('cravepulse_hub');
    return saved ? JSON.parse(saved) : DEFAULT_HUB;
  });

  // Sync state to URL search parameters so links can be shared
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('query', search.trim());
    if (selectedCuisine && selectedCuisine !== 'All') params.set('cuisine', selectedCuisine);
    if (vegOnly) params.set('veg_only', 'true');
    if (minRating) params.set('rating', String(minRating));
    if (maxDeliveryTime) params.set('time', String(maxDeliveryTime));
    if (selectedPriceTier) params.set('price', selectedPriceTier);
    if (sortBy && sortBy !== 'relevance') params.set('sort', sortBy);

    setSearchParams(params, { replace: true });
  }, [search, selectedCuisine, vegOnly, minRating, maxDeliveryTime, selectedPriceTier, sortBy, setSearchParams]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('cravepulse_hub');
      if (saved) setCurrentHub(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (selectedCuisine && selectedCuisine !== 'All') params.cuisine = selectedCuisine;
        if (vegOnly) params.vegOnly = true;

        const res = await api.get('/restaurants', { params });
        if (isMounted) {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setRestaurants(res.data);
          } else {
            // If backend returned empty array for no matches, keep as empty
            setRestaurants(res.data || []);
          }
        }
      } catch (e) {
        console.warn('Backend offline or error fetching restaurants, using resilient seed cache', e);
        if (isMounted) {
          setRestaurants(FALLBACK_RESTAURANTS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchRestaurants, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, selectedCuisine, vegOnly]);

  // Client-side filtering & sorting for rich instant responsiveness
  const filteredAndSortedRestaurants = useMemo(() => {
    let list = [...restaurants];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => 
        r.name?.toLowerCase().includes(q) ||
        r.cuisineTypes?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }

    // Cuisine filter
    if (selectedCuisine && selectedCuisine !== 'All') {
      const c = selectedCuisine.toLowerCase();
      list = list.filter(r => r.cuisineTypes?.toLowerCase().includes(c));
    }

    // Pure Veg filter
    if (vegOnly) {
      list = list.filter(r => r.pureVeg === true);
    }

    // Rating filter
    if (minRating) {
      list = list.filter(r => Number(r.rating) >= minRating);
    }

    // Delivery time filter
    if (maxDeliveryTime) {
      list = list.filter(r => Number(r.prepTimeMax) <= maxDeliveryTime);
    }

    // Price tier filter
    if (selectedPriceTier) {
      list = list.filter(r => r.priceTier === selectedPriceTier);
    }

    // Sorting
    if (sortBy === 'rating') {
      list.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortBy === 'time') {
      list.sort((a, b) => Number(a.prepTimeMin) - Number(b.prepTimeMin));
    } else if (sortBy === 'costAsc') {
      list.sort((a, b) => (a.priceTier?.length || 2) - (b.priceTier?.length || 2));
    } else if (sortBy === 'costDesc') {
      list.sort((a, b) => (b.priceTier?.length || 2) - (a.priceTier?.length || 2));
    }

    return list;
  }, [restaurants, search, selectedCuisine, vegOnly, minRating, maxDeliveryTime, selectedPriceTier, sortBy]);

  const activeFiltersCount = [
    vegOnly,
    minRating !== null,
    maxDeliveryTime !== null,
    selectedPriceTier !== '',
    selectedCuisine !== '' && selectedCuisine !== 'All',
    search !== ''
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCuisine('');
    setVegOnly(false);
    setMinRating(null);
    setMaxDeliveryTime(null);
    setSelectedPriceTier('');
    setSortBy('relevance');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      <div className="row g-4">
        {/* Left Sidebar Navigation (Desktop) */}
        <div className="col-lg-2 d-none d-lg-block">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white sticky-top" style={{ top: 90 }}>
            <div className="list-group list-group-flush border-0">
              <Link to="/" className="list-group-item list-group-item-action border-0 rounded-3 py-2 fw-bold text-primary bg-primary-subtle d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-house-door-fill"></i> Home
              </Link>
              <a href="#restaurants-grid" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-shop"></i> Kitchens
              </a>
              <a href="#categories-section" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-grid-fill"></i> Categories
              </a>
              <Link to="/orders" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-receipt"></i> Orders
              </Link>
              <Link to="/offers" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-tag-fill text-danger"></i> Offers & Deals
              </Link>
              <Link to="/help" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-question-circle-fill text-primary"></i> Help & Support
              </Link>
              <Link to="/cities" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-warning"></i> Delivery Cities
              </Link>
            </div>

            {/* Sidebar Promo Card */}
            <div className="mt-4 p-3 rounded-4 text-center position-relative overflow-hidden" style={{ background: '#fff5f0', border: '1px dashed #ff8a65' }}>
              <div className="badge bg-danger rounded-pill mb-2">HOT PROMO</div>
              <h6 className="fw-extrabold mb-1" style={{ color: '#ff5722' }}>50% OFF</h6>
              <p className="small text-muted mb-2">On your first order with code</p>
              <div className="bg-white rounded-3 py-1 px-2 border fw-bold text-dark mb-3 small font-monospace">
                FOOD50
              </div>
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120"
                alt="Burger Promo"
                className="img-fluid rounded-circle mb-2 shadow-sm"
                style={{ width: 80, height: 80, objectFit: 'cover' }}
              />
              <a href="#restaurants-grid" className="btn btn-sm btn-primary w-100 rounded-pill fw-bold" style={{ background: '#ff5722', borderColor: '#ff5722' }}>
                Order Now →
              </a>
            </div>
          </div>
        </div>

        {/* Main Center Content */}
        <div className="col-12 col-lg-10">
          {/* Hero Banner with Radical Price Parity Assurance */}
          <div 
            className="card border-0 rounded-4 shadow-sm overflow-hidden mb-4 p-4 p-md-5 position-relative" 
            style={{ 
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', 
              border: '1px solid #fed7aa' 
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-7 z-1">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">🔥 50% OFF WITH 'FOOD50'</span>
                  <span className="badge bg-success rounded-pill px-3 py-2 fw-bold d-none d-sm-inline">
                    <i className="bi bi-patch-check-fill me-1"></i> 100% Price Parity
                  </span>
                </div>
                <h1 className="display-6 fw-extrabold text-dark mb-2">
                  Delicious food, <span style={{ color: '#ff5722' }}>zero menu markups</span>
                </h1>
                <p className="text-secondary mb-4" style={{ maxWidth: 440 }}>
                  Order from top Indiranagar & Bengaluru restaurants at exact dining room prices with guaranteed honest ETA tracking.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <a 
                    href="#restaurants-grid" 
                    className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm transition hover-lift" 
                    style={{ background: '#ff5722', borderColor: '#ff5722' }}
                  >
                    Order Now →
                  </a>
                  <button 
                    className="btn btn-outline-dark px-4 py-2 rounded-pill fw-semibold bg-white" 
                    onClick={handleResetFilters}
                  >
                    Explore All ({restaurants.length})
                  </button>
                </div>
              </div>
              <div className="col-md-5 text-center mt-3 mt-md-0">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
                  alt="Plated Food Banner"
                  className="img-fluid rounded-4 shadow-lg object-fit-cover"
                  style={{ maxHeight: 220, width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Categories Slider Row */}
          <div className="mb-4" id="categories-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Browse by Category</h5>
                <small className="text-muted">Explore popular hand-picked cuisines</small>
              </div>
              <button 
                className="btn btn-sm btn-link text-decoration-none fw-semibold text-primary" 
                onClick={() => setSelectedCuisine('')}
              >
                Clear Selection
              </button>
            </div>
            <div className="d-flex gap-3 overflow-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map((cat, idx) => {
                const isActive = (selectedCuisine === cat.name) || (!selectedCuisine && cat.name === 'All');
                return (
                  <div
                    key={idx}
                    className={`card border-0 rounded-4 text-center p-3 shadow-sm flex-shrink-0 cursor-pointer transition hover-lift ${isActive ? 'border border-2 border-primary bg-primary-subtle' : 'bg-white'}`}
                    style={{ width: 125, cursor: 'pointer' }}
                    onClick={() => setSelectedCuisine(cat.name === 'All' ? '' : cat.name)}
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="rounded-circle mx-auto mb-2 shadow-sm object-fit-cover"
                        style={{ width: 56, height: 56 }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle mx-auto mb-2 shadow-sm d-flex align-items-center justify-content-center bg-light fs-4"
                        style={{ width: 56, height: 56 }}
                      >
                        {cat.icon}
                      </div>
                    )}
                    <div className="fw-bold small text-dark">{cat.name}</div>
                    <small className="text-muted" style={{ fontSize: 11 }}>{cat.count} kitchens</small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Filter Controls Bar */}
          <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              {/* Left Filters Group */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                {/* Pure Veg Switch */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 border ${vegOnly ? 'btn-success text-white' : 'btn-light text-success'}`}
                  onClick={() => setVegOnly(!vegOnly)}
                >
                  <span>🟢</span> Pure Veg
                </button>

                {/* Rating 4.5+ Filter */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border ${minRating === 4.5 ? 'btn-warning text-dark fw-bold' : 'btn-light text-secondary'}`}
                  onClick={() => setMinRating(minRating === 4.5 ? null : 4.5)}
                >
                  <i className="bi bi-star-fill text-warning me-1"></i> 4.5+ Rating
                </button>

                {/* Delivery Time < 30m Filter */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border ${maxDeliveryTime === 30 ? 'btn-info text-dark fw-bold' : 'btn-light text-secondary'}`}
                  onClick={() => setMaxDeliveryTime(maxDeliveryTime === 30 ? null : 30)}
                >
                  <i className="bi bi-stopwatch me-1"></i> Fast Delivery (&lt;30m)
                </button>

                {/* Price Tier Filter */}
                <div className="dropdown">
                  <button 
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border dropdown-toggle ${selectedPriceTier ? 'btn-primary text-white' : 'btn-light text-secondary'}`} 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-cash me-1"></i> {selectedPriceTier ? `Price: ${selectedPriceTier}` : 'Price Range'}
                  </button>
                  <ul className="dropdown-menu shadow border-0 rounded-3 p-1">
                    <li><button className="dropdown-item rounded-2 small" onClick={() => setSelectedPriceTier('')}>All Prices</button></li>
                    <li><button className="dropdown-item rounded-2 small" onClick={() => setSelectedPriceTier('$')}>$ Budget-friendly</button></li>
                    <li><button className="dropdown-item rounded-2 small" onClick={() => setSelectedPriceTier('$$')}>$$ Mid-range</button></li>
                    <li><button className="dropdown-item rounded-2 small" onClick={() => setSelectedPriceTier('$$$')}>$$$ Premium Gourmet</button></li>
                  </ul>
                </div>

                {/* Reset Filters Pill (if any active) */}
                {activeFiltersCount > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 small fw-bold"
                    onClick={handleResetFilters}
                  >
                    Reset All ({activeFiltersCount}) ✕
                  </button>
                )}
              </div>

              {/* Right Sort By Dropdown */}
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted d-none d-sm-inline">Sort by:</span>
                <select 
                  className="form-select form-select-sm rounded-pill border shadow-none" 
                  style={{ width: 'auto' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Relevance & Distance</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="time">Delivery Time: Fast First</option>
                  <option value="costAsc">Price: Low to High</option>
                  <option value="costDesc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Popular Restaurants Section */}
          <div id="restaurants-grid">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1">Kitchens & Restaurants</h5>
                <p className="text-muted small mb-0">100% Dine-In Menu Price Parity • Zero Delivery Markups</p>
              </div>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                Showing {filteredAndSortedRestaurants.length} places
              </span>
            </div>

            {loading ? (
              <div className="row g-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="col-12 col-md-6 col-xl-4">
                    <RestaurantCardSkeleton />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedRestaurants.length === 0 ? (
              <div className="card border-0 rounded-4 p-5 text-center bg-white shadow-sm">
                <div className="fs-1 mb-2">🔍</div>
                <h6 className="fw-bold">No restaurants match your filters</h6>
                <p className="text-muted small">Try loosening your dietary filters, price tiers, or search term.</p>
                <button 
                  className="btn btn-outline-primary rounded-pill btn-sm mx-auto fw-bold px-4" 
                  onClick={handleResetFilters}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="row g-4">
                {filteredAndSortedRestaurants.map((rest) => {
                  const citySlug = (currentHub?.cityName || currentHub?.city?.name || currentHub?.city || 'bangalore').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const restSlug = (rest.slug || rest.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const localitySlug = (currentHub?.area || currentHub?.name || 'indiranagar').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const queryParam = search.trim() ? `&query=${encodeURIComponent(search.trim())}` : '';
                  // Production Swiggy URL Format
                  const swiggyUrl = `/city/${citySlug}/${restSlug}-${localitySlug}-rest${rest.id}?restaurant_id=${rest.id}&source=collection${queryParam}`;
                  return (
                    <div key={rest.id} className="col-12 col-md-6 col-xl-4">
                      <Link to={swiggyUrl} className="text-decoration-none">
                      <div className="card border-0 rounded-4 shadow-sm overflow-hidden h-100 bg-white transition hover-lift position-relative">
                        {/* Restaurant Banner Image */}
                        <div className="position-relative" style={{ height: 180 }}>
                          <img
                            src={rest.bannerImage}
                            alt={rest.name}
                            className="w-100 h-100 object-fit-cover"
                          />
                          {/* Price Parity Guarantee Tag */}
                          <div className="position-absolute top-0 start-0 m-2 badge bg-success shadow-sm rounded-pill d-flex align-items-center gap-1 small py-1 px-2">
                            <i className="bi bi-patch-check-fill"></i>
                            <span>0% Markup Parity</span>
                          </div>

                          {/* Price tier badge */}
                          <div className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75 shadow-sm rounded-pill small py-1 px-2">
                            {rest.priceTier}
                          </div>

                          {/* Overload Throttle Banner */}
                          {rest.isAutoThrottled && (
                            <div className="position-absolute bottom-0 start-0 w-100 bg-warning text-dark py-1 text-center small fw-bold">
                              ⏳ Kitchen busy (high prep volume)
                            </div>
                          )}
                        </div>

                        {/* Card Body Info */}
                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6 className="fw-bold text-dark mb-0 text-truncate" style={{ maxWidth: '75%' }}>
                                {rest.name}
                              </h6>
                              <span className="badge bg-warning-subtle text-dark border small d-flex align-items-center gap-1 px-2 py-1">
                                <i className="bi bi-star-fill text-warning"></i> {rest.rating}
                              </span>
                            </div>

                            <div className="d-flex align-items-center gap-2 mb-1">
                              <p className="text-muted small text-truncate mb-0">{rest.cuisineTypes}</p>
                              {rest.headChef && (
                                <span className="badge bg-light text-dark border small" style={{ fontSize: 10 }}>
                                  {rest.headChef}
                                </span>
                              )}
                            </div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <small className="text-secondary text-truncate" style={{ fontSize: 11, maxWidth: '60%' }}>
                                <i className="bi bi-geo-alt me-1 text-danger"></i>
                                {rest.locality || rest.street || (rest.address ? rest.address.split(',')[0] : `${currentHub.name}, ${currentHub.cityName}`)}
                              </small>
                              <span className="text-muted fw-semibold" style={{ fontSize: 11 }}>
                                {rest.costForTwo ? `₹${rest.costForTwo} for two` : (rest.priceTier || '₹400 for two')}
                              </span>
                            </div>
                            {rest.hygieneRating && (
                              <div className="mb-2">
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small" style={{ fontSize: 10 }}>
                                  🛡️ {rest.hygieneRating}/5 Hygiene Certified
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                            <span className="d-flex align-items-center gap-1">
                              <i className="bi bi-clock"></i> {rest.prepTimeMin}-{rest.prepTimeMax} mins
                            </span>
                            <span className="text-success fw-bold">
                              ₹35 Delivery
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
