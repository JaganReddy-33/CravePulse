import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import CheckoutAddressSection from "../../components/checkout/CheckoutAddressSection";
import CheckoutOrderSummary from "../../components/checkout/CheckoutOrderSummary";
import CheckoutTipSelector from "../../components/checkout/CheckoutTipSelector";
import CheckoutBillDetails from "../../components/checkout/CheckoutBillDetails";
import CheckoutPaymentMethods from "../../components/checkout/CheckoutPaymentMethods";
import CheckoutCouponDrawer from "../../components/checkout/CheckoutCouponDrawer";
import PriceBreakdownModal from "../../components/PriceBreakdownModal";
import useCheckout from "../../hooks/useCheckout";

/**
 * CheckoutPage: Focused, mobile-first checkout container responsive down to 360px viewport.
 */
const CheckoutPage = () => {
  const {
    cart,
    billDetails,
    calculating,
    couponError,
    couponCode,
    setCouponCode,
    billQuoteFresh,
    riderTip,
    setRiderTip,
    addItem,
    removeItem,
    clearCart,
    setDeliveryCoordinates,
    setDeliveryAddressId,
    setCheckoutQuoteEnabled,
    billQuoteAddressId,
  } = useCart();
  const { user } = useAuth();

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);

  const {
    addresses,
    addressesLoading,
    selectedAddressId,
    setSelectedAddressId,
    selectedAddress,
    hasValidQuote,
    handleSaveAddress,
    paymentMode,
    setPaymentMode,
    specialInstructions,
    setSpecialInstructions,
    submitting,
    error,
    walletBalance,
    codMaxLimit,
    onlineAvailable,
    handlePlaceOrder,
  } = useCheckout({
    cart,
    billDetails,
    billQuoteFresh,
    billQuoteAddressId,
    couponCode,
    riderTip,
    clearCart,
    user,
    setDeliveryCoordinates,
    setDeliveryAddressId,
    setCheckoutQuoteEnabled,
  });

  // Empty cart fallback
  if (!cart.restaurantId || cart.items.length === 0) {
    return (
      <div className="container text-center py-5">
        <div className="fs-1 mb-3">🛒</div>
        <h3 className="fw-extrabold text-dark">Your Bag is Empty</h3>
        <p className="text-muted small mb-4">
          Explore our gourmet kitchen menus and add delicious dishes before
          checking out.
        </p>
        <Link
          to="/"
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold touch-target shadow hover-lift"
          style={{
            background: "var(--c-primary)",
            borderColor: "var(--c-primary)",
          }}
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container py-4 customer-content-container"
      style={{ maxWidth: 1040 }}
    >
      {/* Checkout Page Header */}
      <div className="mb-4">
        <h2 className="fw-extrabold text-dark mb-1 fs-3 fs-md-2">
          Secure Checkout
        </h2>
        <p className="text-muted small mb-0">
          Radical price parity: dine-in physical menu prices guaranteed, 0%
          markup.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger rounded-4 p-3 mb-4 small fw-semibold shadow-xs d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Address, Order Summary, Tips, Payment */}
        <div className="col-lg-7">
          {/* 1. Delivery Address Picker */}
          <CheckoutAddressSection
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            onSaveAddress={handleSaveAddress}
          />
          {addressesLoading && (
            <p className="small text-muted" role="status">
              Loading your saved delivery addresses…
            </p>
          )}
          {couponError && (
            <div
              className="alert alert-warning rounded-3 py-2 small"
              role="status"
            >
              {couponError}
            </div>
          )}
          {calculating && (
            <p className="small text-muted" role="status">
              Calculating a fresh delivery fee and order total…
            </p>
          )}

          {/* 2. Order Items Review with Steppers */}
          <CheckoutOrderSummary
            cart={cart}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            specialInstructions={specialInstructions}
            setSpecialInstructions={setSpecialInstructions}
          />

          {/* 3. Delivery Captain Tip Strip (100% Pass-Through) */}
          <CheckoutTipSelector riderTip={riderTip} setRiderTip={setRiderTip} />

          {/* 4. Payment Method Options */}
          <CheckoutPaymentMethods
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            walletBalance={walletBalance}
            codMaxLimit={codMaxLimit}
            onlineAvailable={onlineAvailable}
            totalAmount={billDetails?.totalAmount || 0}
          />
        </div>

        {/* Right Column: Bill Details, Guarantee & Place Order CTA */}
        <div className="col-lg-5">
          <div className="sticky-top" style={{ top: 90, zIndex: 10 }}>
            <div className="card border-0 rounded-4 shadow-sm p-3 bg-white mb-3">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-tag-fill text-danger fs-5"></i>
                  <div>
                    <strong className="d-block small text-dark">
                      {couponCode
                        ? `Coupon '${couponCode}' applied`
                        : "Have a promo coupon?"}
                    </strong>
                    <small className="text-muted">
                      {couponCode
                        ? "Your coupon will be checked against this address quote."
                        : "Apply an eligible offer to this order."}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold touch-target"
                  onClick={() => setShowCouponDrawer(true)}
                >
                  {couponCode ? "Change" : "Apply"}
                </button>
              </div>
              {couponCode && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 mt-2 text-danger text-decoration-none"
                  onClick={() => setCouponCode("")}
                >
                  Remove applied coupon
                </button>
              )}
            </div>

            {/* Bill Details Breakdown */}
            <CheckoutBillDetails
              billDetails={billDetails}
              riderTip={riderTip}
              onOpenPriceExplainer={() => setShowPriceModal(true)}
            />

            {/* Place Order Primary Action Button */}
            <button
              type="button"
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 shadow-lg d-flex justify-content-between align-items-center px-4 touch-target hover-lift transition mb-3 text-white"
              style={{
                background: "var(--c-primary)",
                borderColor: "var(--c-primary)",
              }}
              onClick={handlePlaceOrder}
              disabled={
                submitting ||
                addressesLoading ||
                calculating ||
                !selectedAddress ||
                !hasValidQuote
              }
            >
              <span>
                {submitting ? "Confirming Order..." : "Place Secure Order"}
              </span>
              <span className="fs-5">₹{billDetails?.totalAmount || 0} →</span>
            </button>

            {/* Price Guarantee Badge */}
            <div className="p-3 bg-white rounded-4 border text-center shadow-xs">
              <div className="text-success small fw-bold mb-1">
                <i className="bi bi-shield-check fs-6 me-1"></i>
                CravePulse Fair Dining Guarantee
              </div>
              <small className="text-muted d-block" style={{ fontSize: 11 }}>
                Zero inflated prices • 100% tip pass-through • Live GPS captain
                radar
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Radical Price Transparency Explainer Sheet Modal */}
      <PriceBreakdownModal
        show={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        billDetails={billDetails}
      />

      {/* Coupon Drawer Modal */}
      <CheckoutCouponDrawer
        show={showCouponDrawer}
        onClose={() => setShowCouponDrawer(false)}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        subtotal={billDetails?.subtotal}
      />
    </div>
  );
};

export default CheckoutPage;
