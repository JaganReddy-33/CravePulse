import React from 'react';

/**
 * Standardized error state feedback component with retry support.
 */
const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while processing this request.',
  onRetry = null,
  minHeight = 260,
}) => {
  return (
    <div 
      className="d-flex flex-column align-items-center justify-content-center p-4 text-center w-100 bg-white rounded-4 border border-danger border-opacity-25"
      style={{ minHeight }}
      role="alert"
      aria-live="assertive"
    >
      <div className="fs-1 mb-2 text-danger" aria-hidden="true">⚠️</div>
      <h6 className="fw-bold text-dark mb-1">{title}</h6>
      <p className="text-muted small mb-3" style={{ maxWidth: 380 }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-sm btn-outline-danger rounded-pill px-4 fw-bold d-inline-flex align-items-center gap-2 touch-target"
        >
          <i className="bi bi-arrow-clockwise"></i>
          Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;
