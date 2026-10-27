import React, { useState } from 'react';
import ModalPortal from '../ModalPortal';

/**
 * CheckoutCouponDrawer: Coupon discovery modal with dynamic eligibility checks.
 */
const CheckoutCouponDrawer = ({
  show,
  onClose,
  couponCode,
  setCouponCode,
  subtotal,
}) => {
  const [inputCoupon, setInputCoupon] = useState('');

  const coupons = [
    {
      code: 'FOOD50',
      title: '50% OFF up to ₹100',
      minOrder: 199,
      description: 'Applies to any gourmet kitchen meal',
    },
    {
      code: 'WELCOME100',
      title: 'Flat ₹100 OFF',
      minOrder: 299,
      description: 'Special first-time diner welcome perk',
    },
    {
      code: 'FREESHIP',
      title: 'Free Delivery (Save ₹35)',
      minOrder: 249,
      description: 'Zero doorstep partner delivery fee',
    },
    {
      code: 'MEGAMATCH',
      title: 'Flat ₹150 OFF',
      minOrder: 599,
      description: 'Party handis and family feast discount',
    },
  ];

  if (!show) return null;

  const handleManualApply = (e) => {
    e.preventDefault();
    if (inputCoupon.trim()) {
      setCouponCode(inputCoupon.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={show}>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
          style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-drawer-title"
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-extrabold text-dark mb-0" id="coupon-drawer-title">
              Available Promo Coupons
            </h5>
            <button type="button" className="btn-close touch-target" onClick={onClose} aria-label="Close dialog"></button>
          </div>

          {/* Manual Code Input Form */}
          <form onSubmit={handleManualApply} className="mb-4">
            <div className="input-group rounded-pill border overflow-hidden shadow-xs">
              <input
                type="text"
                className="form-control border-0 ps-3 py-2 text-uppercase fw-bold"
                placeholder="Enter coupon code..."
                value={inputCoupon}
                onChange={(e) => setInputCoupon(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary px-4 fw-bold touch-target text-white"
                style={{ background: '#ff5722', borderColor: '#ff5722' }}
              >
                Apply
              </button>
            </div>
          </form>

          {/* Available Coupons List */}
          <div className="d-flex flex-column gap-3">
            {coupons.map((c) => {
              const isEligible = subtotal >= c.minOrder;
              const isCurrent = couponCode === c.code;

              return (
                <div
                  key={c.code}
                  className={`p-3 rounded-4 border ${
                    isCurrent
                      ? 'border-success bg-success-subtle'
                      : isEligible
                      ? 'border-light bg-light'
                      : 'border-light bg-light opacity-75'
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-danger fw-bold fs-6">{c.code}</span>
                    {isCurrent ? (
                      <span className="badge bg-success small">✓ Applied</span>
                    ) : isEligible ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold touch-target"
                        onClick={() => {
                          setCouponCode(c.code);
                          onClose();
                        }}
                      >
                        Apply
                      </button>
                    ) : (
                      <small className="text-danger fw-bold" style={{ fontSize: 11 }}>
                        Add items worth ₹{(c.minOrder - subtotal).toFixed(2)} more
                      </small>
                    )}
                  </div>
                  <strong className="d-block text-dark small">{c.title}</strong>
                  <small className="text-muted d-block" style={{ fontSize: 11 }}>
                    {c.description} • Minimum order ₹{c.minOrder}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default CheckoutCouponDrawer;
