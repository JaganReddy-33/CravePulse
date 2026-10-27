import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ParticleBackground from '../../components/ParticleBackground';
import { useCart } from '../../context/CartContext';
import PriceBreakdownModal from '../../components/PriceBreakdownModal';
import ModalPortal from '../../components/ModalPortal';

const CustomerLayout = () => {
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [inputCoupon, setInputCoupon] = useState('');
  const { cart, billDetails, removeItem, addItem, clearCart, totalItemCount, couponCode, setCouponCode, couponError } = useCart();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (inputCoupon.trim()) {
      setCouponCode(inputCoupon.trim().toUpperCase());
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setInputCoupon('');
  };

  return (
    <div className="customer-portal position-relative d-flex flex-column min-vh-100" style={{ paddingTop: '74px' }}>
      <ParticleBackground />
      <Navbar onOpenCart={() => setShowCartDrawer(true)} />

      <main className="flex-grow-1 position-relative">
        <Outlet context={{ openPriceExplainer: () => setShowPriceModal(true) }} />
      </main>

      {/* Cart Drawer Offcanvas Backdrop wrapped in ModalPortal */}
      {showCartDrawer && (
        <ModalPortal isOpen={showCartDrawer}>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowCartDrawer(false)}
          >
            {/* Cart Drawer Content Panel */}
            <div 
              className="position-fixed top-0 end-0 h-100 bg-white shadow-2xl d-flex flex-column animate-slide-left"
              style={{ width: 420, maxWidth: '100%', zIndex: 10060 }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Drawer Header */}
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                  style={{ width: 34, height: 34, background: '#ff5722' }}
                >
                  <i className="bi bi-bag-check-fill fs-6"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">Your Food Bag</h6>
                  <small className="text-muted" style={{ fontSize: 11 }}>
                    {cart.restaurantName ? `From ${cart.restaurantName}` : 'No restaurant selected'}
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {cart.items.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill small" 
                    style={{ fontSize: 11 }}
                    onClick={clearCart}
                  >
                    Clear All
                  </button>
                )}
                <button type="button" className="btn-close" onClick={() => setShowCartDrawer(false)} aria-label="Close"></button>
              </div>
            </div>

            {/* Drawer Items Body */}
            <div className="flex-grow-1 overflow-auto p-3">
              {cart.items.length === 0 ? (
                <div className="text-center py-5">
                  <div className="fs-1 mb-2">🍽️</div>
                  <h6 className="fw-bold text-dark">Your bag is empty</h6>
                  <p className="text-muted small mb-4">Explore delicious items and enjoy genuine dine-in menu prices delivered!</p>
                  <button 
                    className="btn btn-sm btn-primary rounded-pill px-4 fw-bold"
                    style={{ background: '#ff5722', borderColor: '#ff5722' }}
                    onClick={() => setShowCartDrawer(false)}
                  >
                    Browse Kitchens
                  </button>
                </div>
              ) : (
                <div>
                  {/* Items List */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    {cart.items.map((it) => (
                      <div key={it.cartKey} className="card border-0 bg-light rounded-3 p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="pe-2 flex-grow-1">
                            <div className="d-flex align-items-center gap-1">
                              <span className={`badge ${it.veg ? 'bg-success' : 'bg-danger'} p-1 rounded-circle`} style={{ width: 8, height: 8 }}></span>
                              <div className="fw-bold small text-dark">{it.name}</div>
                            </div>
                            {it.selectedVariant && (
                              <small className="text-muted d-block" style={{ fontSize: 11 }}>
                                Variant: {it.selectedVariant.variantName}
                              </small>
                            )}
                            {it.selectedAddons?.length > 0 && (
                              <small className="text-muted d-block" style={{ fontSize: 11 }}>
                                + {it.selectedAddons.map(a => a.addonName).join(', ')}
                              </small>
                            )}
                            <div className="mt-1 fw-bold text-dark small">₹{it.platformPrice}</div>
                          </div>

                          {/* Stepper +/- */}
                          <div className="d-flex align-items-center gap-2 bg-white rounded-pill px-2 py-1 border shadow-sm">
                            <button 
                              className="btn btn-sm p-0 border-0 text-muted hover-dark" 
                              onClick={() => removeItem(it.cartKey)}
                              aria-label="Decrease quantity"
                            >
                              <i className="bi bi-dash fw-bold"></i>
                            </button>
                            <span className="small fw-extrabold text-dark px-1">{it.quantity}</span>
                            <button 
                              className="btn btn-sm p-0 border-0 text-danger hover-dark" 
                              onClick={() => addItem({ restaurantId: cart.restaurantId, item: it, variant: it.selectedVariant, addons: it.selectedAddons })}
                              aria-label="Increase quantity"
                            >
                              <i className="bi bi-plus fw-bold"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code Input Section */}
                  <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-dark d-flex align-items-center gap-1">
                        <i className="bi bi-tag-fill text-danger"></i> Offers & Coupons
                      </span>
                      {couponCode && (
                        <button className="btn btn-link btn-sm p-0 text-danger text-decoration-none small fw-bold" onClick={handleRemoveCoupon}>
                          Remove
                        </button>
                      )}
                    </div>

                    {couponCode ? (
                      <div className="badge bg-success-subtle text-success border border-success p-2 d-flex justify-content-between align-items-center rounded-3">
                        <span><strong>{couponCode}</strong> applied successfully!</span>
                        <span className="fw-extrabold">Save ₹{billDetails?.couponDiscount || 0}</span>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="input-group input-group-sm mb-2">
                        <input
                          type="text"
                          className="form-control text-uppercase font-monospace"
                          placeholder="Enter coupon code"
                          value={inputCoupon}
                          onChange={(e) => setInputCoupon(e.target.value)}
                        />
                        <button 
                          type="submit" 
                          className="btn btn-primary fw-bold px-3"
                          style={{ background: '#ff5722', borderColor: '#ff5722' }}
                        >
                          Apply
                        </button>
                      </form>
                    )}

                    {couponError && (
                      <small className="text-danger d-block mt-1">{couponError}</small>
                    )}

                    {/* Quick Suggestion Pills */}
                    {!couponCode && (
                      <div className="d-flex flex-wrap gap-1 mt-2">
                        <button 
                          type="button" 
                          className="btn btn-white bg-white border btn-sm py-0 px-2 rounded-pill text-secondary"
                          style={{ fontSize: 10 }}
                          onClick={() => setCouponCode('FOOD50')}
                        >
                          FOOD50 (50% OFF)
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-white bg-white border btn-sm py-0 px-2 rounded-pill text-secondary"
                          style={{ fontSize: 10 }}
                          onClick={() => setCouponCode('WELCOME100')}
                        >
                          WELCOME100 (₹100 OFF)
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-white bg-white border btn-sm py-0 px-2 rounded-pill text-secondary"
                          style={{ fontSize: 10 }}
                          onClick={() => setCouponCode('FREESHIP')}
                        >
                          FREESHIP (Free Delivery)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Radical Price Parity Assurance Pill */}
                  <div className="p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2 small text-success">
                      <i className="bi bi-patch-check-fill fs-6"></i>
                      <span className="fw-bold">100% Dine-In Menu Parity</span>
                    </div>
                    <button 
                      type="button"
                      className="btn btn-link btn-sm p-0 text-success text-decoration-none small fw-bold" 
                      onClick={() => setShowPriceModal(true)}
                    >
                      Audit Bill ⓘ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Checkout Footer */}
            {cart.items.length > 0 && billDetails && (
              <div className="p-3 border-top bg-light">
                <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                  <span>Item Subtotal:</span>
                  <span>₹{billDetails.subtotal}</span>
                </div>
                {billDetails.couponDiscount > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-1 text-success small fw-bold">
                    <span>Coupon Discount:</span>
                    <span>-₹{billDetails.couponDiscount}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center mb-2 text-muted small">
                  <span>Taxes, Packaging & Delivery:</span>
                  <span>₹{(billDetails.deliveryFee + billDetails.packagingFee + billDetails.platformFee + billDetails.gstTax).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3 pt-2 border-top">
                  <span className="fw-bold text-dark">To Pay</span>
                  <span className="fs-4 fw-extrabold" style={{ color: '#ff5722' }}>
                    ₹{billDetails.totalAmount}
                  </span>
                </div>
                <Link
                  to="/checkout"
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold d-flex justify-content-between align-items-center px-4 shadow transition hover-lift"
                  style={{ background: '#ff5722', borderColor: '#ff5722' }}
                  onClick={() => setShowCartDrawer(false)}
                >
                  <span>Proceed to Checkout</span>
                  <i className="bi bi-arrow-right fs-6"></i>
                </Link>
              </div>
            )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Radical Price Transparency Explainer Modal */}
      <PriceBreakdownModal show={showPriceModal} onClose={() => setShowPriceModal(false)} billDetails={billDetails} />

      {/* Rich Multi-Column Production-Grade Footer */}
      <Footer />
    </div>
  );
};

export default CustomerLayout;
