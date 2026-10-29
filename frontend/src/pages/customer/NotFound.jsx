import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Delightful 404 Not Found Page.
 * Offers search jumping, quick shortcuts, and back navigation.
 */
const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div 
        className="card border-0 shadow-lg rounded-4 p-4 p-md-5 text-center bg-white mx-auto"
        style={{ maxWidth: 620, width: '100%' }}
      >
        <div className="display-1 fw-extrabold text-muted opacity-25 mb-1" style={{ letterSpacing: '4px' }}>
          404
        </div>
        <div className="fs-1 mb-3" aria-hidden="true">🧭🍕</div>
        <h2 className="fw-extrabold text-dark mb-2">We couldn't find that page</h2>
        <p className="text-muted small mb-4">
          The dish, restaurant, or address you are looking for might have been moved, renamed, or is currently taking a cooking break!
        </p>

        {/* Search Jump Box */}
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <div className="input-group shadow-sm rounded-pill overflow-hidden border">
            <span className="input-group-text bg-white border-0 ps-3 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 py-2"
              placeholder="Search dishes or kitchens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search dishes or kitchens"
            />
            <button 
              type="submit" 
              className="btn btn-primary px-4 fw-bold touch-target"
              style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Navigation Links */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
          <Link
            to="/"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 small fw-semibold touch-target"
          >
            <i className="bi bi-house-door me-1"></i>
            Explore Kitchens
          </Link>
          <Link
            to="/offers"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 small fw-semibold touch-target"
          >
            <i className="bi bi-tag-fill me-1 text-warning"></i>
            Active Deals
          </Link>
          <Link
            to="/orders"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 small fw-semibold touch-target"
          >
            <i className="bi bi-bag-check me-1 text-success"></i>
            My Orders
          </Link>
          <Link
            to="/help"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 small fw-semibold touch-target"
          >
            <i className="bi bi-question-circle me-1 text-info"></i>
            Help Center
          </Link>
        </div>

        <div className="text-muted small">
          Need immediate support? Contact our customer desk at <Link to="/contact" className="text-primary text-decoration-none fw-bold">Contact Support</Link>.
        </div>
      </div>
    </main>
  );
};

export default NotFound;
