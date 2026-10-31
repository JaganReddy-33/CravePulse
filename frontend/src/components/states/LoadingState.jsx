import React from "react";

/**
 * Standardized accessible loading indicator component.
 */
const LoadingState = ({
  message = "Loading fresh delicious data...",
  minHeight = 260,
}) => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center p-4 text-center w-100"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="spinner-border text-primary mb-3"
        style={{
          width: "2.75rem",
          height: "2.75rem",
          color: "var(--c-primary)",
        }}
        aria-hidden="true"
      ></div>
      <p className="fw-semibold text-muted small mb-0">{message}</p>
      <span className="visually-hidden">{message}</span>
    </div>
  );
};

export default LoadingState;
