import React from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../BrandLogo";

/**
 * NavMobileDrawer: Mobile side-drawer navigation menu for secondary customer links and portal switching.
 */
const NavMobileDrawer = ({
  show,
  onClose,
  user,
  logout,
  selectedHub,
  onOpenLocationModal,
}) => {
  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
      style={{ zIndex: 10050, backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="position-fixed top-0 start-0 h-100 bg-white shadow-2xl p-4 d-flex flex-column animate-slide-left"
        style={{ width: 300, maxWidth: "85%", zIndex: 10060 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <BrandLogo />
          <button
            type="button"
            className="btn-close touch-target"
            onClick={onClose}
            aria-label="Close menu"
          ></button>
        </div>

        {/* Location selector trigger */}
        <button
          type="button"
          className="btn btn-light border rounded-3 p-2 mb-4 d-flex align-items-center justify-content-between text-start w-100 touch-target"
          onClick={() => {
            onClose();
            onOpenLocationModal();
          }}
        >
          <div className="d-flex align-items-center gap-2 text-truncate">
            <i className="bi bi-geo-alt-fill text-danger fs-6"></i>
            <div className="text-truncate">
              <strong className="d-block small text-dark text-truncate">
                {selectedHub?.name || "Bangalore"}
              </strong>
              <small className="text-muted" style={{ fontSize: 11 }}>
                Tap to change hub
              </small>
            </div>
          </div>
          <i className="bi bi-chevron-right text-muted small"></i>
        </button>

        {/* Navigation list */}
        <div className="nav flex-column gap-1 flex-grow-1">
          <Link
            to="/"
            className="nav-link py-2 px-3 rounded-3 text-dark fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-house-door text-primary"></i> Explore Kitchens
          </Link>
          <Link
            to="/offers"
            className="nav-link py-2 px-3 rounded-3 text-dark fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-tag-fill text-warning"></i> Offers & Promo Codes
          </Link>
          <Link
            to="/orders"
            className="nav-link py-2 px-3 rounded-3 text-dark fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-receipt text-success"></i> Order History &
            Invoices
          </Link>
          <Link
            to="/profile"
            className="nav-link py-2 px-3 rounded-3 text-dark fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-person-circle text-info"></i> Account & Saved
            Addresses
          </Link>
          <Link
            to="/help"
            className="nav-link py-2 px-3 rounded-3 text-dark fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-question-circle text-secondary"></i> Help Center
            & FAQs
          </Link>

          <div className="border-top my-2"></div>

          <div
            className="small fw-bold text-muted text-uppercase px-3 mb-1"
            style={{ fontSize: 10 }}
          >
            Partner Workspaces
          </div>
          <Link
            to="/partner"
            className="nav-link py-2 px-3 rounded-3 text-danger fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-shop"></i> Kitchen Partner
          </Link>
          <Link
            to="/rider"
            className="nav-link py-2 px-3 rounded-3 text-success fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-bicycle"></i> Delivery Captain
          </Link>
          <Link
            to="/admin"
            className="nav-link py-2 px-3 rounded-3 text-info fw-semibold d-flex align-items-center gap-2 touch-target hover-bg-light"
            onClick={onClose}
          >
            <i className="bi bi-shield-lock-fill"></i> Central Ops Console
          </Link>
        </div>

        {/* Footer auth actions */}
        <div className="border-top pt-3 mt-auto">
          {user ? (
            <button
              type="button"
              className="btn btn-outline-danger w-100 rounded-pill fw-bold touch-target"
              onClick={() => {
                onClose();
                logout();
              }}
            >
              Sign Out
            </button>
          ) : (
            <div className="d-flex gap-2">
              <Link
                to="/login"
                className="btn btn-outline-secondary w-50 rounded-pill fw-semibold touch-target text-center"
                onClick={onClose}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary w-50 rounded-pill fw-bold touch-target text-center text-white"
                style={{
                  background: "var(--c-primary)",
                  borderColor: "var(--c-primary)",
                }}
                onClick={onClose}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavMobileDrawer;
