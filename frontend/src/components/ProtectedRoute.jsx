import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: Enforces strict Role-Based Access Control (RBAC).
 * If user is not authenticated or lacks required role:
 * - Redirects to role-specific login page with returnTo state
 * - Prevents unauthorized customer access to Partner, Rider, or Admin portals
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <h6 className="fw-bold text-muted">Verifying credentials & security access...</h6>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    // Direct to the appropriate portal login based on the attempted path
    if (location.pathname.startsWith('/partner')) {
      return <Navigate to="/partner/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/rider')) {
      return <Navigate to="/rider/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated, check role permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="container py-5">
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center mx-auto bg-white" style={{ maxWidth: 540 }}>
          <div className="fs-1 text-danger mb-3">🛡️</div>
          <h4 className="fw-extrabold text-dark mb-2">Access Restricted</h4>
          <p className="text-muted small mb-4">
            You are signed in as <strong>{user.fullName || user.email}</strong> with role 
            <span className="badge bg-secondary ms-1">{user.role}</span>.
            <br />
            This portal strictly requires <strong>{allowedRoles.join(' or ')}</strong> privileges.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <a href="/" className="btn btn-outline-secondary rounded-pill px-4">
              Return to CravePulse Home
            </a>
            {allowedRoles.includes('RESTAURANT_OWNER') && (
              <a href="/partner/login" className="btn btn-primary rounded-pill px-4">
                Partner Sign In
              </a>
            )}
            {allowedRoles.includes('RIDER') && (
              <a href="/rider/login" className="btn btn-success rounded-pill px-4">
                Rider Sign In
              </a>
            )}
            {allowedRoles.includes('ADMIN') && (
              <a href="/admin/login" className="btn btn-dark rounded-pill px-4">
                Admin Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
