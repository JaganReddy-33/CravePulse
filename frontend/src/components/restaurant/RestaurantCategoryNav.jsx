import React from "react";

/**
 * RestaurantCategoryNav: Sticky horizontal category navigation bar with scroll-spy and search filter.
 */
const RestaurantCategoryNav = ({
  categories = [],
  activeCategory,
  onSelectCategory,
  searchFilter,
  setSearchFilter,
  vegOnly,
  setVegOnly,
}) => {
  return (
    <div
      className="sticky-top bg-white border-bottom py-2 mb-4 shadow-sm"
      style={{ top: 74, zIndex: 1020 }}
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-2">
        {/* Category Pill Buttons */}
        <div
          className="d-flex gap-2 overflow-auto py-1 flex-grow-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap fw-semibold touch-target ${
              !activeCategory
                ? "btn-danger text-white"
                : "btn-light border text-dark"
            }`}
            onClick={() => onSelectCategory(null)}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap fw-semibold touch-target ${
                activeCategory === cat.id
                  ? "btn-danger text-white"
                  : "btn-light border text-dark"
              }`}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Veg-Only Toggle & In-Menu Search Input */}
        <div className="d-flex align-items-center gap-2">
          <div className="form-check form-switch mb-0 d-flex align-items-center gap-1">
            <input
              className="form-check-input cursor-pointer"
              type="checkbox"
              id="vegOnlySwitch"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
            />
            <label
              className="form-check-label small fw-bold text-success cursor-pointer"
              htmlFor="vegOnlySwitch"
            >
              Veg Only
            </label>
          </div>

          <div
            className="input-group input-group-sm rounded-pill border overflow-hidden"
            style={{ width: 170 }}
          >
            <span className="input-group-text bg-white border-0 ps-2">
              <i className="bi bi-search text-muted small"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 py-1 ps-1"
              placeholder="In-menu search..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              aria-label="Filter dishes in this menu"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCategoryNav;
