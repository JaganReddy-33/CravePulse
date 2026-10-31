import { getPreference, setPreference } from "../services/preferences";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useRealtime } from "../context/RealtimeContext";
import BrandLogo from "./BrandLogo";
import {
  PAN_INDIA_CITIES,
  DEFAULT_HUB,
  DEFAULT_CITY,
  loadLocations,
} from "../config/panIndiaLocations";
import NavSearchAutocomplete from "./navbar/NavSearchAutocomplete";
import NavLocationModal from "./navbar/NavLocationModal";
import NavNotificationsDropdown from "./navbar/NavNotificationsDropdown";
import NavUserDropdown from "./navbar/NavUserDropdown";
import NavMobileDrawer from "./navbar/NavMobileDrawer";

const Navbar = ({ onOpenCart }) => {
  const navRef = useRef(null);
  useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    const sync = () =>
      document.documentElement.style.setProperty(
        "--nav-measured-height",
        `${Math.ceil(node.getBoundingClientRect().height)}px`,
      );
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    sync();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--nav-measured-height");
    };
  }, []);
  const { user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    isConnected,
  } = useRealtime();

  useEffect(() => {
    loadLocations()
      .then((cities) => {
        if (cities.length) setSelectedCity(cities[0]);
      })
      .catch(() => {});
  }, []);
  // Multi-City state
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [selectedHub, setSelectedHub] = useState(() => {
    try {
      const saved = getPreference("hub");
      return saved || DEFAULT_HUB;
    } catch {
      return DEFAULT_HUB;
    }
  });
  useEffect(() => {
    const sync = () => setSelectedHub(getPreference("hub") || DEFAULT_HUB);
    window.addEventListener("preferences-changed", sync);
    return () => window.removeEventListener("preferences-changed", sync);
  }, []);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  // Popover and Drawer toggles
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const handleDetectGps = () => {
    setDetectingGps(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const detectedHub = {
            id: "live_gps",
            name: "Current Location",
            area: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
            cityName: selectedCity.name,
            coords: [lat, lng],
          };
          setSelectedHub(detectedHub);
          setPreference("hub", detectedHub);
          setDetectingGps(false);
          setGpsLocked(true);
          setShowLocationModal(false);
        },
        (err) => {
          setDetectingGps(false);
          setGpsLocked(false);
          window.alert(
            "Location permission was denied. Please choose your locality.",
          );
        },
        { timeout: 5000 },
      );
    } else {
      setDetectingGps(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className="navbar navbar-expand-lg fixed-top border-bottom cravepulse-fixed-top"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          zIndex: 1030,
          flexWrap: "wrap",
        }}
        aria-label="Main Navigation Bar"
      >
        <div className="container-fluid px-3 px-md-4">
          {/* Brand Logo & Location Trigger */}
          <div className="d-flex align-items-center gap-1 gap-sm-2 gap-md-3">
            <BrandLogo size="sm" />

            {/* Location selector button (Desktop / Tablet) */}
            <div className="d-none d-sm-block">
              <button
                type="button"
                className="btn btn-sm btn-light rounded-pill px-3 py-2 border d-flex align-items-center gap-2 text-start shadow-sm hover-lift transition touch-target"
                onClick={() => setShowLocationModal(true)}
                style={{ maxWidth: 220 }}
                aria-label={`Current delivery location: ${selectedHub.name}. Click to change.`}
              >
                <i
                  className={`bi bi-geo-alt-fill fs-6 ${gpsLocked ? "text-success" : "text-danger"}`}
                ></i>
                <div className="text-truncate">
                  <div
                    className="fw-bold small text-dark text-truncate"
                    style={{ lineHeight: 1.1 }}
                  >
                    {selectedHub.name}
                  </div>
                  <small className="text-muted" style={{ fontSize: 10 }}>
                    {selectedHub.cityName || selectedCity.name}{" "}
                    {gpsLocked ? "• GPS" : ""}
                  </small>
                </div>
                <i className="bi bi-chevron-down small text-muted ms-1"></i>
              </button>
            </div>

            {/* Location selector pill (Mobile < 576px) */}
            <div className="d-block d-sm-none">
              <button
                type="button"
                className="btn btn-sm btn-light rounded-pill px-2 py-1 border d-flex align-items-center gap-1 text-start shadow-sm touch-target"
                onClick={() => setShowLocationModal(true)}
                style={{ maxWidth: 115 }}
                aria-label={`Delivery location: ${selectedHub.name}`}
              >
                <i
                  className={`bi bi-geo-alt-fill ${gpsLocked ? "text-success" : "text-danger"}`}
                  style={{ fontSize: 11 }}
                ></i>
                <span
                  className="fw-bold text-dark text-truncate"
                  style={{ fontSize: 11, lineHeight: 1.1 }}
                >
                  {selectedHub.name}
                </span>
                <i
                  className="bi bi-chevron-down text-muted"
                  style={{ fontSize: 9 }}
                ></i>
              </button>
            </div>
          </div>

          {/* Cross-dish & Restaurant Autocomplete Search (Desktop/Tablet >= 768px) */}
          <NavSearchAutocomplete
            selectedHub={selectedHub}
            className="d-none d-md-block flex-grow-1 mx-3 mx-lg-4"
            style={{ maxWidth: 420 }}
          />

          {/* Action Links & Utility Controls */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Offers Link */}
            <Link
              to="/offers"
              className="btn btn-sm btn-light rounded-pill px-3 py-2 border d-none d-lg-flex align-items-center gap-2 fw-semibold text-dark shadow-sm hover-lift touch-target"
            >
              <i className="bi bi-percent text-danger fs-6"></i>
              <span>Deals</span>
            </Link>

            {/* Notification Center */}
            <NavNotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              showNotifs={showNotifs}
              setShowNotifs={setShowNotifs}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              clearAllNotifications={clearAllNotifications}
            />

            {/* Food Bag / Cart Button (Desktop/Tablet >= 768px, mobile uses bottom nav) */}
            <button
              type="button"
              className="btn btn-light rounded-pill px-3 py-2 border position-relative d-none d-md-flex align-items-center gap-2 shadow-sm hover-lift touch-target"
              onClick={onOpenCart}
              aria-label={`Open food bag with ${totalItemCount} items`}
            >
              <i className="bi bi-bag-fill text-danger fs-6"></i>
              <span className="fw-bold text-dark">Bag</span>
              {totalItemCount > 0 && (
                <span
                  className="badge rounded-pill bg-danger text-white border border-white"
                  style={{ fontSize: 11 }}
                >
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* User Profile Menu (Desktop/Tablet >= 768px, mobile uses drawer & bottom nav) */}
            <div className="d-none d-md-block">
              <NavUserDropdown
                user={user}
                logout={logout}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
              />
            </div>

            {/* Mobile Navigation Drawer Hamburger Button */}
            <button
              type="button"
              className="btn btn-light rounded-circle p-2 border d-lg-none touch-target"
              onClick={() => setShowMobileDrawer(true)}
              aria-label="Open mobile navigation drawer"
            >
              <i className="bi bi-list fs-5"></i>
            </button>
          </div>
        </div>

        {/* Search bar row: visible on mobile & small tablet (< 768px) where top search is hidden */}
        <div className="navbar-inline-search-sm w-100 px-3 pb-2 d-flex d-md-none bg-white">
          <NavSearchAutocomplete
            selectedHub={selectedHub}
            className="flex-grow-1"
            style={{ maxWidth: "100%" }}
          />
        </div>
      </nav>

      {/* Location Picker Modal */}
      <NavLocationModal
        show={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedHub={selectedHub}
        setSelectedHub={setSelectedHub}
        locationSearch={locationSearch}
        setLocationSearch={setLocationSearch}
        detectingGps={detectingGps}
        handleDetectGps={handleDetectGps}
      />

      {/* Mobile Offcanvas Drawer */}
      <NavMobileDrawer
        show={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        user={user}
        logout={logout}
        selectedHub={selectedHub}
        onOpenLocationModal={() => setShowLocationModal(true)}
      />
    </>
  );
};

export default Navbar;
