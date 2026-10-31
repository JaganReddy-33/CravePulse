import React from "react";
import "./ResponsiveTable.css";

/**
 * ResponsiveTable:
 * Renders a clean semantic table on desktop (>= 768px),
 * and transforms into accessible stacked key-value cards on mobile (< 768px).
 *
 * Props:
 *   columns: Array of { key, label, render?, className?, mobilePriority? }
 *   data: Array of objects
 *   keyExtractor: function(row, index) => string | number
 *   emptyMessage: string | ReactNode
 *   darkMode: boolean
 *   className: string
 */
const ResponsiveTable = ({
  columns = [],
  data = [],
  keyExtractor = (row, i) => row.id || i,
  emptyMessage = "No records found.",
  darkMode = false,
  className = "",
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        className={`p-4 text-center rounded-4 border ${
          darkMode
            ? "bg-dark text-secondary border-secondary border-opacity-25"
            : "bg-light text-muted"
        }`}
      >
        <p className="mb-0 small">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`responsive-table-wrapper ${className}`}>
      {/* Desktop view (>= 768px) */}
      <table
        className={`responsive-table responsive-table-desktop ${darkMode ? "responsive-table--dark" : ""}`}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.label} className={col.className || ""}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={keyExtractor(row, idx)}>
              {columns.map((col) => (
                <td key={col.key || col.label} className={col.className || ""}>
                  {col.render
                    ? col.render(row[col.key], row, idx)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile view (< 768px): Stacked Cards */}
      <div className="responsive-table-mobile-cards">
        {data.map((row, idx) => (
          <div
            key={keyExtractor(row, idx)}
            className={`responsive-table-card ${darkMode ? "responsive-table-card--dark" : ""}`}
          >
            {columns.map((col) => (
              <div
                key={col.key || col.label}
                className="responsive-table-card-row"
              >
                <span className="responsive-table-card-label">{col.label}</span>
                <span className="responsive-table-card-value">
                  {col.render
                    ? col.render(row[col.key], row, idx)
                    : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
