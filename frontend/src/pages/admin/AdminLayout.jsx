import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const adminName = user?.fullName || 'Jaganmohan Reddy';

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-portal d-flex min-vh-100" style={{ background: '#090d16', color: '#f1f5f9' }}>
      {/* Admin Sidebar */}
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

        <div className="nav flex-column gap-1 flex-grow-1">
          <Link
            to="/admin"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/admin' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-speedometer2"></i> Ops Dashboard
          </Link>
          <Link
            to="/admin/disputes"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/admin/disputes' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-shield-exclamation"></i> Dispute Escrow
          </Link>
          <Link
            to="/admin/approvals"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/admin/approvals' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-person-check-fill"></i> KYC Approvals
          </Link>
          <Link
            to="/admin/restaurants"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/admin/restaurants' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-shop"></i> Restaurants & KYC
          </Link>
          <Link
            to="/admin/riders"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname === '/admin/riders' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-bicycle"></i> Fleet Radar
          </Link>
          <Link
            to="/admin/careers"
            className={`nav-link py-2 px-3 rounded-3 d-flex align-items-center gap-3 fw-semibold ${location.pathname.startsWith('/admin/careers') ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary'}`}
          >
            <i className="bi bi-briefcase-fill text-warning"></i> Careers & Job Posts
          </Link>
        </div>

        <div className="p-3 rounded-3 border border-dark text-center mt-auto" style={{ background: '#0b0f19' }}>
          <div className="badge bg-success-subtle text-success mb-1 small">SYSTEM STATUS</div>
          <div className="fw-bold small text-light">Real-Time Core Online</div>
          <small className="text-muted" style={{ fontSize: 11 }}>Tomcat 10 • MySQL 8 • WS</small>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top Header */}
        <header className="px-4 py-3 border-bottom border-dark d-flex justify-content-between align-items-center" style={{ background: '#111827' }}>
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="btn btn-sm btn-outline-light rounded-circle d-lg-none">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <h5 className="fw-bold mb-0 text-white">Central Operations Console</h5>
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
                  <span className="badge bg-dark border border-secondary text-info" style={{ fontSize: 10 }}>PLATFORM FOUNDER</span>
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
          <Link to="/admin/restaurants" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/restaurants' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Restaurants
          </Link>
          <Link to="/admin/riders" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname === '/admin/riders' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Fleet Radar
          </Link>
          <Link to="/admin/careers" className={`btn btn-sm rounded-pill px-3 text-nowrap ${location.pathname.startsWith('/admin/careers') ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}>
            Careers & Jobs
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
