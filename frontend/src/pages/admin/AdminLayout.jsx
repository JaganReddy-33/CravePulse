import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const adminName = user?.fullName || 'Operations Admin';

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const navLinks = (
    <div className="nav flex-column gap-1 flex-grow-1">
      <Link to="/admin/service-areas" onClick={() => setShowMobileSidebar(false)} className="nav-link py-2 px-3 rounded-3 fw-semibold touch-target text-secondary">Service areas</Link>
      <Link to="/admin/categories" onClick={() => setShowMobileSidebar(false)} className={`nav-link py-2 px-3 rounded-3 fw-semibold touch-target ${location.pathname === '/admin/categories' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}>Cuisine categories</Link>
      <Link to="/admin/support" onClick={() => setShowMobileSidebar(false)} className="nav-link py-2 px-3 rounded-3 fw-semibold touch-target text-secondary">Support inbox</Link>
      <Link to="/admin/payouts" onClick={() => setShowMobileSidebar(false)} className={`nav-link py-2 px-3 rounded-3 fw-semibold touch-target ${location.pathname === '/admin/payouts' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}>Payout review</Link>
      <Link
        to="/admin"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-speedometer2"></i> Ops Dashboard
      </Link>
      <Link
        to="/admin/disputes"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/disputes' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-shield-exclamation"></i> Dispute Escrow
      </Link>
      <Link
        to="/admin/approvals"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/approvals' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-person-check-fill"></i> KYC Approvals
      </Link>
      <Link
        to="/admin/users"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/users' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-people-fill text-info"></i> User Directory
      </Link>
      <Link
        to="/admin/restaurants"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/restaurants' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-shop"></i> Restaurants & KYC
      </Link>
      <Link
        to="/admin/riders"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/riders' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-bicycle"></i> Fleet Radar
      </Link>
      <Link
        to="/admin/coupons"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/coupons' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-ticket-perforated-fill text-warning"></i> Coupons & Deals
      </Link>
      <Link
        to="/admin/settings"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/settings' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-sliders text-success"></i> Platform Settings
      </Link>
      <Link
        to="/admin/audit-logs"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname === '/admin/audit-logs' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-journal-text text-danger"></i> Audit & Exports
      </Link>
      <Link
        to="/admin/careers"
        onClick={() => setShowMobileSidebar(false)}
        className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold touch-target ${location.pathname.startsWith('/admin/careers') ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
      >
        <i className="bi bi-briefcase-fill text-secondary"></i> Careers Studio
      </Link>
    </div>
  );

  return (
    <div className="admin-portal d-flex min-vh-100" style={{ background: '#090d16', color: '#f1f5f9' }}>
      {/* Admin Sidebar (Desktop) */}
      <aside className="d-none d-lg-flex flex-column p-3 border-end border-dark" style={{ width: 250, minHeight: '100vh', background: '#111827', zIndex: 10 }}>
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center text-white" style={{ width: 38, height: 38, background: '#38bdf8' }}>
            🛡️
          </div>
          <div>
            <div className="fw-extrabold fs-5 lh-1 text-white">Platform Ops</div>
            <small className="text-muted" style={{ fontSize: 10 }}>Control Tower</small>
          </div>
        </div>

        {navLinks}

        <div className="p-3 rounded-3 border border-dark text-center mt-auto" style={{ background: '#0b0f19' }}>
          <div className="badge bg-secondary-subtle text-secondary mb-1 small">ADMINISTRATION</div>
          <div className="fw-bold small text-light">Operations workspace</div>
          <small className="text-muted" style={{ fontSize: 11 }}>Tomcat 10 • MySQL 8 • WS</small>
        </div>
      </aside>

      {/* Mobile Offcanvas Drawer Sidebar */}
      {showMobileSidebar && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-lg-none"
          style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowMobileSidebar(false)}
        >
          <div 
            className="position-fixed top-0 start-0 h-100 shadow-lg p-3 d-flex flex-column"
            style={{ width: 280, maxWidth: '85%', background: '#111827', zIndex: 10060 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-3 d-flex align-items-center justify-content-center text-white" style={{ width: 34, height: 34, background: '#38bdf8' }}>
                  🛡️
                </div>
                <div className="fw-extrabold fs-6 text-white">Platform Ops</div>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white touch-target" 
                onClick={() => setShowMobileSidebar(false)}
                aria-label="Close sidebar"
              ></button>
            </div>
            {navLinks}
            <div className="border-top border-dark pt-3 mt-auto">
              <div className="small fw-bold text-white">{adminName}</div>
              <small className="text-muted d-block">{user?.email || 'admin@foodplatform.com'}</small>
              <button onClick={handleLogout} className="btn btn-sm btn-outline-danger w-100 mt-2 rounded-pill touch-target">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top Header */}
        <header className="px-3 px-md-4 py-3 border-bottom border-dark d-flex justify-content-between align-items-center" style={{ background: '#111827' }}>
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              className="btn btn-dark border border-secondary d-lg-none touch-target rounded-3 p-1 text-white"
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Open navigation menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <Link to="/" className="btn btn-sm btn-outline-light rounded-pill d-none d-sm-inline-flex align-items-center">
              <i className="bi bi-arrow-left me-1"></i>
              <span className="small">Customer App</span>
            </Link>
            <h5 className="fw-bold mb-0 text-white fs-6 fs-md-5">Central Operations Console</h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none"
              >
                <div 
                  className="rounded-circle text-dark fw-bold d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: 36, height: 36, background: '#38bdf8' }}
                >
                  🛡️
                </div>
                <div className="d-none d-sm-block text-end lh-1">
                  <span className="small text-white fw-semibold d-block">{adminName}</span>
                  <span className="badge bg-dark border border-secondary text-info" style={{ fontSize: 10 }}>ADMINISTRATOR</span>
                </div>
                <i className="bi bi-chevron-down text-muted small"></i>
              </button>

              {/* Admin Dropdown Popover */}
              {showProfileMenu && (
                <div 
                  className="position-absolute end-0 mt-2 bg-dark rounded-4 shadow-lg border border-secondary p-2"
                  style={{ width: 250, zIndex: 1050 }}
                >
                  <div className="p-2 border-bottom border-secondary mb-1">
                    <div className="fw-bold text-white small">{adminName}</div>
                    <small className="text-muted d-block">admin@foodplatform.com</small>
                    <span className="badge bg-info-subtle text-info small mt-1">Lead Operations Admin</span>
                  </div>
                  <Link
                    to="/admin/disputes"
                    className="dropdown-item py-2 px-3 text-white small rounded-3 d-flex align-items-center gap-2 hover-bg-secondary"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <i className="bi bi-shield-exclamation text-warning"></i> Dispute Escrows
                  </Link>
                  <Link
                    to="/admin/approvals"
                    className="dropdown-item py-2 px-3 text-white small rounded-3 d-flex align-items-center gap-2 hover-bg-secondary"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <i className="bi bi-person-check text-success"></i> Partner & Rider Approvals
                  </Link>
                  <Link
                    to="/"
                    className="dropdown-item py-2 px-3 text-white small rounded-3 d-flex align-items-center gap-2 hover-bg-secondary"
                    onClick={() => setShowProfileMenu(false)}
                    target="_blank"
                  >
                    <i className="bi bi-box-arrow-up-right text-info"></i> Consumer App View ↗
                  </Link>
                  <hr className="my-1 border-secondary" />
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

        {/* Mobile Nav */}
        <div className="d-lg-none bg-dark border-bottom border-secondary px-3 py-2 d-flex gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
          <Link to="/admin" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Dashboard
          </Link>
          <Link to="/admin/disputes" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/disputes' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Disputes
          </Link>
          <Link to="/admin/approvals" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/approvals' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            KYC Approvals
          </Link>
          <Link to="/admin/payouts" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/payouts' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Payouts
          </Link>
          <Link to="/admin/users" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/users' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Users
          </Link>
          <Link to="/admin/restaurants" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/restaurants' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Restaurants
          </Link>
          <Link to="/admin/riders" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/riders' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Fleet Radar
          </Link>
          <Link to="/admin/coupons" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/coupons' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Coupons
          </Link>
          <Link to="/admin/settings" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/settings' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Settings
          </Link>
          <Link to="/admin/audit-logs" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/audit-logs' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Audit & CSV
          </Link>
          <Link to="/admin/careers" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname.startsWith('/admin/careers') ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Careers
          </Link>
        </div>

        {/* Outlet View */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
