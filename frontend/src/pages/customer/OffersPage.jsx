import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const PROMOS = [
  {
    code: 'FOOD50',
    title: 'Flat 50% Off Gourmet Dining',
    discount: '50% OFF up to ₹100',
    minOrder: '₹199',
    description: 'Valid on all partner restaurants for our anniversary celebration.',
    tag: 'MOST POPULAR',
    color: '#ff5722'
  },
  {
    code: 'WELCOME100',
    title: 'Welcome to CravePulse Fair Trade',
    discount: 'Flat ₹100 OFF',
    minOrder: '₹299',
    description: 'Exclusive first-order discount for new gourmet food lovers.',
    tag: 'NEW USERS',
    color: '#00b894'
  },
  {
    code: 'FREESHIP',
    title: 'Zero Delivery Fee Feast',
    discount: '100% Free Delivery',
    minOrder: '₹149',
    description: 'We cover the delivery partner distance fare on your meal.',
    tag: 'FREE DELIVERY',
    color: '#38bdf8'
  },
  {
    code: 'HEALTHY20',
    title: 'Clean Eating Salad & Bowl Offer',
    discount: '20% OFF up to ₹80',
    minOrder: '₹250',
    description: 'Applicable on verified organic and nutrient-dense kitchens.',
    tag: 'HEALTHY EATS',
    color: '#10b981'
  },
  {
    code: 'BIRYANI25',
    title: 'Dum Biryani Festival Bonanza',
    discount: '25% OFF up to ₹120',
    minOrder: '₹350',
    description: 'Authentic Hyderabadi and Lucknowi dum pots cooked to perfection.',
    tag: 'CHEF SPECIAL',
    color: '#f59e0b'
  }
];

const OffersPage = () => {
  const { setCouponCode } = useCart();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setCouponCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <span className="badge bg-danger-subtle text-danger border border-danger px-3 py-2 rounded-pill fw-bold mb-2">
          🎁 CRAVEPULSE DEALS & PROMOS
        </span>
        <h1 className="fw-extrabold text-dark display-6 mb-2">Active Coupons & Discounts</h1>
        <p className="text-muted lead mx-auto" style={{ maxWidth: 620 }}>
          Unlike other platforms with hidden fee offsets, CravePulse discounts are authentic savings backed by our 0% markup guarantee.
        </p>
      </div>

      {/* Promos Grid */}
      <div className="row g-4 mb-5">
        {PROMOS.map((promo) => (
          <div key={promo.code} className="col-md-6 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm h-100 bg-white overflow-hidden d-flex flex-column justify-content-between p-4 hover-lift transition">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge rounded-pill px-3 py-1 small fw-bold" style={{ background: `${promo.color}15`, color: promo.color }}>
                    {promo.tag}
                  </span>
                  <small className="text-muted">Min order {promo.minOrder}</small>
                </div>

                <h5 className="fw-extrabold text-dark mb-1">{promo.title}</h5>
                <div className="fs-4 fw-black mb-2" style={{ color: promo.color }}>
                  {promo.discount}
                </div>
                <p className="text-muted small mb-4">{promo.description}</p>
              </div>

              {/* Code Box & Copy Button */}
              <div className="d-flex align-items-center justify-content-between p-2 rounded-3 border border-dashed bg-light">
                <span className="font-monospace fw-bold fs-6 text-dark ps-2">{promo.code}</span>
                <button
                  className={`btn btn-sm rounded-pill px-3 fw-bold transition ${copiedCode === promo.code ? 'btn-success' : 'btn-dark'}`}
                  onClick={() => handleCopyCode(promo.code)}
                >
                  {copiedCode === promo.code ? '✓ Applied to Cart' : 'Copy & Apply'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white text-center">
        <h4 className="fw-bold text-dark mb-2">Ready to taste delicious food?</h4>
        <p className="text-muted small mb-4">Select your favorite restaurant, customize dishes, and your copied coupon applies automatically at checkout.</p>
        <Link to="/" className="btn btn-primary rounded-pill px-5 py-2 fw-bold mx-auto shadow-sm" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
          Explore Restaurants Now →
        </Link>
      </div>
    </div>
  );
};

export default OffersPage;
