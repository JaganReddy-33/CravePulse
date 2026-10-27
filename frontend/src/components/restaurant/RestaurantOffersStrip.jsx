import React, { useState } from 'react';

/**
 * RestaurantOffersStrip: Interactive promotional coupon carousel strip with quick-copy.
 */
const RestaurantOffersStrip = ({ offers = [] }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const defaultOffers = [
    { code: 'FOOD50', discount: '50% OFF', details: 'Up to ₹100 on orders above ₹199' },
    { code: 'WELCOME100', discount: '₹100 FLAT', details: 'Flat discount on your first order' },
    { code: 'FREESHIP', discount: 'FREE DELIVERY', details: 'Free doorstep drop above ₹299' },
  ];

  const activeOffers = offers.length > 0 ? offers : defaultOffers;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mb-4">
      <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: 10 }}>
        Active Deals & Promotional Offers
      </small>
      <div 
        className="d-flex gap-3 overflow-auto pb-2" 
        style={{ scrollbarWidth: 'thin', scrollSnapType: 'x mandatory' }}
      >
        {activeOffers.map((offer, idx) => (
          <div
            key={idx}
            className="card border rounded-4 p-3 flex-shrink-0 shadow-sm bg-white"
            style={{ width: 260, scrollSnapAlign: 'start' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="badge bg-danger-subtle text-danger fw-bold">{offer.discount}</span>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-decoration-none fw-bold small text-primary"
                onClick={() => handleCopy(offer.code)}
              >
                {copiedCode === offer.code ? '✓ Copied' : 'Copy Code'}
              </button>
            </div>
            <strong className="text-dark small d-block">{offer.code}</strong>
            <small className="text-muted" style={{ fontSize: 11 }}>{offer.details}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantOffersStrip;
