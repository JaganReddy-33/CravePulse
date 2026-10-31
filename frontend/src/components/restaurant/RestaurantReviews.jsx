import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import ScrollCarousel from "../common/ScrollCarousel";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Returns initials (up to 2 chars) from a full name. */
const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

/** Deterministic hue from a string for avatar background. */
const nameHue = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

/** Render filled / half / empty stars. */
const StarRow = ({ rating, size = 14 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const icon = i <= Math.round(rating) ? "★" : "☆";
    stars.push(
      <span
        key={i}
        style={{
          color: i <= Math.round(rating) ? "#ffa733" : "#d1d5db",
          fontSize: size,
        }}
      >
        {icon}
      </span>,
    );
  }
  return <span aria-label={`${rating} out of 5 stars`}>{stars}</span>;
};

/** Horizontal bar for rating distribution. */
const RatingBar = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className="d-flex align-items-center gap-2 mb-1"
      style={{ fontSize: 12 }}
    >
      <span className="text-muted" style={{ width: 14, textAlign: "right" }}>
        {label}
      </span>
      <span style={{ color: "#ffa733", fontSize: 10 }}>★</span>
      <div
        className="flex-grow-1 bg-light rounded-pill overflow-hidden"
        style={{ height: 6 }}
      >
        <div
          className="rounded-pill"
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#48c479",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span className="text-muted" style={{ width: 28 }}>
        {count}
      </span>
    </div>
  );
};

