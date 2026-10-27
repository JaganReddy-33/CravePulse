import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/**
 * NavSearchAutocomplete: Cross-dish and restaurant real-time search with recent searches history.
 */
const NavSearchAutocomplete = ({ selectedHub, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestionData, setSuggestionData] = useState({ restaurants: [], dishes: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('cravepulse_recent_searches');
      return saved ? JSON.parse(saved) : ['Biryani', 'Pizza', 'Paneer Butter Masala', 'Burger'];
    } catch {
      return ['Biryani', 'Pizza', 'Paneer Butter Masala', 'Burger'];
    }
  });

  const searchRef = useRef(null);
  const navigate = useNavigate();

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      localStorage.setItem('cravepulse_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestionData({ restaurants: [], dishes: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/restaurants/suggestions', { params: { query: searchQuery } });
        if (res.success && res.data) {
          setSuggestionData({
            restaurants: res.data.restaurants || [],
            dishes: res.data.dishes || [],
          });
          setShowSuggestions(true);
        }
      } catch {
        try {
          const fallback = await api.get('/restaurants', { params: { search: searchQuery } });
          if (fallback.success && Array.isArray(fallback.data)) {
            setSuggestionData({
              restaurants: fallback.data.slice(0, 5),
              dishes: [],
            });
            setShowSuggestions(true);
          }
        } catch {
          setSuggestionData({ restaurants: [], dishes: [] });
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRestaurant = (rest) => {
    const id = typeof rest === 'object' ? rest.id : rest;
    const name = typeof rest === 'object' ? rest.name : `restaurant-${id}`;
    saveRecentSearch(name);
    setShowSuggestions(false);
    setSearchQuery('');
    const citySlug = (selectedHub?.cityName || 'bangalore').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const restSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const localitySlug = (selectedHub?.name || 'indiranagar').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/city/${citySlug}/${restSlug}-${localitySlug}-rest${id}?restaurant_id=${id}&source=search`);
  };

  const handleSelectDish = (dish) => {
    saveRecentSearch(dish.name);
    setShowSuggestions(false);
    setSearchQuery('');
    const citySlug = (selectedHub?.cityName || 'bangalore').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const restSlug = (dish.restaurantSlug || `restaurant-${dish.restaurantId}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const localitySlug = (selectedHub?.name || 'indiranagar').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/city/${citySlug}/${restSlug}-${localitySlug}-rest${dish.restaurantId}?restaurant_id=${dish.restaurantId}&dishId=${dish.id}`);
  };

  return (
    <div className={`position-relative ${className}`} ref={searchRef}>
      <div className="input-group rounded-pill overflow-hidden border shadow-sm bg-light">
        <span className="input-group-text bg-transparent border-0 ps-3">
          <i className="bi bi-search text-muted"></i>
        </span>
        <input
          type="text"
          className="form-control bg-transparent border-0 ps-1 py-2"
          placeholder="Search biryani, pizza, North Indian, salads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          aria-label="Search dishes and restaurants"
        />
        {searchQuery && (
          <button
            type="button"
            className="btn btn-link text-muted p-0 pe-3 text-decoration-none touch-target"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <i className="bi bi-x-circle-fill"></i>
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {showSuggestions && (
        <div 
          className="position-absolute start-0 end-0 mt-2 bg-white rounded-4 shadow-xl border p-2"
          style={{ zIndex: 1060, maxHeight: 420, overflowY: 'auto' }}
        >
          {/* Recent Searches */}
          {!searchQuery.trim() && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold small text-muted text-uppercase" style={{ fontSize: 10 }}>Recent Searches</span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-muted small text-decoration-none"
                  style={{ fontSize: 11 }}
                  onClick={() => {
                    localStorage.removeItem('cravepulse_recent_searches');
                    setRecentSearches([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="d-flex flex-wrap gap-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-sm btn-light rounded-pill px-3 py-1 small text-dark d-flex align-items-center gap-1 border"
                    onClick={() => {
                      setSearchQuery(term);
                    }}
                  >
                    <i className="bi bi-clock-history text-muted small"></i>
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dish matches */}
          {suggestionData.dishes?.length > 0 && (
            <div className="p-2 border-bottom">
              <span className="fw-bold small text-muted text-uppercase d-block mb-2" style={{ fontSize: 10 }}>
                Dishes & Items
              </span>
              <div className="d-flex flex-column gap-1">
                {suggestionData.dishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    className="btn btn-light bg-transparent border-0 text-start p-2 rounded-3 d-flex justify-content-between align-items-center w-100 hover-bg-light"
                    onClick={() => handleSelectDish(dish)}
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <span className={`badge ${dish.isVeg ? 'bg-success' : 'bg-danger'} p-1 rounded-circle`} style={{ width: 8, height: 8 }}></span>
                      <div className="text-truncate">
                        <strong className="d-block small text-dark text-truncate">{dish.name}</strong>
                        <small className="text-muted" style={{ fontSize: 11 }}>In {dish.restaurantName || 'Kitchen'}</small>
                      </div>
                    </div>
                    <span className="fw-bold small text-primary ms-2">₹{dish.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Restaurant matches */}
          {suggestionData.restaurants?.length > 0 && (
            <div className="p-2">
              <span className="fw-bold small text-muted text-uppercase d-block mb-2" style={{ fontSize: 10 }}>
                Kitchens & Restaurants
              </span>
              <div className="d-flex flex-column gap-1">
                {suggestionData.restaurants.map((rest) => (
                  <button
                    key={rest.id}
                    type="button"
                    className="btn btn-light bg-transparent border-0 text-start p-2 rounded-3 d-flex align-items-center gap-2 w-100 hover-bg-light"
                    onClick={() => handleSelectRestaurant(rest)}
                  >
                    <img
                      src={rest.bannerImage || rest.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                      alt={rest.name}
                      className="rounded-2 object-fit-cover"
                      style={{ width: 36, height: 36 }}
                    />
                    <div className="text-truncate">
                      <strong className="d-block small text-dark text-truncate">{rest.name}</strong>
                      <small className="text-muted" style={{ fontSize: 11 }}>
                        ⭐ {rest.rating || '4.5'} • {rest.cuisine || rest.locality || 'Gourmet'}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery.trim() && suggestionData.dishes?.length === 0 && suggestionData.restaurants?.length === 0 && (
            <div className="p-3 text-center text-muted small">
              No direct matches for "{searchQuery}". Press Enter to view all results.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavSearchAutocomplete;
