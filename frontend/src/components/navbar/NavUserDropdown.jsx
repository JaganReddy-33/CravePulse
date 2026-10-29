import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * NavUserDropdown: Accessible user profile menu with dynamic user credentials, role badge, and portal switchers.
 */
const NavUserDropdown = ({ user, logout, showUserMenu, setShowUserMenu }) => {
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowUserMenu]);

  if (!user) {
    return (
      <div className="d-flex align-items-center gap-2">
        <Link 
          to="/login" 
          className="btn btn-outline-secondary rounded-pill px-3 py-1 btn-sm fw-semibold touch-target"
        >
          Sign In
        </Link>
        <Link 
          to="/register" 
          className="btn btn-primary rounded-pill px-3 py-1 btn-sm fw-bold touch-target text-white"
          style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const initial = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U';
  const firstName = user.fullName ? user.fullName.trim().split(' ')[0] : 'User';
  const displayName = user.fullName || user.email || 'Customer';

  return (
    <div className="position-relative" ref={userMenuRef}>
      <button 
        className="btn p-0 border-0 d-flex align-items-center gap-2 touch-target" 
        type="button" 
        onClick={() => setShowUserMenu(!showUserMenu)}
        aria-expanded={showUserMenu}
        aria-label="User account menu"
      >
        <div 
          className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shadow-sm"
          style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #ff4d29 0%, var(--c-secondary) 100%)', fontSize: 16 }}
        >
          {initial}
        </div>
        <span className="fw-semibold small text-dark d-none d-md-inline">{firstName}</span>
        <i className="bi bi-chevron-down small text-muted d-none d-md-inline"></i>
      </button>

      {showUserMenu && (
        <div 
          className="card position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2 bg-white" 
          style={{ minWidth: 240, zIndex: 1050 }}
          role="menu"
        >
          <div className="px-3 py-2 border-bottom">
            <div className="fw-bold text-dark small text-truncate">{displayName}</div>
            <small className="text-muted d-block text-truncate" style={{ fontSize: 11 }}>{user.email}</small>
            <span className="badge bg-secondary-subtle text-secondary small mt-1">{user.role}</span>
          </div>

          <Link 
            to="/orders" 
            className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2" 
            onClick={() => setShowUserMenu(false)}
            role="menuitem"
          >
            <i className="bi bi-clock-history text-primary"></i> My Orders
          </Link>
          <Link 
            to="/profile" 
            className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2" 
            onClick={() => setShowUserMenu(false)}
            role="menuitem"
          >
            <i className="bi bi-person-circle text-success"></i> Account & Addresses
          </Link>
          <Link 
            to="/offers" 
            className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2" 
            onClick={() => setShowUserMenu(false)}
            role="menuitem"
          >
            <i className="bi bi-tag-fill text-warning"></i> Offers & Promos
          </Link>

          {/* Role-Specific Portal Jump Links */}
          {user.role === 'RESTAURANT_OWNER' && (
            <Link 
              to="/partner" 
              className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2 text-danger fw-bold" 
              onClick={() => setShowUserMenu(false)}
              role="menuitem"
            >
              <i className="bi bi-shop"></i> Kitchen Partner Portal
            </Link>
          )}
          {user.role === 'RIDER' && (
            <Link 
              to="/rider" 
              className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2 text-success fw-bold" 
              onClick={() => setShowUserMenu(false)}
              role="menuitem"
            >
              <i className="bi bi-bicycle"></i> Rider Cockpit
            </Link>
          )}
          {user.role === 'ADMIN' && (
            <Link 
              to="/admin" 
              className="dropdown-item rounded-3 py-2 px-3 small d-flex align-items-center gap-2 text-info fw-bold" 
              onClick={() => setShowUserMenu(false)}
              role="menuitem"
            >
              <i className="bi bi-shield-lock-fill"></i> Central Ops Console
            </Link>
          )}

          <div className="dropdown-divider my-1"></div>
          <button 
            type="button"
            className="dropdown-item rounded-3 py-2 px-3 small text-danger d-flex align-items-center gap-2"
            onClick={() => {
              setShowUserMenu(false);
              logout();
            }}
            role="menuitem"
          >
            <i className="bi bi-box-arrow-right"></i> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default NavUserDropdown;