/* ── Skeleton card ───────────────────────────────────────────────────────── */
const ReviewSkeleton = () => (
  <div
    className="review-card card border-0 rounded-4 p-3 shadow-sm"
    style={{
      width: "min(86vw, 320px)",
      minHeight: 160,
      background: "#f8f9fa",
      flexShrink: 0,
    }}
    aria-hidden="true"
  >
    <div className="d-flex align-items-center gap-2 mb-3">
      <div
        className="rounded-circle bg-secondary bg-opacity-25"
        style={{ width: 36, height: 36, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="rounded-pill bg-secondary bg-opacity-25 mb-1"
          style={{ height: 10, width: "60%" }}
        />
        <div
          className="rounded-pill bg-secondary bg-opacity-25"
          style={{ height: 8, width: "40%" }}
        />
      </div>
    </div>
    <div
      className="rounded-pill bg-secondary bg-opacity-25 mb-2"
      style={{ height: 8, width: "80%" }}
    />
    <div
      className="rounded-pill bg-secondary bg-opacity-25 mb-2"
      style={{ height: 8, width: "100%" }}
    />
    <div
      className="rounded-pill bg-secondary bg-opacity-25"
      style={{ height: 8, width: "65%" }}
    />
  </div>
);

/* ── Review card ─────────────────────────────────────────────────────────── */
const ReviewCard = ({ rev }) => {
  const [expanded, setExpanded] = useState(false);
  const hue = nameHue(rev.customerName || rev.userName || "User");
  const initials = getInitials(rev.customerName || rev.userName || "?");
  const comment = rev.comment || rev.reviewText || "";
  const isLong = comment.length > 160;

  return (
    <div
      className="review-card card border-0 rounded-4 p-3 shadow-sm bg-white"
      style={{
        width: "min(86vw, 320px)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
      role="article"
      aria-label={`Review by ${rev.customerName || rev.userName}`}
    >
      {/* Header: avatar + name + date */}
      <div className="d-flex align-items-start gap-2 mb-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
          style={{
            width: 38,
            height: 38,
            fontSize: 14,
            background: `hsl(${hue}, 55%, 50%)`,
          }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="flex-grow-1 min-w-0">
          <div
            className="fw-semibold text-dark text-truncate"
            style={{ fontSize: 14 }}
          >
            {rev.customerName || rev.userName || "Anonymous"}
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted" style={{ fontSize: 11 }}>
              {rev.date || rev.createdAt || ""}
            </span>
            {(rev.verifiedOrder || rev.verified) && (
              <span
                className="badge rounded-pill px-2 py-0"
                style={{
                  fontSize: 10,
                  background: "#e6f9f0",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                }}
              >
                ✓ Verified order
              </span>
            )}
          </div>
        </div>
        {/* Stars top-right */}
        <div className="flex-shrink-0">
          <StarRow rating={rev.rating || 5} size={12} />
        </div>
      </div>

      {/* Review text */}
      <p
        className="text-secondary mb-1 flex-grow-1"
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: expanded ? "unset" : 4,
          overflow: "hidden",
        }}
      >
        {comment}
      </p>
      {isLong && (
        <button
          className="btn btn-link btn-sm text-primary p-0 text-start fw-semibold"
          style={{ fontSize: 12 }}
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Restaurant reply */}
      {rev.reply && (
        <div
          className="mt-2 p-2 rounded-3"
          style={{
            background: "#f8f9fa",
            borderLeft: "3px solid var(--c-primary)",
            fontSize: 12,
          }}
        >
          <strong
            className="d-block mb-1"
            style={{ fontSize: 11, color: "var(--c-primary)" }}
          >
            Restaurant replied:
          </strong>
          <span className="text-secondary">{rev.reply}</span>
        </div>
      )}
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */
/**
 * RestaurantReviews
 *   restaurantId  – required; used to fetch real reviews
 *   rating        – fallback display rating (from restaurant object)
 *   totalReviews  – fallback count
 */
const RestaurantReviews = ({
  restaurantId,
  rating: propRating,
  totalReviews: propTotal,
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("recent");

  const fetchReviews = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reviews/restaurant/${restaurantId}`, {
        params: { limit: 50 },
      });
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        // Backend returned empty or non-success — treat as empty (no fake data)
        setReviews([]);
      }
    } catch (e) {
      console.error("Failed to load reviews", e);
      setError("Could not load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* ── Computed values ── */
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : propRating || "—";

  const totalCount = reviews.length > 0 ? reviews.length : propTotal || 0;

  // Rating distribution (5 → 1)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  // Sort
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest") return a.rating - b.rating;
    // most recent by id or createdAt
    return (b.id || 0) - (a.id || 0);
  });

  /* ── Render ── */
  return (
    <div className="mt-5" id="reviews-section">
      {/* Section header */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h4
            className="fw-extrabold text-dark mb-1"
            style={{ fontSize: "clamp(1.1rem,2vw,1.35rem)" }}
          >
            Customer Reviews &amp; Ratings
          </h4>
          {reviews.length > 0 ? (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span
                className="badge px-2 py-1 rounded-pill fw-bold"
                style={{ background: "#48c479", color: "#fff", fontSize: 13 }}
              >
                ★ {avgRating}
              </span>
              <span className="text-muted small">
                {totalCount} verified reviews
              </span>
            </div>
          ) : (
            !loading &&
            !error && (
              <span className="text-muted small">
                Be the first to review after your order!
              </span>
            )
          )}
        </div>

        {/* Sort control */}
        {reviews.length > 1 && (
          <div className="d-flex align-items-center gap-2">
            <label
              htmlFor="reviewSortSelect"
              className="small text-muted fw-semibold text-nowrap"
            >
              Sort:
            </label>
            <select
              id="reviewSortSelect"
              className="form-select form-select-sm rounded-pill border"
              style={{ minWidth: 140 }}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
        )}
      </div>

      {/* Rating distribution (only when we have real reviews) */}
      {reviews.length > 0 && (
        <div className="row g-4 mb-5 align-items-center">
          {/* Big average */}
          <div className="col-auto text-center">
            <div
              className="fw-extrabold"
              style={{ fontSize: 52, lineHeight: 1, color: "#0f172a" }}
            >
              {avgRating}
            </div>
            <StarRow rating={Number(avgRating)} size={18} />
            <div className="text-muted small mt-1">{totalCount} reviews</div>
          </div>
          {/* Bars */}
          <div className="col">
            {distribution.map(({ star, count }) => (
              <RatingBar
                key={star}
                label={star}
                count={count}
                total={reviews.length}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <ScrollCarousel ariaLabel="Loading reviews">
          {[1, 2, 3].map((n) => (
            <ReviewSkeleton key={n} />
          ))}
        </ScrollCarousel>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="text-center py-4">
          <p className="text-danger small mb-2">{error}</p>
          <button
            className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-semibold"
            onClick={fetchReviews}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && reviews.length === 0 && (
        <div
          className="text-center py-5 rounded-4"
          style={{ background: "#f8f9fa", border: "1px dashed #dee2e6" }}
        >
          <div className="fs-2 mb-2">💬</div>
          <h6 className="fw-bold text-dark mb-1">No reviews yet</h6>
          <p className="text-muted small mb-0">
            Be the first to share your experience after your order!
          </p>
        </div>
      )}

      {/* ── Reviews carousel ── */}
      {!loading && !error && sortedReviews.length > 0 && (
        <ScrollCarousel ariaLabel="Customer reviews">
          {sortedReviews.map((rev) => (
            <ReviewCard key={rev.id} rev={rev} />
          ))}
        </ScrollCarousel>
      )}
    </div>
  );
};

export default RestaurantReviews;
