import React from "react";

/**
 * CheckoutBillDetails: Complete fee breakdown with radical price parity explainer modal trigger.
 */
const CheckoutBillDetails = ({
  billDetails,
  riderTip,
  onOpenPriceExplainer,
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

      {/* Bill items */}
      <div className="d-flex flex-column gap-2 small text-muted mb-3">
        {billDetails.distanceKm != null &&
          Number.isFinite(Number(billDetails.distanceKm)) && (
            <div className="d-flex justify-content-between align-items-center">
              <span>Distance</span>
              <span className="text-dark">
                {Number(billDetails.distanceKm).toFixed(1)} km
              </span>
            </div>
          )}
        <div className="d-flex justify-content-between align-items-center">
          <span>Items subtotal</span>
          <span className="text-dark fw-semibold">₹{billDetails.subtotal}</span>
        </div>
        {billDetails.couponDiscount > 0 && (
          <div className="d-flex justify-content-between align-items-center text-success fw-bold">
            <span>Coupon discount</span>
            <span>-₹{billDetails.couponDiscount}</span>
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center">
          <span>Delivery fee</span>
          <span className="text-dark">₹{billDetails.deliveryFee}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>Packaging</span>
          <span className="text-dark">₹{billDetails.packagingFee}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>Platform fee</span>
          <span className="text-dark">₹{billDetails.platformFee}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>GST</span>
          <span className="text-dark">₹{billDetails.gstTax}</span>
        </div>
        {riderTip > 0 && (
          <div className="d-flex justify-content-between align-items-center text-primary fw-bold">
            <span>Tip</span>
            <span>+₹{riderTip}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="d-flex justify-content-between align-items-center pt-3 border-top">
        <div>
          <span className="text-dark fw-bold fs-6 d-block">To Pay</span>
          <small className="text-muted" style={{ fontSize: 11 }}>
            Inclusive of all taxes & fees
          </small>
        </div>
        <span className="fs-3 fw-extrabold text-danger">
          ₹{billDetails.totalAmount}
        </span>
      </div>
    </div>
  );
};

export default CheckoutBillDetails;
