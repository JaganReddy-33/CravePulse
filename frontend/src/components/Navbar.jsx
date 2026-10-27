import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRealtime } from '../context/RealtimeContext';
import BrandLogo from './BrandLogo';
import { PAN_INDIA_CITIES, DEFAULT_HUB } from '../config/panIndiaLocations';
import api from '../services/api';
import ModalPortal from './ModalPortal';

const Navbar = ({ onOpenCart }) => {
  const { user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useRealtime();
  const location = useLocation();
  const navigate = useNavigate();

  // Multi-City state
  const [selectedCity, setSelectedCity] = useState(PAN_INDIA_CITIES[0]);
  const [selectedHub, setSelectedHub] = useState(() => {
    const saved = localStorage.getItem('cravepulse_hub');
    return saved ? JSON.parse(saved) : DEFAULT_HUB;
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Search auto-suggest state with Dish and Restaurant parity
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
  const userMenuRef = useRef(null);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      localStorage.setItem('cravepulse_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch search suggestions (dishes + restaurants)
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
            dishes: res.data.dishes || []
          });
          setShowSuggestions(true);
        }
      } catch (e) {
        // Fallback to basic restaurant search
        try {
          const res = await api.get('/restaurants', { params: { search: searchQuery } });
          if (res.success && Array.isArray(res.data)) {
            setSuggestionData({
              restaurants: res.data.slice(0, 5),
              dishes: []
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectHub = (city, hub) => {
    setSelectedCity(city);
    const hubWithCity = { ...hub, cityName: city.name, stateName: city.state };
    setSelectedHub(hubWithCity);
    localStorage.setItem('cravepulse_hub', JSON.stringify(hubWithCity));
    setShowLocationModal(false);
    setGpsLocked(false);
  };

  const handleDetectLiveGps = () => {
    setDetectingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const detectedHub = {
            id: 'live_gps',
            name: 'Current Location',
            area: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
            cityName: selectedCity.name,
            coords: [lat, lng],
          };
          setSelectedHub(detectedHub);
          localStorage.setItem('cravepulse_hub', JSON.stringify(detectedHub));
          setDetectingGps(false);
          setGpsLocked(true);
          setShowLocationModal(false);
        },
        () => {
          // Fallback simulation for local/testing
          setTimeout(() => {
            const simulatedHub = {
              id: 'gps_sim',
              name: selectedCity.hubs[0].name,
              area: 'Live GPS Pinpoint (Verified)',
              cityName: selectedCity.name,
              coords: selectedCity.hubs[0].coords,
            };
            setSelectedHub(simulatedHub);
            localStorage.setItem('cravepulse_hub', JSON.stringify(simulatedHub));
            setDetectingGps(false);
            setGpsLocked(true);
            setShowLocationModal(false);
          }, 600);
        },
        { timeout: 5000 }
      );
    } else {
      setDetectingGps(false);
      alert('Geolocation is not supported by your browser.');
    }
  };

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

  // Filter hubs based on search term
  const allFilteredHubs = [];
  PAN_INDIA_CITIES.forEach(city => {
    city.hubs.forEach(h => {
      if (!locationSearch || 
          h.name.toLowerCase().includes(locationSearch.toLowerCase()) || 
          h.area.toLowerCase().includes(locationSearch.toLowerCase()) ||
          city.name.toLowerCase().includes(locationSearch.toLowerCase())) {
        allFilteredHubs.push({ ...h, city });
      }
    });
  });

  return (
    <>
      <nav 
        className="navbar navbar-expand-lg fixed-top border-bottom cravepulse-fixed-top" 
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(16px)', 
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          zIndex: 1030 
        }}
      >
        <div className="container-fluid px-3 px-md-4">
          {/* Brand Logo & Pan-India Location Selector */}
          <div className="d-flex align-items-center gap-3">
            <BrandLogo />

            {/* Pan-India Multi-City Location Trigger */}
            <div className="d-none d-sm-block">
              <button 
                type="button" 
                className="btn btn-sm btn-light rounded-pill px-3 py-2 border d-flex align-items-center gap-2 text-start shadow-sm hover-lift transition"
                onClick={() => setShowLocationModal(true)}
                style={{ maxWidth: 240 }}
              >
                <i className={`bi bi-geo-alt-fill fs-6 ${gpsLocked ? 'text-success' : 'text-danger'}`}></i>
                <div className="text-truncate">
                  <div className="fw-bold small text-dark text-truncate" style={{ lineHeight: 1.1 }}>
                    {selectedHub.name}
                  </div>
                  <small className="text-muted" style={{ fontSize: 10 }}>
                    {selectedHub.cityName || selectedCity.name} {gpsLocked ? '• GPS Locked' : ''}
                  </small>
                </div>
                <i className="bi bi-chevron-down small text-muted ms-1"></i>
              </button>
            </div>
          </div>

          {/* Center Search Bar with Real-Time Auto-Suggest */}
          <div className="d-none d-md-block flex-grow-1 mx-3 mx-lg-4 position-relative" style={{ maxWidth: 420 }} ref={searchRef}>
            <div className="input-group rounded-pill overflow-hidden border shadow-sm bg-light">
              <span className="input-group-text bg-transparent border-0 ps-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-0 ps-1"
                placeholder="Search biryani, pizza, North Indian, salads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    saveRecentSearch(searchQuery.trim());
                    setShowSuggestions(false);
                    navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
              {searchQuery && (
                <button className="btn btn-transparent border-0 pe-3 text-muted" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions & Recent Searches Dropdown */}
            {showSuggestions && (
              <div className="card position-absolute start-0 end-0 mt-2 shadow-xl border-0 rounded-4 p-2 bg-white" style={{ zIndex: 1050, maxHeight: 420, overflowY: 'auto' }}>
                {!searchQuery.trim() ? (
                  /* Recent Searches */
                  <div className="p-2">
                    <div className="text-muted small fw-bold mb-2 d-flex align-items-center gap-1">
                      <i className="bi bi-clock-history"></i> RECENT SEARCHES
                    </div>
                    <div className="d-flex flex-wrap gap-1.5">
                      {recentSearches.map((term, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-sm btn-light rounded-pill px-3 py-1 text-dark border small hover-lift"
                          onClick={() => {
                            setSearchQuery(term);
                            saveRecentSearch(term);
                            setShowSuggestions(false);
                            navigate(`/?query=${encodeURIComponent(term)}`);
                          }}
                        >
                          <i className="bi bi-search me-1 text-muted" style={{ fontSize: 10 }}></i>
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Dishes Section */}
                    {suggestionData.dishes?.length > 0 && (
                      <div className="mb-2">
                        <div className="p-2 border-bottom text-muted small fw-bold d-flex align-items-center gap-1">
                          <span>🍲</span> DISHES
                        </div>
                        {suggestionData.dishes.map(d => (
                          <div
                            key={`dish-${d.id}`}
                            className="p-2 rounded-3 hover-bg-light cursor-pointer d-flex align-items-center justify-content-between"
                            onClick={() => handleSelectDish(d)}
                          >
                            <div className="d-flex align-items-center gap-2">
                              {d.imageUrl && (
                                <img
                                  src={d.imageUrl}
                                  alt={d.name}
                                  className="rounded-2 object-fit-cover"
                                  style={{ width: 36, height: 36 }}
                                />
                              )}
                              <div>
                                <div className="fw-bold small text-dark">{d.name}</div>
                                <small className="text-muted">at {d.restaurantName || 'Gourmet Kitchen'}</small>
                              </div>
                            </div>
                            <span className="badge bg-light text-dark border small fw-bold">₹{d.platformPrice}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Restaurants Section */}
                    {suggestionData.restaurants?.length > 0 && (
                      <div>
                        <div className="p-2 border-bottom text-muted small fw-bold d-flex align-items-center gap-1">
                          <span>🍽️</span> RESTAURANTS
                        </div>
                        {suggestionData.restaurants.map(r => (
                          <div
                            key={`rest-${r.id}`}
                            className="p-2 rounded-3 hover-bg-light cursor-pointer d-flex align-items-center justify-content-between"
                            onClick={() => handleSelectRestaurant(r)}
                          >
                            <div>
                              <div className="fw-bold small text-dark">{r.name}</div>
                              <small className="text-muted">{r.cuisineTypes} • ★ {r.rating}</small>
                            </div>
                            <span className="badge bg-success-subtle text-success small">0% Markup</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestionData.dishes?.length === 0 && suggestionData.restaurants?.length === 0 && (
                      <div className="p-4 text-center text-muted small">
                        No dishes or restaurants found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Consumer Navigation Links (Desktop) */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            <Link 
              to="/offers" 
              className={`nav-link fw-semibold px-2 d-flex align-items-center gap-1 ${location.pathname === '/offers' ? 'text-primary fw-bold' : 'text-secondary'}`}
            >
              <span>🎁</span> Offers
            </Link>
            <Link 
              to="/help" 
              className={`nav-link fw-semibold px-2 d-flex align-items-center gap-1 ${location.pathname === '/help' ? 'text-primary fw-bold' : 'text-secondary'}`}
            >
              <i className="bi bi-question-circle"></i> Help
            </Link>
            <Link 
              to="/orders" 
              className={`nav-link fw-semibold px-2 d-flex align-items-center gap-1 ${location.pathname === '/orders' ? 'text-primary fw-bold' : 'text-secondary'}`}
            >
              <i className="bi bi-clock-history"></i> Orders
            </Link>
          </div>

          {/* Right Section Actions: Notifications, Cart, User Auth */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Notifications Bell */}
            <div className="position-relative">
              <button
                className="btn btn-light rounded-circle p-2 position-relative shadow-sm"
                style={{ width: 40, height: 40 }}
                onClick={() => setShowNotifs(!showNotifs)}
                aria-label="Notifications"
              >
                <i className="bi bi-bell fs-5 text-secondary"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="card position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-0 overflow-hidden bg-white" style={{ width: 340, zIndex: 1050 }}>
                  <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0 fw-bold">Live Activity Feed</h6>
                      <small className="text-muted" style={{ fontSize: 11 }}>
                        {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                      </small>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-primary text-decoration-none fw-bold"
                        style={{ fontSize: 11 }}
                        onClick={markAllAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 330, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted small">No recent notifications</div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div
                          key={n.id || idx}
                          className={`p-3 border-bottom transition d-flex align-items-start gap-2 ${
                            !n.isRead ? 'bg-primary-subtle bg-opacity-25' : 'hover-bg-light'
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id);
                          }}
                        >
                          <span
                            className={`badge p-1 rounded-circle mt-1 flex-shrink-0 ${
                              !n.isRead ? 'bg-primary' : 'bg-secondary bg-opacity-50'
                            }`}
                            style={{ width: 8, height: 8 }}
                          ></span>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className={`small ${!n.isRead ? 'fw-bold text-dark' : 'text-secondary'}`}>
                                {n.title}
                              </span>
                              <small className="text-muted" style={{ fontSize: 10 }}>{n.createdAt}</small>
                            </div>
                            <div className="text-muted small mt-1" style={{ fontSize: 12 }}>{n.message}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 bg-light border-top text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-muted text-decoration-none small py-0"
                        style={{ fontSize: 11 }}
                        onClick={clearAllNotifications}
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              className="btn btn-primary rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm transition hover-lift"
              style={{ background: '#ff4d29', borderColor: '#ff4d29' }}
              onClick={onOpenCart}
              aria-label="View Cart"
            >
              <i className="bi bi-bag-check-fill fs-6"></i>
              <span className="fw-bold d-none d-sm-inline">Cart</span>
              {totalItemCount > 0 ? (
                <span className="badge bg-white text-danger rounded-pill fw-bold ms-1">
                  {totalItemCount}
                </span>
              ) : (
                <span className="badge bg-white bg-opacity-25 text-white rounded-pill ms-1 d-none d-md-inline" style={{ fontSize: 11 }}>0</span>
              )}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="position-relative" ref={userMenuRef}>
                <button 
                  className="btn p-0 border-0 d-flex align-items-center gap-2" 
                  type="button" 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div 
                    className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #ff4d29 0%, #ff8a65 100%)', fontSize: 16 }}
                  >
                    {user.fullName?.charAt(0) || 'J'}
                  </div>
                  <span className="fw-semibold small text-dark d-none d-md-inline">{user.fullName?.split(' ')[0] || 'Jaganmohan'}</span>
                  <i className="bi bi-chevron-down small text-muted d-none d-md-inline"></i>
                </button>

                {showUserMenu && (
                  <div className="card position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2 bg-white" style={{ minWidth: 230, zIndex: 1050 }}>
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-bold text-dark small">{user.fullName || 'Jaganmohan Reddy'}</div>
                      <small className="text-muted d-block text-truncate">{user.email}</small>
                      <span className="badge bg-secondary-subtle text-secondary small mt-1">{user.role}</span>
                    </div>
                    <Link to="/orders" className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2" onClick={() => setShowUserMenu(false)}>
                      <i className="bi bi-clock-history"></i> My Orders
                    </Link>
                    <Link to="/profile" className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2" onClick={() => setShowUserMenu(false)}>
                      <i className="bi bi-geo-alt"></i> Saved Addresses & Wallet
                    </Link>
                    <Link to="/offers" className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2" onClick={() => setShowUserMenu(false)}>
                      <i className="bi bi-tag"></i> Offers & Promos
                    </Link>
                    <div className="dropdown-divider my-1"></div>
                    <button 
                      className="dropdown-item rounded-3 py-2 px-3 small text-danger d-flex align-items-center gap-2"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-secondary rounded-pill px-3 py-1 btn-sm fw-semibold">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary rounded-pill px-3 py-1 btn-sm fw-bold d-none d-sm-inline"
                  style={{ background: '#ff4d29', borderColor: '#ff4d29' }}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              className="btn btn-light rounded-circle p-2 d-lg-none shadow-sm"
              style={{ width: 40, height: 40 }}
              onClick={() => setShowMobileDrawer(true)}
              aria-label="Toggle navigation"
            >
              <i className="bi bi-list fs-5"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Pan-India Multi-City & Locality Selector Modal */}
      {showLocationModal && (
        <ModalPortal isOpen={showLocationModal}>
          <div 
            className="modal show d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', zIndex: 10050 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowLocationModal(false); }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 10060 }}>
              <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden bg-white">
              <div className="modal-header border-bottom p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-extrabold text-dark mb-0">Choose Delivery City & Area</h5>
                  <small className="text-muted">Explore gourmet dining across India with 100% price parity</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowLocationModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                {/* 1. Live GPS Locator Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 py-3 rounded-4 d-flex align-items-center justify-content-between shadow-sm hover-lift"
                    onClick={handleDetectLiveGps}
                    disabled={detectingGps}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-primary-subtle p-2 text-primary">
                        <i className="bi bi-crosshair fs-4"></i>
                      </div>
                      <div className="text-start">
                        <strong className="d-block text-dark">
                          {detectingGps ? 'Locking Satellite GPS...' : 'Use Current Live Location'}
                        </strong>
                        <small className="text-muted">Pinpoint your exact delivery doorstep coordinates</small>
                      </div>
                    </div>
                    {detectingGps ? (
                      <span className="spinner-border spinner-border-sm text-primary"></span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success">Fast GPS</span>
                    )}
                  </button>
                </div>

                {/* 2. City Selector Horizontal Pills */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark text-uppercase">Select Operating Metro</label>
                  <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {PAN_INDIA_CITIES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold text-nowrap d-flex align-items-center gap-2 ${selectedCity.id === c.id ? 'btn-primary text-white shadow-sm' : 'btn-light border'}`}
                        style={selectedCity.id === c.id ? { background: '#ff4d29', borderColor: '#ff4d29' } : {}}
                        onClick={() => setSelectedCity(c)}
                      >
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Search locality input */}
                <div className="mb-3">
                  <div className="input-group rounded-pill overflow-hidden border">
                    <span className="input-group-text bg-white border-0 ps-3"><i className="bi bi-search text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control border-0 ps-1"
                      placeholder={`Search areas in ${selectedCity.name} (e.g. ${selectedCity.hubs[0].name})...`}
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                    />
                    {locationSearch && (
                      <button className="btn btn-white border-0 pe-3 text-muted" onClick={() => setLocationSearch('')}>✕</button>
                    )}
                  </div>
                </div>

                {/* 4. Localities / Micro-Hubs Grid */}
                <label className="form-label small fw-bold text-dark text-uppercase mb-2">
                  Popular Hubs in {selectedCity.name}
                </label>
                <div className="row g-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {(locationSearch ? allFilteredHubs : selectedCity.hubs.map(h => ({ ...h, city: selectedCity }))).map(h => {
                    const isSelected = selectedHub.id === h.id;
                    return (
                      <div key={h.id} className="col-md-6">
                        <button
                          type="button"
                          className={`btn text-start w-100 p-3 rounded-3 border d-flex justify-content-between align-items-center transition ${isSelected ? 'bg-primary-subtle border-primary' : 'bg-light hover-bg-white'}`}
                          onClick={() => handleSelectHub(h.city, h)}
                        >
                          <div>
                            <strong className="d-block text-dark small">{h.name}</strong>
                            <small className="text-muted" style={{ fontSize: 11 }}>{h.area} • {h.city.name}</small>
                          </div>
                          {isSelected && <i className="bi bi-check-circle-fill text-primary"></i>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Mobile Offcanvas Drawer (Strictly Consumer Only) */}
      {showMobileDrawer && (
        <ModalPortal isOpen={showMobileDrawer}>
          <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }} onClick={() => setShowMobileDrawer(false)}>
            <div 
              className="bg-white h-100 shadow-2xl p-4 d-flex flex-column" 
              style={{ width: '82%', maxWidth: 340, zIndex: 10060 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <BrandLogo size="sm" />
                <button className="btn-close" onClick={() => setShowMobileDrawer(false)}></button>
              </div>

              {/* Consumer Links Only */}
              <div className="d-flex flex-column gap-2 mb-4">
                <Link to="/" className="btn btn-light text-start py-2 px-3 rounded-3 fw-semibold text-dark" onClick={() => setShowMobileDrawer(false)}>
                  <i className="bi bi-house-door me-2 text-primary"></i> Home
                </Link>
                <Link to="/orders" className="btn btn-light text-start py-2 px-3 rounded-3 fw-semibold text-dark" onClick={() => setShowMobileDrawer(false)}>
                  <i className="bi bi-clock-history me-2 text-primary"></i> My Orders
                </Link>
                <Link to="/offers" className="btn btn-light text-start py-2 px-3 rounded-3 fw-semibold text-dark" onClick={() => setShowMobileDrawer(false)}>
                  <span className="me-2">🎁</span> Offers & Promos
                </Link>
                <Link to="/profile" className="btn btn-light text-start py-2 px-3 rounded-3 fw-semibold text-dark" onClick={() => setShowMobileDrawer(false)}>
                  <i className="bi bi-person me-2 text-primary"></i> Saved Addresses & Wallet
                </Link>
                <Link to="/help" className="btn btn-light text-start py-2 px-3 rounded-3 fw-semibold text-dark" onClick={() => setShowMobileDrawer(false)}>
                  <i className="bi bi-question-circle me-2 text-primary"></i> Help Center & FAQs
                </Link>
                <Link to="/cities" className="btn btn-light text-start py-2 px-3 rounded-3 fw-semibold text-dark" onClick={() => setShowMobileDrawer(false)}>
                  <i className="bi bi-geo-alt me-2 text-primary"></i> Delivery Cities (Pan-India)
                </Link>
              </div>

              {/* User Account / Sign In */}
              <div className="mt-auto pt-3 border-top">
                {user ? (
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold small text-dark">{user.fullName || 'Jaganmohan Reddy'}</div>
                      <small className="text-muted">{user.role}</small>
                    </div>
                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onClick={() => { logout(); setShowMobileDrawer(false); }}>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    <Link to="/login" className="btn btn-outline-secondary w-50 rounded-pill btn-sm fw-bold" onClick={() => setShowMobileDrawer(false)}>
                      Sign In
                    </Link>
                    <Link to="/register" className="btn btn-primary w-50 rounded-pill btn-sm fw-bold" style={{ background: '#ff4d29', borderColor: '#ff4d29' }} onClick={() => setShowMobileDrawer(false)}>
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default Navbar;
