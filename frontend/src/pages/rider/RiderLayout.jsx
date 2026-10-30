import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const RIDER_NAV_ITEMS = [
  {
    path: "/rider/fleet/live-active-delivery",
    aliasPath: "/rider",
    label: "Live Dispatch",
    icon: "bi-geo-alt-fill",
    badge: "ACTIVE",
  },
  {
    path: "/rider/fleet/daily-earnings-incentives",
    aliasPath: "/rider/earnings",
    label: "Earnings & Pay",
    icon: "bi-wallet2",
    badge: null,
  },
  {
    path: "/rider/fleet/completed-trips-ledger",
    aliasPath: "/rider/history",
    label: "Trip Ledger",
    icon: "bi-clock-history",
    badge: null,
  },
  {
    path: "/rider/fleet/captain-identity-compliance",
    aliasPath: "/rider/profile",
    label: "Captain Profile",
    icon: "bi-person-badge",
    badge: "VERIFIED",
  },
];

const RiderLayout = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); 
  const [shiftDuration, setShiftDuration] = useState("?");
  const location = useLocation();
  const navigate = useNavigate();

  const riderName = user?.fullName || "Delivery Captain";
  const riderAvatar = user?.avatarUrl || "/avatar-placeholder.svg";
  const vehicleModel = profile?.vehicleNumber || "Vehicle not added";

  useEffect(() => {
    api
      .get("/rider/profile")
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/rider/login", { replace: true });
  };

  const isNavActive = (item) => {
    const current = location.pathname.replace(/\/$/, "");
    const p1 = item.path.replace(/\/$/, "");
    const p2 = item.aliasPath.replace(/\/$/, "");
    return (
      current === p1 ||
      current === p2 ||
      (item.aliasPath === "/rider" && (current === "/rider" || current === ""))
    );
  };

  return (
    <div
      className="rider-portal d-flex flex-column min-vh-100"
      style={{ background: "#080c14", color: "#f8fafc" }}
    >
      {/* Streamlined Compact Sticky Header */}
      <header
        className="fixed-top shadow-2xl p-2 p-md-2"
        style={{
          background: "rgba(10, 15, 26, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 1040,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="container-fluid px-3 px-md-4 py-2 d-flex justify-content-between align-items-center">
          {/* Brand & Left Quick Links */}
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Hamburger Menu Trigger Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="btn btn-sm btn-outline-secondary text-light d-lg-none border-0 p-1"
              style={{ background: "rgba(255,255,255,0.05)" }}
              aria-label="Toggle navigation menu"
            >
              <i
                className={`bi ${showMobileMenu ? "bi-x-lg" : "bi-list"} fs-5`}
              ></i>
            </button>

            <Link
              to="/"
              className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center text-light"
              style={{
                width: 36,
                height: 36,
                borderColor: "rgba(255, 255, 255, 0.15)",
              }}
              title="Return to Customer App"
            >
              <i className="bi bi-arrow-left fs-6"></i>
            </Link>

            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center text-dark fw-extrabold shadow-sm flex-shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  background: "#00e676",
                  boxShadow: "0 0 16px rgba(0, 230, 118, 0.4)",
                }}
              >
                ⚡
              </div>
              <div className="lh-1">
                <div className="fw-extrabold text-white fs-6 d-flex align-items-center gap-2">
                  <span>CravePulse Fleet</span>
                  <span
                    className="badge rounded-pill text-dark small d-none d-lg-inline-block"
                    style={{ background: "#00e676", fontSize: 9 }}
                  >
                    COCKPIT
                  </span>
                </div>
                <small
                  className="text-secondary d-none d-sm-inline"
                  style={{ fontSize: 10 }}
                >
                  Zero Penalty • 100% Tips Pass-Through
                </small>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Pill Dock */}
          <nav
            className="d-none d-lg-flex align-items-center gap-1 p-1 rounded-pill"
            style={{
              background: "rgba(17, 24, 39, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {RIDER_NAV_ITEMS.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 transition ${
                    active
                      ? "text-dark shadow-sm"
                      : "text-light text-opacity-75 hover-text-white"
                  }`}
                  style={
                    active
                      ? {
                          background: "#00e676",
                          boxShadow: "0 0 14px rgba(0, 230, 118, 0.35)",
                        }
                      : {}
                  }
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`badge rounded-pill ${active ? "bg-dark text-success" : "bg-success text-dark"}`}
                      style={{ fontSize: 8, padding: "2px 6px" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Badges & Duty Control */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Battery & Telemetry Pill */}
            {/* <div
              className="d-none d-md-flex align-items-center gap-2 px-3 py-1.5 rounded-pill"
              style={{
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <i className="bi bi-battery-charging text-info fs-6"></i>
              <div className="lh-1 text-end">
                <span
                  className="fw-extrabold text-info small"
                  style={{ fontSize: 11 }}
                >
                  84% (68 km)
                </span>
                <small
                  className="text-secondary d-block"
                  style={{ fontSize: 8 }}
                >
                  ATHER 450X
                </small>
              </div>
            </div> */}

            {/* Quick Shift Earnings */}
            {/* <div
              className="d-none d-sm-flex align-items-center gap-2 px-3 py-1.5 rounded-pill"
              style={{
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <i className="bi bi-wallet2 text-success fs-6"></i>
              <div className="lh-1 text-end">
                <span
                  className="fw-extrabold text-success small"
                  style={{ fontSize: 12 }}
                >
                  ₹840.00
                </span>
                <small
                  className="text-secondary d-block"
                  style={{ fontSize: 8 }}
                >
                  6 RUNS
                </small>
              </div>
            </div> */}


            {/* Captain Avatar Menu */}
            <div className="position-relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none text-white"
                style={{ outline: "none" }}
              >
                <img
                  src={riderAvatar}
                  alt={riderName}
                  className="rounded-circle border"
                  style={{
                    width: 36,
                    height: 36,
                    objectFit: "cover",
                    borderColor: "#00e676",
                  }}
                />
                <i className="bi bi-chevron-down text-secondary small d-none d-sm-inline"></i>
              </button>

              {showProfileMenu && (
                <div
                  className="position-absolute end-0 mt-2 p-2 rounded-4 shadow-2xl border animate-slide-down"
                  style={{
                    width: 260,
                    background: "#111827",
                    borderColor: "rgba(255,255,255,0.15)",
                    zIndex: 1050,
                  }}
                >
                  <div className="p-2 border-bottom border-secondary border-opacity-25 mb-1">
                    <div className="fw-bold text-white small">{riderName}</div>
                    <small className="text-success d-block">
                      {vehicleModel}
                    </small>
                    <small className="text-secondary" style={{ fontSize: 11 }}>
                      Indiranagar Hub • 4.98 ★
                    </small>
                  </div>
                  <Link
                    to="/rider/fleet/captain-identity-compliance"
                    className="dropdown-item py-2 px-3 rounded-3 text-light small d-flex align-items-center gap-2 hover-bg-dark"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <i className="bi bi-shield-check text-success"></i> Captain
                    KYC & Compliance
                  </Link>
                  <Link
                    to="/rider/fleet/daily-earnings-incentives"
                    className="dropdown-item py-2 px-3 rounded-3 text-light small d-flex align-items-center gap-2 hover-bg-dark"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <i className="bi bi-wallet2 text-warning"></i> Earnings &
                    Payout Wallet
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item py-2 px-3 rounded-3 text-danger small d-flex align-items-center gap-2 hover-bg-dark w-100 text-start border-0 bg-transparent"
                  >
                    <i className="bi bi-box-arrow-right"></i> End Shift & Sign
                    Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Vertical Dropdown Menu Drawer */}
        {showMobileMenu && (
          <div
            className="d-lg-none px-3 py-3 border-top border-secondary border-opacity-25 shadow-lg animate-slide-down"
            style={{ background: "rgba(10, 15, 26, 0.98)" }}
          >
            <nav className="d-flex flex-column gap-2">
              {RIDER_NAV_ITEMS.map((item) => {
                const active = isNavActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`btn btn-sm py-2.5 px-3 fw-bold d-flex align-items-center justify-content-between text-decoration-none rounded-3 transition ${
                      active
                        ? "text-dark shadow-sm"
                        : "text-light text-opacity-75 bg-transparent border border-secondary border-opacity-25"
                    }`}
                    style={
                      active ? { background: "#00e676", border: "none" } : {}
                    }
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className={`bi ${item.icon} fs-6 me-2`}></i>
                      <span style={{ fontSize: 13 }}>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`badge rounded-pill ${active ? "bg-dark text-success" : "bg-success text-dark"}`}
                        style={{ fontSize: 9, padding: "3px 8px" }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Dynamic Zone & Shift Micro-Telemetry Bar */}
        {/* <div
          className="px-3 px-md-4 py-1 d-flex align-items-center justify-content-between overflow-x-auto text-nowrap"
          style={{
            background: "rgba(6, 10, 18, 0.95)",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            fontSize: 11,
            scrollbarWidth: "none",
          }}
        >
          <div className="d-flex align-items-center gap-3 text-secondary">
            <span className="text-light fw-bold">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i>
              Indiranagar Hub
            </span>
            <span className="opacity-25">•</span>
            <span className="text-warning fw-extrabold">
              <i className="bi bi-lightning-charge-fill me-1"></i>
              1.3x Peak Surge
            </span>
            <span className="opacity-25">•</span>
            <span className="text-light text-opacity-75">
              <i className="bi bi-clock-history me-1"></i>
              Shift: {shiftDuration}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-success fw-bold">
              <i className="bi bi-shield-lock-fill me-1"></i>
              Zero Penalty Policy
            </span>
            <span className="opacity-25 d-none d-md-inline">•</span>
            <span className="text-secondary d-none d-md-inline">
              ₹5 Lakh Insurance Active
            </span>
          </div>
        </div> */}
      </header>

      <main className="flex-grow-1 px-3 px-md-4 rider-cockpit-main">
        <Outlet />
      </main>
    </div>
  );
};

export default RiderLayout;


