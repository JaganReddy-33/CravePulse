import React from "react";

/**
 * Standardized empty state presentation with customizable icon, title, description, and action button.
 */
const EmptyState = ({
  icon = "🍽️",
  title = "No items found",
  description = "There are currently no items matching your criteria.",
  actionText = null,
  onAction = null,
  minHeight = 260,
}) => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center p-4 text-center w-100 bg-white rounded-4 border border-dashed"
      style={{ minHeight }}
      role="region"
      aria-label={title}
    >
      <div className="fs-1 mb-2" aria-hidden="true">
        {icon}
      </div>
      <h6 className="fw-bold text-dark mb-1">{title}</h6>
      <p className="text-muted small mb-3" style={{ maxWidth: 360 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-sm btn-primary rounded-pill px-4 fw-bold touch-target"
          style={{
            background: "var(--c-primary)",
            borderColor: "var(--c-primary)",
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
