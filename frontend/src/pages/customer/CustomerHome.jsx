import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getPreference } from '../../services/preferences';
import { RestaurantCardSkeleton } from '../../components/Skeleton';
import ScrollCarousel from '../../components/common/ScrollCarousel';
import ErrorState from '../../components/states/ErrorState';
import EmptyState from '../../components/states/EmptyState';
import { DEFAULT_HUB } from '../../config/panIndiaLocations';

const RESTAURANT_PAGE_SIZE = 20;
const ALL_CATEGORY = {
  id: 'all',
  name: 'All',
  imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=240&h=240&fit=crop',
};

const CustomerHome = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [hasMoreRestaurants, setHasMoreRestaurants] = useState(false);
  const [loadingMoreRestaurants, setLoadingMoreRestaurants] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState('');
  const restaurantRequestId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    let active = true;
    setFavorites([]);
    if (user) api.get('/account/favorites').then(res => { if (active) setFavorites(res.data || []); }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);
  const toggleFavorite = async (e, restId) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { window.alert('Sign in to save your favourite restaurants.'); return; }
    try {
      const favorite = !favorites.includes(restId);
      await api.post('/account/favorites', { restaurantId: restId, favorite });
      setFavorites(prev => favorite ? [...new Set([...prev, restId])] : prev.filter(id => id !== restId));
    } catch (err) { window.alert(err.message); }
  };

  // Real-time URL query parameter bindings
  const [search, setSearch] = useState(() => searchParams.get('query') || searchParams.get('search') || '');
  const [selectedCuisine, setSelectedCuisine] = useState(() => searchParams.get('cuisine') || '');
  const [vegOnly, setVegOnly] = useState(() => searchParams.get('veg_only') === 'true' || searchParams.get('veg') === 'true');
  const [minRating, setMinRating] = useState(() => searchParams.get('rating') ? Number(searchParams.get('rating')) : null);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState(() => searchParams.get('time') ? Number(searchParams.get('time')) : null);
  const [selectedPriceTier, setSelectedPriceTier] = useState(() => searchParams.get('price') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'relevance');

  const [currentHub, setCurrentHub] = useState(() => {
    const saved = getPreference('hub');
    return saved || DEFAULT_HUB;
  });

  useEffect(() => {
    let active = true;
    api.get('/catalog/categories')
      .then((response) => {
        if (active && Array.isArray(response.data)) setCategories(response.data);
      })
      .catch((error) => {
        if (active) setCategoriesError(error.message || 'Cuisine filters are temporarily unavailable.');
      });
    return () => { active = false; };
  }, []);

  // Sync state to URL search parameters
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
      const saved = getPreference('hub');
      setCurrentHub(saved || DEFAULT_HUB);
    };
    window.addEventListener('preferences-changed', handleStorage);
    return () => window.removeEventListener('preferences-changed', handleStorage);
  }, []);

  const loadRestaurants = useCallback(async () => {
    const requestId = ++restaurantRequestId.current;
    setLoading(true);
    setLoadingMoreRestaurants(false);
    setFetchError(null);
    setLoadMoreError('');
    try {
      const params = {};
      if (currentHub?.coords) { params.lat = currentHub.coords[0]; params.lng = currentHub.coords[1]; }
      if (search) params.search = search;
      if (selectedCuisine && selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (vegOnly) params.vegOnly = true;
      params.limit = RESTAURANT_PAGE_SIZE;
      params.offset = 0;

      const res = await api.get('/restaurants', { params });
      if (requestId !== restaurantRequestId.current) return;
      if (res.success && Array.isArray(res.data)) {
        setRestaurants(res.data);
        setHasMoreRestaurants(res.data.length === RESTAURANT_PAGE_SIZE);
      } else {
        setRestaurants(res.data || []);
        setHasMoreRestaurants(false);
      }
    } catch (e) {
      if (requestId !== restaurantRequestId.current) return;
      console.error('Error fetching restaurants from backend:', e);
      setFetchError(e.message || 'Unable to connect to CravePulse servers.');
    } finally {
      if (requestId === restaurantRequestId.current) setLoading(false);
    }
  }, [search, selectedCuisine, vegOnly, currentHub]);

  const loadMoreRestaurants = async () => {
    if (loadingMoreRestaurants || !hasMoreRestaurants) return;
    const requestId = restaurantRequestId.current;
    setLoadingMoreRestaurants(true);
    setLoadMoreError('');
    try {
      const params = {
        limit: RESTAURANT_PAGE_SIZE,
        offset: restaurants.length,
      };
      if (currentHub?.coords) { params.lat = currentHub.coords[0]; params.lng = currentHub.coords[1]; }
      if (search) params.search = search;
      if (selectedCuisine && selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (vegOnly) params.vegOnly = true;
      const response = await api.get('/restaurants', { params });
      if (requestId !== restaurantRequestId.current) return;
      if (!Array.isArray(response.data)) throw new Error('Restaurant page response was not a list.');
      setRestaurants((current) => [...current, ...response.data]);
      setHasMoreRestaurants(response.data.length === RESTAURANT_PAGE_SIZE);
    } catch (error) {
      if (requestId !== restaurantRequestId.current) return;
      setLoadMoreError(error.message || 'Unable to load more restaurants.');
    } finally {
      if (requestId === restaurantRequestId.current) setLoadingMoreRestaurants(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadRestaurants, 200);
    return () => clearTimeout(timer);
  }, [loadRestaurants]);

  // Client-side filtering & sorting (Swiggy / Zomato parity)
  const filteredAndSortedRestaurants = useMemo(() => {
    let list = [...restaurants];

    // Cuisine filter
    if (selectedCuisine && selectedCuisine !== 'All') {
      const c = selectedCuisine.toLowerCase();
      list = list.filter((r) => r.cuisineTypes?.toLowerCase().includes(c));
    }

    // Pure Veg filter
    if (vegOnly) {
      list = list.filter((r) => r.pureVeg === true);
    }

    // Rating filter
    if (minRating) {
      list = list.filter((r) => Number(r.rating) >= minRating);
    }

    // Delivery time filter
    if (maxDeliveryTime) {
      list = list.filter((r) => Number(r.prepTimeMax) <= maxDeliveryTime);
    }

    // Price tier filter
    if (selectedPriceTier) {
      list = list.filter((r) => r.priceTier === selectedPriceTier);
    }

    // Sorting & Ranking
    if (sortBy === 'rating') {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === 'time') {
      list.sort((a, b) => Number(a.prepTimeMin || 20) - Number(b.prepTimeMin || 20));
    } else if (sortBy === 'costAsc') {
      list.sort((a, b) => Number(a.costForTwo || 300) - Number(b.costForTwo || 300));
    } else if (sortBy === 'costDesc') {
      list.sort((a, b) => Number(b.costForTwo || 300) - Number(a.costForTwo || 300));
    } else {
      // Relevance: Open kitchens first, then closest distance, then rating
      list.sort((a, b) => {
        const aOpen = a.isOpen !== false;
        const bOpen = b.isOpen !== false;
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        const distDiff = Number(a.distanceKm || 1.0) - Number(b.distanceKm || 1.0);
        if (Math.abs(distDiff) > 0.5) return distDiff;
        return Number(b.rating || 0) - Number(a.rating || 0);
      });
    }

    return list;
  }, [restaurants, selectedCuisine, vegOnly, minRating, maxDeliveryTime, selectedPriceTier, sortBy]);

  const activeFiltersCount = [
    vegOnly,
    minRating !== null,
    maxDeliveryTime !== null,
    selectedPriceTier !== '',
    selectedCuisine !== '' && selectedCuisine !== 'All',
    search !== '',
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
    <div className="container-fluid px-3 px-md-4 py-3 customer-content-container">
      <div className="row g-4">
        {/* Left Sidebar Navigation (Desktop >= 992px) */}
        <div className="col-xl-2 col-lg-3 d-none d-lg-block">
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
                <i className="bi bi-tag-fill text-danger"></i> Offers &amp; Deals
              </Link>
              <Link to="/help" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-question-circle-fill text-primary"></i> Help &amp; Support
              </Link>
              <Link to="/cities" className="list-group-item list-group-item-action border-0 rounded-3 py-2 text-secondary d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-warning"></i> Delivery Cities
              </Link>
            </div>

            <div className="mt-4 p-3 rounded-4 bg-light border">
              <h6 className="fw-bold">Find your next favourite</h6>
              <p className="small text-muted">Browse menus and current offers from restaurants near you.</p>
              <Link to="/offers" className="btn btn-sm btn-outline-primary rounded-pill">View available offers</Link>
            </div>
          </div>
        </div>

        {/* Main Center Content */}
        <div className="col-12 col-xl-10 col-lg-9">
          {/* Hero Banner with Radical Price Parity Assurance */}
          <div 
            className="hero-banner-card card border-0 rounded-4 shadow-sm overflow-hidden mb-4 p-3 p-md-5 position-relative" 
            style={{ 
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', 
              border: '1px solid #fed7aa' 
            }}
          >
            <div className="row align-items-center">
              <div className="col-md-7 z-1">
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span className="badge bg-light text-dark border rounded-pill px-3 py-2">Explore local kitchens</span>
                  <span className="badge bg-success rounded-pill px-3 py-2 fw-bold d-none d-sm-inline">
                    <i className="bi bi-patch-check-fill me-1"></i> 100% Price Parity
                  </span>
                </div>
                <h1 className="display-6 fw-extrabold text-dark mb-2" style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.25rem)' }}>
                  Delicious food, <span style={{ color: 'var(--c-primary)' }}>zero menu markups</span>
                </h1>
                <p className="text-secondary mb-4" style={{ maxWidth: 440 }}>
                  Order from verified neighborhood kitchens at exact dining room prices with guaranteed honest ETA tracking.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <a 
                    href="#restaurants-grid" 
                    className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm transition hover-lift" 
                    style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
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
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Categories Carousel ("What's on your mind?" – Swiggy / Zomato Pattern) */}
          <div className="mb-4" id="categories-section">
            <ScrollCarousel
              ariaLabel="Cuisine categories"
              sectionHeader={
                <div>
                  <h5 className="fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.3rem)' }}>
                    What's on your mind?
                  </h5>
                  <small className="text-muted">Browse by cuisine</small>
                </div>
              }
            >
              {[ALL_CATEGORY, ...categories].map((cat) => {
                const isActive = selectedCuisine === cat.name || (!selectedCuisine && cat.name === 'All');
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cuisine-filter-button flex-shrink-0 transition ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCuisine(cat.name === 'All' ? '' : cat.name)}
                    aria-label={`Select ${cat.name} cuisine`}
                    aria-pressed={isActive}
                  >
                    <img className="cuisine-filter-image" src={cat.imageUrl} alt="" loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true; }} />
                    <span className="fw-semibold small text-dark w-100 text-truncate">{cat.name}</span>
                  </button>
                );
              })}
            </ScrollCarousel>
            {categoriesError && <p className="small text-warning mt-2 mb-0" role="status">{categoriesError}</p>}
          </div>

          {/* Dynamic Filter Controls Bar */}
          <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
            <div className="filter-sort-row d-flex flex-wrap align-items-center justify-content-between gap-2">
              {/* Left Filters Group */}
              <div className="filter-bar-pills d-flex flex-wrap align-items-center gap-2">
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

                {/* Reset Filters Pill */}
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
              <div className="sort-group d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold d-none d-sm-inline">Sort by:</span>
                <select 
                  className="form-select form-select-sm rounded-pill border shadow-none" 
                  style={{ minWidth: 160 }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort restaurants by"
                >
                  <option value="relevance">Relevance &amp; Distance</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="time">Delivery Time: Fast First</option>
                  <option value="costAsc">Price: Low to High</option>
                  <option value="costDesc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kitchens & Restaurants Section */}
          <div id="restaurants-grid">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.15rem, 2vw, 1.4rem)' }}>
                  {currentHub?.id && currentHub.id !== 'unselected'
                    ? `Restaurants in ${currentHub.cityName || currentHub.name}`
                    : 'Explore restaurants'}
                </h5>
                <p className="text-muted small mb-0">100% Dine-In Menu Price Parity • Zero Delivery Markups</p>
              </div>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                Showing {filteredAndSortedRestaurants.length} places
              </span>
            </div>

            {loading ? (
              <div className="restaurant-card-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <RestaurantCardSkeleton key={n} />
                ))}
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Could not connect to CravePulse"
                message={fetchError}
                onRetry={loadRestaurants}
              />
            ) : filteredAndSortedRestaurants.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No restaurants match your filters"
                description="Try loosening your dietary filters, price tiers, or search term."
                actionText="Reset All Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="restaurant-card-grid">
                {filteredAndSortedRestaurants.map((rest) => {
                  const citySlug = (currentHub?.cityName || currentHub?.city?.name || currentHub?.city || 'bangalore').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const restSlug = (rest.slug || rest.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const localitySlug = (currentHub?.area || currentHub?.name || 'indiranagar').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const queryParam = search.trim() ? `&query=${encodeURIComponent(search.trim())}` : '';
                  const swiggyUrl = `/city/${citySlug}/${restSlug}-${localitySlug}-rest${rest.id}?restaurant_id=${rest.id}&source=collection${queryParam}`;

                  const isFav = favorites.includes(rest.id);
                  const isClosed = rest.isOpen === false;
                  const discountOffer = rest.discountTag || '';

                  return (
                    <div key={rest.id} className="restaurant-card position-relative">
                      <Link to={swiggyUrl} className="text-decoration-none">
                        <div className={`card border-0 rounded-4 shadow-sm overflow-hidden h-100 bg-white transition hover-lift ${isClosed ? 'opacity-75' : ''}`}>
                          {/* Image Container with 16:10 Aspect Ratio */}
                          <div className="restaurant-card-img-wrap">
                            <img
                              src={rest.bannerImage || '/food-placeholder.svg'}
                              alt={rest.name}
                              loading="lazy"
                              decoding="async"
                              style={isClosed ? { filter: 'grayscale(70%)' } : {}}
                            />

                            {/* Offer Banner Gradient Overlay (Swiggy / Zomato Signature) */}
                            {!isClosed && discountOffer && (
                              <div className="restaurant-card-offer-overlay">
                                <span>🏷️</span>
                                <span>{discountOffer}</span>
                              </div>
                            )}

                            {/* Closed Overlay */}
                            {isClosed && (
                              <div 
                                className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-60 d-flex flex-column align-items-center justify-content-center text-white p-2 text-center" 
                                style={{ zIndex: 3 }}
                              >
                                <span className="badge bg-danger fs-6 px-3 py-1 rounded-pill mb-1 shadow">
                                  CLOSED
                                </span>
                                <small className="fw-semibold text-light">Currently unavailable</small>
                              </div>
                            )}
                            {loadMoreError && <div className="alert alert-warning mt-3 mb-0" role="alert">{loadMoreError}</div>}
                            {!loading && !fetchError && hasMoreRestaurants && (
                              <div className="text-center mt-4">
                                <button type="button" className="btn btn-outline-primary rounded-pill px-4"
                                  onClick={loadMoreRestaurants} disabled={loadingMoreRestaurants}>
                                  {loadingMoreRestaurants ? 'Loading…' : 'Load more restaurants'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Card Content Body */}
                          <div className="card-body p-3 d-flex flex-column justify-content-between">
                            <div>
                              {/* 1. Restaurant Name & Rating */}
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                <h6 className="fw-bold text-dark mb-0 text-truncate" title={rest.name}>
                                  {rest.name}
                                </h6>
                                <span className="rating-pill-green flex-shrink-0">
                                  ★ {rest.totalReviews > 0 ? rest.rating : 'New'}
                                </span>
                              </div>

                              {/* 2. ETA • Distance • Cost for Two (Zomato Pattern) */}
                              <div className="d-flex align-items-center gap-1 text-muted small mb-1" style={{ fontSize: 12 }}>
                                <span className="fw-semibold text-dark">
                                  {rest.prepTimeMin ? `${rest.prepTimeMin}-${rest.prepTimeMax || rest.prepTimeMin + 10} mins` : 'Prep time unavailable'}
                                </span>
                                <span>•</span>
                                <span>{rest.distanceKm != null ? `${Number(rest.distanceKm).toFixed(1)} km` : 'Choose location'}</span>
                                <span>•</span>
                                <span>{rest.costForTwo != null ? `INR ${rest.costForTwo} for two` : 'Cost not provided'}</span>
                              </div>

                              {/* 3. Cuisines */}
                              <p className="text-secondary small text-truncate mb-2" style={{ fontSize: 12 }}>
                                {rest.cuisineTypes || ''}
                              </p>

                              {/* 4. Chips Strip: 0% Markup Parity, Veg, Auto-throttled */}
                              <div className="d-flex align-items-center gap-1 flex-wrap mb-2">
                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill py-0 px-2" style={{ fontSize: 10 }}>
                                  ✓ 0% Markup Parity
                                </span>
                                {rest.pureVeg && (
                                  <span className="badge bg-success text-white rounded-pill py-0 px-2" style={{ fontSize: 10 }}>
                                    🟢 Pure Veg
                                  </span>
                                )}
                                {rest.isAutoThrottled && (
                                  <span className="badge bg-warning text-dark rounded-pill py-0 px-2" style={{ fontSize: 10 }}>
                                    ⏳ Busy Kitchen
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 5. Locality & Free Delivery tag */}
                            <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top" style={{ fontSize: 11 }}>
                              <span className="text-truncate" style={{ maxWidth: '65%' }}>
                                <i className="bi bi-geo-alt me-1 text-danger"></i>
                                {rest.locality || rest.street || (rest.address ? rest.address.split(',')[0] : `${currentHub.name}, ${currentHub.cityName}`)}
                              </span>
                              <span className="text-success fw-bold">
                                {rest.deliveryFee == null ? 'Calculated at checkout' : rest.deliveryFee === 0 ? 'Free delivery' : `INR ${rest.deliveryFee} delivery`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Favourite Heart Button */}
                      <button
                        type="button"
                        className={`restaurant-fav-btn ${isFav ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(e, rest.id)}
                        aria-label={isFav ? `Remove ${rest.name} from favorites` : `Add ${rest.name} to favorites`}
                      >
                        <i className={`bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                      </button>
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
