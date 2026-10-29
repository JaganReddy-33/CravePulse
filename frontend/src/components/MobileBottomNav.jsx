import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

/**
 * MobileBottomNav: Fixed thumb-friendly bottom navigation bar for the Customer App.
 * Active on viewports < 768px. Complies with 44px touch targets and safe-area insets.
 */
const MobileBottomNav = ({ onOpenCart }) => {
  const { user } = useAuth();
  const { totalItemCount } = useCart();
  const location = useLocation();

  const isHomeActive = location.pathname === '/';
  const isOrdersActive = location.pathname.startsWith('/orders') || location.pathname.startsWith('/account/orders');
  const isProfileActive = location.pathname.startsWith('/profile') || location.pathname.startsWith('/account/profile');
  const isOffersActive = location.pathname.startsWith('/offers');

  return (
    <nav
      className="d-md-none fixed-bottom bg-white border-top shadow-lg"
      style={{
        zIndex: 1030,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTopColor: '#f1f5f9',
      }}
      aria-label="Mobile Navigation"
    >
      <div className="d-flex justify-content-around align-items-center py-1">
        {/* 1. Explore / Home */}
        <NavLink
          to="/"
          className={`d-flex flex-column align-items-center justify-content-center text-decoration-none touch-target tap-highlight-none ${
            isHomeActive ? 'text-primary fw-bold' : 'text-secondary'
          }`}
          style={{ minWidth: 64, color: isHomeActive ? 'var(--c-primary)' : '#64748b' }}
          aria-label="Explore Restaurants"
        >
          <i className={`bi bi-${isHomeActive ? 'house-door-fill' : 'house-door'} fs-5 mb-1`}></i>
          <span style={{ fontSize: 11 }}>Explore</span>
        </NavLink>

        {/* 2. Offers / Deals */}
        <NavLink
          to="/offers"
          className={`d-flex flex-column align-items-center justify-content-center text-decoration-none touch-target tap-highlight-none ${
            isOffersActive ? 'text-primary fw-bold' : 'text-secondary'
          }`}
          style={{ minWidth: 64, color: isOffersActive ? 'var(--c-primary)' : '#64748b' }}
          aria-label="Active Offers and Deals"
        >
          <i className={`bi bi-${isOffersActive ? 'tag-fill' : 'tag'} fs-5 mb-1`}></i>
          <span style={{ fontSize: 11 }}>Offers</span>
        </NavLink>

        {/* 3. Floating Food Bag / Cart Button */}
        <button
          type="button"
          onClick={onOpenCart}
          className="btn btn-link p-0 d-flex flex-column align-items-center justify-content-center text-decoration-none touch-target position-relative tap-highlight-none"
          style={{ minWidth: 64, color: totalItemCount > 0 ? 'var(--c-primary)' : '#64748b' }}
          aria-label={`View food bag with ${totalItemCount} items`}
        >
          <div className="position-relative">
            <i className="bi bi-bag-fill fs-5 mb-1"></i>
            {totalItemCount > 0 && (
              <span 
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                style={{ fontSize: 10, padding: '2px 5px' }}
              >
                {totalItemCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: totalItemCount > 0 ? 700 : 500 }}>Bag</span>
        </button>

        {/* 4. Orders History */}
        <NavLink
          to={user ? '/orders' : '/login?redirect=/orders'}
          className={`d-flex flex-column align-items-center justify-content-center text-decoration-none touch-target tap-highlight-none ${
            isOrdersActive ? 'text-primary fw-bold' : 'text-secondary'
          }`}
          style={{ minWidth: 64, color: isOrdersActive ? 'var(--c-primary)' : '#64748b' }}
          aria-label="My Orders History"
        >
          <i className={`bi bi-${isOrdersActive ? 'receipt-cutoff' : 'receipt'} fs-5 mb-1`}></i>
          <span style={{ fontSize: 11 }}>Orders</span>
        </NavLink>

        {/* 5. Account / Profile */}
        <NavLink
          to={user ? '/profile' : '/login'}
          className={`d-flex flex-column align-items-center justify-content-center text-decoration-none touch-target tap-highlight-none ${
            isProfileActive ? 'text-primary fw-bold' : 'text-secondary'
          }`}
          style={{ minWidth: 64, color: isProfileActive ? 'var(--c-primary)' : '#64748b' }}
          aria-label="Account Settings"
        >
          <i className={`bi bi-${isProfileActive ? 'person-circle' : 'person'} fs-5 mb-1`}></i>
          <span style={{ fontSize: 11 }}>{user ? 'Account' : 'Sign In'}</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
