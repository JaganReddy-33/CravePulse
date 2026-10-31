import api from "../../services/api";
import React, { useState, useEffect } from "react";
import ScrollCarousel from "../common/ScrollCarousel";

/**
 * RestaurantOffersStrip: Interactive promotional coupon carousel strip with quick-copy.
 */
const RestaurantOffersStrip = ({ restaurantId }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const [activeOffers, setOffers] = useState([]);
  useEffect(() => {
    api
      .get("/catalog/offers", { params: { restaurantId } })
      .then((res) => setOffers(res.data || []))
      .catch(() => setOffers([]));
  }, [restaurantId]);
  const handleCopy = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!activeOffers.length) return null;
  return (
    <div className="mb-4">
      <small
        className="text-muted fw-bold text-uppercase d-block mb-2"
        style={{ fontSize: 11, letterSpacing: "0.05em" }}
      >
        🏷️ Active Deals &amp; Promotional Offers
      </small>
      <ScrollCarousel ariaLabel="Promotional offers" gap="1rem">
        {activeOffers.map((offer, idx) => (
          <div
            key={idx}
            className="card border rounded-4 p-3 flex-shrink-0 shadow-sm bg-white"
            style={{ width: 260 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="badge bg-danger-subtle text-danger fw-bold">
                {offer.discount}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-decoration-none fw-bold small text-primary"
                onClick={() => handleCopy(offer.code)}
              >
                {copiedCode === offer.code ? "✓ Copied" : "Copy Code"}
              </button>
            </div>
            <strong className="text-dark small d-block">{offer.code}</strong>
            <small className="text-muted" style={{ fontSize: 11 }}>
              {offer.details}
            </small>
          </div>
        ))}
      </ScrollCarousel>
    </div>
  );
};

export default RestaurantOffersStrip;
