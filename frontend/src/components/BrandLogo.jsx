import React from "react";
import { Link } from "react-router-dom";

/**
 * CravePulse: Unique, Premium SVG Brand Identity
 * Featuring a modern dual-tone flame-pulse emblem representing
 * gourmet culinary passion + real-time delivery heartbeat + 0% price parity.
 */
const BrandLogo = ({
  size = "md",
  to = "/",
  showTagline = true,
  lightMode = false,
}) => {
  const dimensions =
    size === "sm"
      ? { box: 34, icon: 20, font: "1.15rem" }
      : size === "lg"
        ? { box: 48, icon: 28, font: "1.65rem" }
        : { box: 42, icon: 24, font: "1.35rem" };

  return (
    <Link
      to={to}
      className="d-inline-flex align-items-center gap-2 text-decoration-none user-select-none"
    >
      {/* Radiant Glowing Emblem */}
      <div
        className="rounded-3 d-flex align-items-center justify-content-center shadow-sm position-relative overflow-hidden flex-shrink-0"
        style={{
          width: dimensions.box,
          height: dimensions.box,
          background:
            "linear-gradient(135deg, #ff4d29 0%, #ff7a45 50%, #ffa133 100%)",
          boxShadow: "0 4px 14px rgba(255, 77, 41, 0.35)",
        }}
      >
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flame & Pulse Wave Vector */}
          <path
            d="M12 2C9.5 5 7 8 7 11.5C7 14.54 9.24 17 12 17C14.76 17 17 14.54 17 11.5C17 8 14.5 5 12 2Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M4 17.5L8 14.5L11.5 17L16 13L20 16.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9.5" r="2" fill="#ff4d29" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="d-flex flex-column">
        <span
          className="fw-extrabold tracking-tight"
          style={{
            fontSize: dimensions.font,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: lightMode ? "#ffffff" : "#1e293b",
          }}
        >
          Crave<span style={{ color: "#ff4d29" }}>Pulse</span>
        </span>
        {showTagline && (
          <span
            className="small fw-bold d-none d-sm-inline"
            style={{
              fontSize: 9,
              color: lightMode ? "#cbd5e1" : "#64748b",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            0% Markup Fair Food
          </span>
        )}
      </div>
    </Link>
  );
};

export default BrandLogo;
