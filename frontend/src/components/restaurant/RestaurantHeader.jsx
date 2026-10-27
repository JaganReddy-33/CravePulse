import React from 'react';
import { Link } from 'react-router-dom';

/**
 * RestaurantHeader: Restaurant hero banner, breadcrumbs, ratings, and FSSAI verification.
 */
const RestaurantHeader = ({ restaurant, openPriceExplainer }) => {
  if (!restaurant) return null;

  return (
    <div className="mb-4">
      {/* Semantic Breadcrumbs Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none text-muted">
              Home
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none text-muted">
              Restaurants
            </Link>
          </li>
          <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
            {restaurant.name}
          </li>
        </ol>
      </nav>

      {/* Hero Banner Card */}
      <div 
        className="card border-0 rounded-4 shadow-sm overflow-hidden position-relative bg-white"
        style={{ minHeight: 220 }}
      >
        <div className="row g-0">
          <div className="col-md-5 col-lg-4 position-relative" style={{ minHeight: 200 }}>
            <img
              src={restaurant.bannerImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
              alt={restaurant.name}
              className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
              style={{ maxHeight: 280 }}
            />
            {restaurant.isOpen === false && (
              <div 
                className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center text-white fw-bold fs-5"
                style={{ backdropFilter: 'blur(2px)' }}
              >
                STORE CLOSED TODAY
              </div>
            )}
          </div>

          <div className="col-md-7 col-lg-8 p-3 p-md-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <h1 className="fw-extrabold text-dark mb-1 fs-3 fs-md-2">{restaurant.name}</h1>
                  <p className="text-muted small mb-0">
                    {restaurant.cuisine || 'North Indian • Biryani • Mughlai'} • {restaurant.locality || 'Indiranagar, Bengaluru'}
                  </p>
                </div>
                <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 p-2 rounded-3 text-center">
                  <div className="fw-extrabold fs-6">★ {restaurant.rating || '4.8'}</div>
                  <small style={{ fontSize: 10 }}>{restaurant.totalReviews || 1200}+ reviews</small>
                </div>
              </div>

              <p className="text-secondary small mb-3 text-truncate-2" style={{ maxWidth: 640 }}>
                {restaurant.description}
              </p>
            </div>

            {/* Quick Metrics & 100% Dine-In Menu Parity Assurance Strip */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top">
              <div className="d-flex align-items-center gap-3 small text-muted">
                <div>
                  <i className="bi bi-clock-history me-1 text-danger"></i>
                  <strong>{restaurant.prepTimeMin || 20}-{restaurant.prepTimeMax || 30} mins</strong>
                </div>
                <div>
                  <i className="bi bi-geo-alt me-1 text-danger"></i>
                  <span>2.4 km away</span>
                </div>
                {restaurant.fssaiLicense && (
                  <div className="d-none d-sm-inline">
                    <i className="bi bi-shield-check me-1 text-success"></i>
                    <span>Lic: {restaurant.fssaiLicense}</span>
                  </div>
                )}
              </div>

              {/* 100% Dine-In Parity Pill */}
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small fw-bold">
                  <i className="bi bi-patch-check-fill me-1"></i>
                  100% Dine-In Menu Parity
                </span>
                {openPriceExplainer && (
                  <button
                    type="button"
                    onClick={openPriceExplainer}
                    className="btn btn-link p-0 text-success text-decoration-none small fw-bold"
                    title="Audit Dine-In Price Assurance"
                  >
                    Audit ⓘ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;
