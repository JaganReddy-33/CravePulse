import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PartnerLayout = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const chefName = localStorage.getItem('cravepulse_partner_chef_name') || user?.fullName || 'Chef Lohith';
  const restName = localStorage.getItem('cravepulse_partner_rest_name') || 'Spice Symphony & Grill';
  const chefPhoto = localStorage.getItem('cravepulse_partner_chef_photo') || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150';

  const handleLogout = () => {
    logout();
    navigate('/partner/login', { replace: true });
  };

  return (
    <div className="partner-portal d-flex min-vh-100" style={{ background: '#f5f6fa' }}>
      {/* FoodAnalytics Left Sidebar */}
      <aside className="d-none d-lg-flex flex-column p-3 bg-white border-end shadow-sm" style={{ width: 250, minHeight: '100vh', zIndex: 10 }}>
        {/* Brand */}
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: 38, height: 38, background: '#ff5c35', fontSize: 20 }}>
            🍳
          </div>
          <div>
            <div className="fw-extrabold fs-5 lh-1" style={{ color: '#ff5c35' }}>FoodAnalytics</div>
            <small className="text-muted" style={{ fontSize: 10 }}>Kitchen Intelligence</small>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="nav flex-column gap-1 flex-grow-1">
          <Link
            to="/partner"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/partner' ? 'bg-danger-subtle text-danger fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-grid-fill"></i> Dashboard
          </Link>
          <Link
            to="/partner/kanban"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/partner/kanban' ? 'bg-danger-subtle text-danger fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-kanban-fill"></i> Kitchen Kanban
          </Link>
          <Link
            to="/partner/menu"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/partner/menu' ? 'bg-danger-subtle text-danger fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-menu-button-wide-fill"></i> Menu & Parity
          </Link>
          <Link
            to="/partner/orders"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/partner/orders' ? 'bg-danger-subtle text-danger fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-receipt"></i> Orders Ledger
          </Link>
          <Link
            to="/partner/settings"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/partner/settings' ? 'bg-danger-subtle text-danger fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-gear-fill"></i> Kitchen Settings
          </Link>
        </div>

        {/* FSSAI Badge & Live Compliance Box */}
        <div className="p-3 rounded-4 mt-auto text-center" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div className="fs-3 mb-1">🛡️</div>
          <h6 className="fw-bold mb-1 small text-dark">0% Markup Certified</h6>
          <p className="text-muted small mb-0" style={{ fontSize: 11 }}>
            All dishes verified with 100% dine-in physical menu price parity.
          </p>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill d-lg-none" title="Return to Consumer View">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <h5 className="fw-extrabold mb-0 text-dark">{restName}</h5>
              <small className="text-muted">FSSAI-11223344556677 • Indiranagar Hub</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Interactive Profile Dropdown */}
            <div className="position-relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none"
              >
                <img
                  src={chefPhoto}
                  alt={chefName}
                  className="rounded-circle shadow-sm object-fit-cover border border-2 border-danger"
                  style={{ width: 38, height: 38 }}
                />
                <div className="d-none d-sm-block text-end lh-1">
                  <strong className="d-block small text-dark">{chefName}</strong>
                  <span className="badge bg-warning-subtle text-dark border small" style={{ fontSize: 10 }}>HEAD CHEF / OWNER</span>
                </div>
                <i className="bi bi-chevron-down text-muted small"></i>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div 
                  className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg border p-2"
                  style={{ width: 250, zIndex: 1050 }}
                >
                  <div className="p-2 border-bottom mb-1">
                    <div className="fw-bold text-dark small">{chefName}</div>
                    <small className="text-muted d-block">{restName}</small>
                    <span className="badge bg-success-subtle text-success small mt-1">Verified Kitchen Partner</span>
                  </div>
                  <Link
                    to="/partner/settings"
                    className="dropdown-item py-2 px-3 text-dark small rounded-3 d-flex align-items-center gap-2 hover-bg-light"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <i className="bi bi-person-circle text-danger"></i> Chef Profile & Photos
                  </Link>
                  <Link
                    to="/partner/menu"
                    className="dropdown-item py-2 px-3 text-dark small rounded-3 d-flex align-items-center gap-2 hover-bg-light"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <i className="bi bi-egg-fried text-warning"></i> Manage Menu & Prices
                  </Link>
                  <Link
                    to="/restaurant/1"
                    className="dropdown-item py-2 px-3 text-dark small rounded-3 d-flex align-items-center gap-2 hover-bg-light"
                    onClick={() => setShowProfileMenu(false)}
                    target="_blank"
                  >
                    <i className="bi bi-box-arrow-up-right text-primary"></i> Live Consumer View ↗
                  </Link>
                  <hr className="my-1" />
                  <button
                    className="dropdown-item py-2 px-3 text-danger small rounded-3 d-flex align-items-center gap-2 w-100 text-start"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar for tablets and phones */}
        <div className="d-lg-none bg-white border-bottom px-3 py-2 d-flex gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
          <Link to="/partner" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/partner' ? 'btn-danger' : 'btn-light'}`} style={location.pathname === '/partner' ? { background: '#ff5c35' } : {}}>
            Dashboard
          </Link>
          <Link to="/partner/kanban" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/partner/kanban' ? 'btn-danger' : 'btn-light'}`} style={location.pathname === '/partner/kanban' ? { background: '#ff5c35' } : {}}>
            Kanban
          </Link>
          <Link to="/partner/menu" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/partner/menu' ? 'btn-danger' : 'btn-light'}`} style={location.pathname === '/partner/menu' ? { background: '#ff5c35' } : {}}>
            Menu
          </Link>
          <Link to="/partner/orders" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/partner/orders' ? 'btn-danger' : 'btn-light'}`} style={location.pathname === '/partner/orders' ? { background: '#ff5c35' } : {}}>
            Orders
          </Link>
          <Link to="/partner/settings" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/partner/settings' ? 'btn-danger' : 'btn-light'}`} style={location.pathname === '/partner/settings' ? { background: '#ff5c35' } : {}}>
            Settings
          </Link>
        </div>

        {/* Content View */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerLayout;
