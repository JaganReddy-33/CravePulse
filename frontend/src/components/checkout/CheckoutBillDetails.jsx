import React from 'react';

/**
 * CheckoutBillDetails: Complete fee breakdown with radical price parity explainer modal trigger.
 */
const CheckoutBillDetails = ({
  billDetails,
  riderTip,
  couponCode,
  onOpenPriceExplainer,
  onOpenCoupons,
}) => {
  if (!billDetails) return null;

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-extrabold text-dark mb-0">
          <i className="bi bi-receipt text-danger me-2"></i>
          Bill Details
        </h5>
        {onOpenPriceExplainer && (
          <button
            type="button"
            onClick={onOpenPriceExplainer}
            className="btn btn-link p-0 text-success text-decoration-none small fw-bold"
          >
            Audit Transparency ⓘ
          </button>
        )}
      </div>

      {/* Coupon promo trigger */}
      <div className="p-3 bg-light rounded-4 d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-tag-fill text-danger fs-5"></i>
          <div>
            <strong className="d-block small text-dark">
              {couponCode ? `Coupon '${couponCode}' Applied` : 'Have a Promo Coupon?'}
            </strong>
            <small className="text-muted" style={{ fontSize: 11 }}>
              {couponCode ? `Saved ₹${billDetails.couponDiscount} on this order` : 'Check eligible coupon discounts'}
            </small>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold touch-target"
          onClick={onOpenCoupons}
        >
          {couponCode ? 'Change' : 'Apply'}
        </button>
      </div>

      {/* Bill items */}
      <div className="d-flex flex-column gap-2 small text-muted mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <span>Item Total (100% Dine-In Menu Parity):</span>
          <span className="text-dark fw-semibold">₹{billDetails.subtotal}</span>
        </div>
        {billDetails.couponDiscount > 0 && (
          <div className="d-flex justify-content-between align-items-center text-success fw-bold">
            <span>Coupon Discount:</span>
            <span>-₹{billDetails.couponDiscount}</span>
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center">
          <span>Doorstep Delivery Partner Fee:</span>
          <span className="text-dark">₹{billDetails.deliveryFee}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>Standard Hygienic Packaging Fee:</span>
          <span className="text-dark">₹{billDetails.packagingFee}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>Platform Service Fee:</span>
          <span className="text-dark">₹{billDetails.platformFee}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>GST Tax (5% Direct Food Government Tax):</span>
          <span className="text-dark">₹{billDetails.gstTax}</span>
        </div>
        {riderTip > 0 && (
          <div className="d-flex justify-content-between align-items-center text-primary fw-bold">
            <span>Delivery Captain Tip (100% Pass-Through):</span>
            <span>+₹{riderTip}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="d-flex justify-content-between align-items-center pt-3 border-top">
        <div>
          <span className="text-dark fw-bold fs-6 d-block">To Pay</span>
          <small className="text-muted" style={{ fontSize: 11 }}>Inclusive of all taxes & fees</small>
        </div>
        <span className="fs-3 fw-extrabold text-danger">
          ₹{billDetails.totalAmount}
        </span>
      </div>
    </div>
  );
};

export default CheckoutBillDetails;
