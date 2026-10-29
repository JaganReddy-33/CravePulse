import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CheckoutAddressSection from '../../components/checkout/CheckoutAddressSection';
import CheckoutOrderSummary from '../../components/checkout/CheckoutOrderSummary';
import CheckoutTipSelector from '../../components/checkout/CheckoutTipSelector';
import CheckoutBillDetails from '../../components/checkout/CheckoutBillDetails';
import CheckoutPaymentMethods from '../../components/checkout/CheckoutPaymentMethods';
import CheckoutCouponDrawer from '../../components/checkout/CheckoutCouponDrawer';
import PriceBreakdownModal from '../../components/PriceBreakdownModal';
import useCheckout from '../../hooks/useCheckout';

/**
 * CheckoutPage: Focused, mobile-first checkout container responsive down to 360px viewport.
 */
const CheckoutPage = () => {
  const {
    cart,
    billDetails,
    couponCode,
    setCouponCode,
    riderTip,
    setRiderTip,
    addItem,
    removeItem,
    clearCart,
    setDeliveryCoordinates,
  } = useCart();
  const { user } = useAuth();

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);

  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
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
  } = useCheckout({ cart, billDetails, couponCode, riderTip, clearCart, user, setDeliveryCoordinates });

  // Empty cart fallback
  if (!cart.restaurantId || cart.items.length === 0) {
    return (
      <div className="container text-center py-5">
        <div className="fs-1 mb-3">🛒</div>
        <h3 className="fw-extrabold text-dark">Your Bag is Empty</h3>
        <p className="text-muted small mb-4">
          Explore our gourmet kitchen menus and add delicious dishes before checking out.
        </p>
        <Link
          to="/"
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold touch-target shadow hover-lift"
          style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4 customer-content-container" style={{ maxWidth: 1040 }}>
      {/* Checkout Page Header */}
      <div className="mb-4">
        <h2 className="fw-extrabold text-dark mb-1 fs-3 fs-md-2">Secure Checkout</h2>
        <p className="text-muted small mb-0">
          Radical price parity: dine-in physical menu prices guaranteed, 0% markup.
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
            {/* Bill Details Breakdown */}
            <CheckoutBillDetails
              billDetails={billDetails}
              riderTip={riderTip}
              couponCode={couponCode}
              onOpenPriceExplainer={() => setShowPriceModal(true)}
              onOpenCoupons={() => setShowCouponDrawer(true)}
            />

            {/* Place Order Primary Action Button */}
            <button
              type="button"
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 shadow-lg d-flex justify-content-between align-items-center px-4 touch-target hover-lift transition mb-3 text-white"
              style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
              onClick={handlePlaceOrder}
              disabled={submitting || !billDetails || !selectedAddressId}
            >
              <span>{submitting ? 'Confirming Order...' : 'Place Secure Order'}</span>
              <span className="fs-5">₹{billDetails?.totalAmount || 0} →</span>
            </button>

            {/* Price Guarantee Badge */}
            <div className="p-3 bg-white rounded-4 border text-center shadow-xs">
              <div className="text-success small fw-bold mb-1">
                <i className="bi bi-shield-check fs-6 me-1"></i>
                CravePulse Fair Dining Guarantee
              </div>
              <small className="text-muted d-block" style={{ fontSize: 11 }}>
                Zero inflated prices • 100% tip pass-through • Live GPS captain radar
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
        subtotal={billDetails?.subtotal || 0}
      />
    </div>
  );
};

export default CheckoutPage;
