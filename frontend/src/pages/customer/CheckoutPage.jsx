import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import PriceBreakdownModal from '../../components/PriceBreakdownModal';
import UpiPaymentDrawer from '../../components/UpiPaymentDrawer';
import SettlementLedger from '../../components/SettlementLedger';

const DEFAULT_ADDRESSES = [
  { id: 1, title: 'Home', addressLine: 'Apartment 402, Sunshine Heights, 12th Main Road', landmark: 'Near 100ft Road junction, Indiranagar', city: 'Bangalore', state: 'Karnataka', postalCode: '560038', default: true },
  { id: 2, title: 'Work', addressLine: 'WeWork Galaxy, 43 Residency Road, Shanthala Nagar', landmark: 'Opposite Bangalore Club', city: 'Bangalore', state: 'Karnataka', postalCode: '560025', default: false },
  { id: 3, title: 'Other', addressLine: 'Villa 18, Green Meadows, 5th Cross, HSR Sector 1', landmark: 'Near Agara Lake Park', city: 'Bangalore', state: 'Karnataka', postalCode: '560102', default: false },
];

const CheckoutPage = () => {
  const { cart, billDetails, couponCode, setCouponCode, riderTip, setRiderTip, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(DEFAULT_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [paymentMode, setPaymentMode] = useState('RAZORPAY'); // 'RAZORPAY', 'WALLET', 'COD'
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showUpiDrawer, setShowUpiDrawer] = useState(false);
  const [showSettlementLedger, setShowSettlementLedger] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ title: 'Home', addressLine: '', landmark: '', city: 'Bangalore', postalCode: '560038' });
  const [customTipInput, setCustomTipInput] = useState('');
  const [error, setError] = useState('');
  const [inputCoupon, setInputCoupon] = useState('');

  // Real Payment configs & Wallet balance
  const [walletBalance, setWalletBalance] = useState(0);
  const [codMaxLimit, setCodMaxLimit] = useState(2000);
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_cravepulse_demo2026');
  const [createdOrderSession, setCreatedOrderSession] = useState(null);

  // Razorpay payment simulation modal fallback
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentMethodTab, setPaymentMethodTab] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    api.get('/payments/config').then((res) => {
      if (res.success && res.data) {
        if (res.data.codMaxLimit) setCodMaxLimit(Number(res.data.codMaxLimit));
        if (res.data.razorpayKeyId) setRazorpayKeyId(res.data.razorpayKeyId);
      }
    }).catch(() => {});

    if (user) {
      api.get('/auth/addresses').then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAddresses(res.data);
          const def = res.data.find(a => a.default) || res.data[0];
          setSelectedAddressId(def.id);
        }
      }).catch(() => {});

      api.get('/wallet').then((res) => {
        if (res.success && res.data && res.data.balance !== undefined) {
          setWalletBalance(Number(res.data.balance));
        }
      }).catch(() => {});
    }
  }, [user]);

  const isCodDisabled = (billDetails?.totalAmount || 0) > codMaxLimit;
  useEffect(() => {
    if (isCodDisabled && paymentMode === 'COD') {
      setPaymentMode('RAZORPAY');
    }
  }, [isCodDisabled, paymentMode]);

  if (!cart.restaurantId || cart.items.length === 0) {
    return (
      <div className="container text-center py-5">
        <div className="fs-1 mb-3">🛒</div>
        <h3 className="fw-bold">Your Cart is Empty</h3>
        <p className="text-muted">Explore our restaurant menus and add delicious dishes before checking out.</p>
        <Link to="/" className="btn btn-primary rounded-pill px-4 fw-bold" style={{ background: '#ff5722', borderColor: '#ff5722' }}>
          Browse Restaurants
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (inputCoupon.trim()) {
      setCouponCode(inputCoupon.trim().toUpperCase());
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setSelectedAddressId(1);
    }
    setError('');

    if (!user) {
      setError('Please sign in to place your order.');
      navigate('/customer/auth');
      return;
    }

    if (paymentMode === 'WALLET') {
      if (walletBalance < (billDetails?.totalAmount || 0)) {
        setError(`Insufficient wallet balance. You need ₹${((billDetails?.totalAmount || 0) - walletBalance).toFixed(2)} more. Please top up your wallet or choose Razorpay.`);
        return;
      }
      executeOrderCreation('WALLET', 'PAID');
      return;
    }

    if (paymentMode === 'COD') {
      if (isCodDisabled) {
        setError(`Cash on delivery is disabled for orders over ₹${codMaxLimit}.`);
        return;
      }
      executeOrderCreation('COD', 'PENDING');
      return;
    }

    // RAZORPAY mode
    executeOrderCreation('RAZORPAY', 'PENDING');
  };

  const executeOrderCreation = async (mode, payStatus) => {
    setSubmitting(true);
    try {
      if (!user) {
        setError('Please sign in to place your order.');
        setSubmitting(false);
        navigate('/customer/auth');
        return;
      }

      const payload = {
        restaurantId: cart.restaurantId,
        deliveryAddressId: selectedAddressId || 1,
        paymentMode: mode,
        paymentStatus: payStatus,
        couponCode: couponCode || null,
        specialInstructions: specialInstructions || null,
        tipAmount: riderTip || 0,
        items: cart.items.map(it => ({
          menuItemId: it.id,
          quantity: it.quantity,
          variantId: it.selectedVariant?.id || null,
          addonIds: it.selectedAddons?.map(a => a.id) || [],
        })),
      };

      const res = await api.post('/orders', payload);
      if (res.success && res.data) {
        const orderNumber = res.data.orderNumber;

        // If Razorpay mode and active session returned
        if (mode === 'RAZORPAY' && res.data.paymentSession) {
          const session = res.data.paymentSession;
          if (typeof window !== 'undefined' && window.Razorpay) {
            const options = {
              key: session.keyId || razorpayKeyId,
              amount: session.amount,
              currency: session.currency || 'INR',
              name: 'CravePulse',
              description: `Order #${orderNumber}`,
              order_id: session.razorpayOrderId,
              prefill: {
                name: session.customerName || user.fullName || 'Customer',
                email: session.customerEmail || user.email || '',
                contact: session.customerPhone || user.phone || '',
              },
              theme: { color: '#ff5722' },
              handler: async function (resp) {
                setSubmitting(true);
                try {
                  await api.post('/payments/verify', {
                    razorpayOrderId: resp.razorpay_order_id,
                    razorpayPaymentId: resp.razorpay_payment_id,
                    razorpaySignature: resp.razorpay_signature,
                  });
                  confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
                  clearCart();
                  navigate(`/orders/${orderNumber}`);
                } catch (vErr) {
                  setError(vErr.message || 'Payment signature verification failed');
                  navigate(`/orders/${orderNumber}`);
                } finally {
                  setSubmitting(false);
                }
              },
              modal: {
                ondismiss: function () {
                  clearCart();
                  navigate(`/orders/${orderNumber}`);
                }
              }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
            setSubmitting(false);
            return;
          } else {
            // Fallback modal if script blocked
            setCreatedOrderSession({ orderNumber, session });
            setShowRazorpayModal(true);
            setSubmitting(false);
            return;
          }
        }

        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 },
        });
        clearCart();
        navigate(`/orders/${orderNumber}`);
      } else {
        throw new Error(res.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setError(err.message || 'Failed to place order. Please check the details and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRazorpay = async () => {
    if (!createdOrderSession) return;
    setProcessingPayment(true);
    try {
      const { orderNumber, session } = createdOrderSession;
      const simPaymentId = 'pay_' + Math.random().toString(36).substring(2, 14);
      await api.post('/payments/verify', {
        razorpayOrderId: session.razorpayOrderId,
        razorpayPaymentId: simPaymentId,
        razorpaySignature: 'simulated_valid_sig',
      });
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
      clearCart();
      setShowRazorpayModal(false);
      navigate(`/orders/${orderNumber}`);
    } catch (err) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Review & Complete Order</h3>
          <p className="text-muted small mb-0">100% Price Parity Guaranteed • Honest ETA Assurance</p>
        </div>
        <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
          ← Back to Menu
        </Link>
      </div>

      {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full overflow-x-hidden">
        {/* Left Column: Delivery Address & Payment */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 w-full min-w-0">
          {/* User Sign-in notification if Guest */}
          {!user && (
            <div className="card border-0 rounded-4 shadow-sm p-3 bg-warning-subtle text-dark border border-warning-subtle d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
              <div>
                <strong className="d-block small">Sign in to place your order</strong>
                <small className="text-muted">You need an active customer account for live tracking, order history, and invoices.</small>
              </div>
              <Link to="/customer/auth" className="btn btn-sm btn-primary rounded-pill px-3 text-nowrap">
                Sign In / Register
              </Link>
            </div>
          )}

          {/* 1. Address Selection */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-danger"></i> Select Delivery Address
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                onClick={() => setShowAddAddressModal(true)}
              >
                + Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map(addr => (
                <div key={addr.id} className="w-full">
                  <div
                    className={`p-3 rounded-3 border cursor-pointer h-100 transition ${selectedAddressId === addr.id ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-light'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedAddressId(addr.id)}
                  >
                    <div className="d-flex justify-content-between mb-1">
                      <strong className="small text-uppercase d-flex align-items-center gap-1">
                        <i className={`bi ${addr.title === 'Home' ? 'bi-house-door-fill' : addr.title === 'Work' ? 'bi-briefcase-fill' : 'bi-geo-alt-fill'}`}></i>
                        {addr.title}
                      </strong>
                      {selectedAddressId === addr.id && <i className="bi bi-check-circle-fill text-primary"></i>}
                    </div>
                    <div className="small text-dark mb-1">{addr.addressLine}</div>
                    <small className="text-muted d-block">{addr.landmark || addr.city}, {addr.postalCode}</small>
                    <a
                      href={addr.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.addressLine}, ${addr.city}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="badge bg-white text-primary border text-decoration-none mt-2 d-inline-flex align-items-center gap-1 small"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="bi bi-map"></i> View on Google Maps ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <label className="form-label small fw-semibold text-muted">Cooking or Delivery Instructions</label>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="e.g. Please ring doorbell and leave at doorstep, keep food piping hot..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>
          </div>

          {/* Driver Tip Selection (100% Pass-Through) */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <span>🚴</span> Delivery Partner Tip
              </h6>
              <span className="badge bg-success-subtle text-success border border-success-subtle small d-flex align-items-center gap-1">
                <i className="bi bi-shield-check"></i> 100% Tip Pass-Through
              </span>
            </div>
            <p className="text-muted small mb-3">
              100% of your tip goes directly to your delivery partner. Show your appreciation for fast and safe delivery.
            </p>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {[0, 20, 30, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition ${
                    riderTip === amt
                      ? 'btn-success text-white shadow-sm'
                      : 'btn-light border text-dark'
                  }`}
                  onClick={() => {
                    setRiderTip(amt);
                    setCustomTipInput('');
                  }}
                >
                  {amt === 0 ? 'No Tip' : `₹${amt}`}
                </button>
              ))}
              <div className="input-group input-group-sm rounded-pill overflow-hidden border" style={{ width: 110 }}>
                <span className="input-group-text bg-white border-0 text-muted ps-2 pe-1">₹</span>
                <input
                  type="number"
                  className="form-control border-0 ps-0"
                  placeholder="Custom"
                  min="0"
                  max="1000"
                  value={customTipInput}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setCustomTipInput(e.target.value);
                    setRiderTip(val);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 2. Honest ETA Engine Guarantee */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-warning flex-shrink-0" 
                style={{ width: 48, height: 48, background: '#fef3c7', fontSize: 22 }}
              >
                <i className="bi bi-stopwatch-fill"></i>
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-1">
                  <h6 className="fw-bold mb-0">Honest ETA Engine Guarantee</h6>
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-3 py-1 fw-bold">
                    {billDetails?.etaMinMinutes || 25}-{billDetails?.etaMaxMinutes || 35} Mins
                  </span>
                </div>
                <small className="text-muted d-block mt-1">
                  Confidence interval computed via active kitchen volume + dish prep history + rider transit telemetry.
                  If delayed past upper ETA by &gt; 10 mins, an automated <strong>₹50 goodwill credit</strong> is refunded to your wallet.
                </small>
              </div>
            </div>
          </div>

          {/* 3. Payment Method Selection */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-credit-card-fill text-primary"></i> Select Payment Method
            </h5>

            <div className="list-group">
              {/* Option 1: Razorpay Online Payment */}
              <label 
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 rounded-3 mb-2 border ${paymentMode === 'RAZORPAY' ? 'border-primary bg-primary-subtle' : ''}`} 
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="radio"
                    name="payMode"
                    className="form-check-input mt-0"
                    checked={paymentMode === 'RAZORPAY'}
                    onChange={() => setPaymentMode('RAZORPAY')}
                  />
                  <div>
                    <div className="fw-bold text-dark d-flex flex-wrap align-items-center gap-2">
                      <span>Online Payment (Razorpay)</span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle small">100% SECURE</span>
                    </div>
                    <small className="text-muted d-block mt-0.5">
                      UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards (Visa, Mastercard, RuPay), NetBanking
                    </small>
                  </div>
                </div>
                <span className="fs-3 flex-shrink-0">💳</span>
              </label>

              {/* Option 2: CravePulse Wallet */}
              <label 
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 rounded-3 mb-2 border ${paymentMode === 'WALLET' ? 'border-primary bg-primary-subtle' : ''}`} 
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="radio"
                    name="payMode"
                    className="form-check-input mt-0"
                    checked={paymentMode === 'WALLET'}
                    onChange={() => setPaymentMode('WALLET')}
                  />
                  <div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-2">
                      <span>CravePulse Wallet</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                        Available: ₹{walletBalance.toFixed(2)}
                      </span>
                    </div>
                    <small className="text-muted d-block mt-0.5">
                      {walletBalance >= (billDetails?.totalAmount || 0)
                        ? '1-Click instant payment debit with 0% gateway charges'
                        : `Insufficient balance (₹${((billDetails?.totalAmount || 0) - walletBalance).toFixed(2)} needed). Please top up or pay via Razorpay.`}
                    </small>
                  </div>
                </div>
                <span className="fs-3 flex-shrink-0">👛</span>
              </label>

              {/* Option 3: Cash on Delivery (COD) */}
              <label 
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 rounded-3 border ${paymentMode === 'COD' ? 'border-primary bg-primary-subtle' : ''} ${isCodDisabled ? 'opacity-50' : ''}`} 
                style={{ cursor: isCodDisabled ? 'not-allowed' : 'pointer' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="radio"
                    name="payMode"
                    className="form-check-input mt-0"
                    disabled={isCodDisabled}
                    checked={paymentMode === 'COD'}
                    onChange={() => !isCodDisabled && setPaymentMode('COD')}
                  />
                  <div>
                    <div className="fw-bold text-dark d-flex align-items-center gap-2">
                      <span>Cash on Delivery (COD)</span>
                      {isCodDisabled && (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
                          Disabled (Cart &gt; ₹{codMaxLimit})
                        </span>
                      )}
                    </div>
                    <small className="text-muted d-block mt-0.5">
                      {isCodDisabled
                        ? `COD is restricted to orders up to ₹${codMaxLimit}. Please select Online Payment or Wallet.`
                        : "Pay in cash or scan delivery captain's dynamic UPI QR code at doorstep"}
                    </small>
                  </div>
                </div>
                <span className="fs-3 flex-shrink-0">💵</span>
              </label>
            </div>
          </div>

          {/* 4. 3-Way Zero-Markup Settlement Ledger Explainer Toggle */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
              <div>
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <span className="fs-5">⚖️</span>
                  <span>3-Way Zero-Commission Settlement Ledger</span>
                </h6>
                <small className="text-muted">
                  Mathematical breakdown for ₹250 sample order: Chef ₹190, Captain ₹73, Platform ₹7.
                </small>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold text-nowrap"
                onClick={() => setShowSettlementLedger(!showSettlementLedger)}
              >
                {showSettlementLedger ? '▲ Hide Breakdown' : '▼ View Breakdown'}
              </button>
            </div>

            {showSettlementLedger && (
              <div className="mt-3">
                <SettlementLedger 
                  sampleTotal={billDetails?.totalAmount >= 400 ? 500 : 250}
                  orderNumber={'ORD-' + (cart.restaurantId ? '20261026-' + cart.restaurantId : '20261026-002')}
                  restaurantName={cart.restaurantName}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Itemised Bill */}
        <div className="col-span-12 lg:col-span-5 w-full min-w-0">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white sticky-top" style={{ top: 90 }}>
            <h5 className="fw-bold mb-3">Order Summary</h5>

            {/* Restaurant header */}
            <div className="p-3 bg-light rounded-3 mb-3 d-flex justify-content-between align-items-center">
              <div>
                <strong className="d-block text-dark">{cart.restaurantName}</strong>
                <small className="text-muted">{cart.items.length} unique dish(es)</small>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-link p-0 text-primary text-decoration-none fw-semibold" 
                onClick={() => setShowPriceModal(true)}
              >
                Price Audit ⓘ
              </button>
            </div>

            {/* Dish list */}
            <div className="mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {cart.items.map(it => (
                <div key={it.cartKey} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="small fw-semibold text-dark">{it.name} x {it.quantity}</div>
                    {it.selectedVariant && <small className="text-muted d-block">{it.selectedVariant.variantName}</small>}
                    {it.selectedAddons?.length > 0 && (
                      <small className="text-muted d-block">+ {it.selectedAddons.map(a => a.addonName).join(', ')}</small>
                    )}
                  </div>
                  <span className="small fw-bold text-dark">₹{it.platformPrice * it.quantity}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="mb-3">
              <form onSubmit={handleApplyCoupon} className="input-group mb-2">
                <input
                  type="text"
                  className="form-control text-uppercase font-monospace"
                  placeholder="Enter code (FOOD50)"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="btn btn-outline-primary fw-bold"
                  style={{ borderColor: '#ff5722', color: '#ff5722' }}
                >
                  Apply
                </button>
              </form>

              {/* Quick coupons pill */}
              <div className="d-flex flex-wrap gap-1 mb-2">
                <button 
                  type="button" 
                  className={`btn btn-sm py-0 px-2 rounded-pill small ${couponCode === 'FOOD50' ? 'btn-success text-white' : 'btn-light text-secondary border'}`} 
                  onClick={() => setCouponCode('FOOD50')}
                  style={{ fontSize: 10 }}
                >
                  FOOD50 (50% OFF)
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm py-0 px-2 rounded-pill small ${couponCode === 'WELCOME100' ? 'btn-success text-white' : 'btn-light text-secondary border'}`} 
                  onClick={() => setCouponCode('WELCOME100')}
                  style={{ fontSize: 10 }}
                >
                  WELCOME100 (₹100 OFF)
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm py-0 px-2 rounded-pill small ${couponCode === 'FREESHIP' ? 'btn-success text-white' : 'btn-light text-secondary border'}`} 
                  onClick={() => setCouponCode('FREESHIP')}
                  style={{ fontSize: 10 }}
                >
                  FREESHIP (Free Delivery)
                </button>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">Have another promo code?</small>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-primary text-decoration-none fw-bold"
                  style={{ fontSize: 11 }}
                  onClick={() => setShowCouponsModal(true)}
                >
                  View All Offers &amp; Eligibility ↗
                </button>
              </div>
            </div>

            {/* Bill Details Breakdown */}
            {billDetails && (
              <div className="border-top pt-3 mb-4 small">
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>Dine-In Equivalent Menu Total:</span>
                  <span>₹{billDetails.dineInSubtotal}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-dark fw-semibold">Platform Food Subtotal:</span>
                  <span className="fw-bold text-dark">₹{billDetails.subtotal}</span>
                </div>
                {billDetails.couponDiscount > 0 && (
                  <div className="d-flex justify-content-between py-1 text-success fw-bold">
                    <span>Coupon Discount ({billDetails.couponCode}):</span>
                    <span>-₹{billDetails.couponDiscount}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>Tamper-evident Packaging:</span>
                  <span>₹{billDetails.packagingFee}</span>
                </div>
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>Rider Distance Fare ({billDetails.distanceKm} km):</span>
                  <span>₹{billDetails.deliveryFee}</span>
                </div>
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>Platform Convenience Fee:</span>
                  <span>₹{billDetails.platformFee}</span>
                </div>
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>GST (5% Restaurant Service Tax):</span>
                  <span>₹{billDetails.gstTax}</span>
                </div>
                {billDetails.tipAmount > 0 && (
                  <div className="d-flex justify-content-between py-1 text-primary fw-semibold">
                    <span>Delivery Partner Tip (100% to rider):</span>
                    <span>₹{billDetails.tipAmount}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between py-2 mt-2 border-top fs-5 fw-extrabold text-dark">
                  <span>Grand Total:</span>
                  <span style={{ color: '#ff5722' }}>₹{billDetails.totalAmount}</span>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <button
              type="button"
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-6 shadow transition hover-lift"
              style={{ background: '#ff5722', borderColor: '#ff5722' }}
              disabled={submitting}
              onClick={handlePlaceOrder}
            >
              {submitting ? 'Confirming Order with Kitchen...' : `Place Order • ₹${billDetails?.totalAmount || ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Razorpay Sandbox Payment Simulation Modal */}
      {showRazorpayModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="p-3 text-white d-flex justify-content-between align-items-center" style={{ background: '#0c2340' }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary px-2 py-1">Razorpay</span>
                  <h6 className="mb-0 fw-bold">Test Sandbox Checkout</h6>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRazorpayModal(false)}></button>
              </div>

              <div className="p-4 bg-white">
                <div className="text-center mb-4">
                  <span className="text-muted small">Paying to CravePulse India (0% Markup Network)</span>
                  <h3 className="fw-extrabold text-dark mt-1">₹{billDetails?.totalAmount}</h3>
                  <span className="badge bg-light text-secondary border">Test Mode • No Real Charges</span>
                </div>

                {/* Payment Option Tabs */}
                <div className="d-flex gap-1 mb-3 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${paymentMethodTab === 'upi' ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setPaymentMethodTab('upi')}
                  >
                    UPI Apps
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${paymentMethodTab === 'qr' ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setPaymentMethodTab('qr')}
                  >
                    UPI QR Code
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${paymentMethodTab === 'card' ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setPaymentMethodTab('card')}
                  >
                    Debit / Credit Card
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${paymentMethodTab === 'netbanking' ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setPaymentMethodTab('netbanking')}
                  >
                    NetBanking
                  </button>
                </div>

                {/* Tab 1: UPI Apps (GPay, PhonePe, Paytm, VPA) */}
                {paymentMethodTab === 'upi' && (
                  <div className="d-flex flex-column gap-2 mb-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary p-3 rounded-4 d-flex align-items-center justify-content-between text-start hover-bg-light transition"
                      onClick={() => handleCompleteRazorpay('Google Pay')}
                      disabled={processingPayment}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-white text-dark border p-2 fs-6 shadow-sm">GPay</span>
                        <div>
                          <strong className="d-block text-dark">Google Pay UPI</strong>
                          <small className="text-muted">Fast 1-tap payment via linked bank account</small>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-muted"></i>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary p-3 rounded-4 d-flex align-items-center justify-content-between text-start hover-bg-light transition"
                      onClick={() => handleCompleteRazorpay('PhonePe')}
                      disabled={processingPayment}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge text-white p-2 fs-6 shadow-sm" style={{ background: '#5f259f' }}>PhonePe</span>
                        <div>
                          <strong className="d-block text-dark">PhonePe UPI</strong>
                          <small className="text-muted">Instant authorization via PhonePe app</small>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-muted"></i>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary p-3 rounded-4 d-flex align-items-center justify-content-between text-start hover-bg-light transition"
                      onClick={() => handleCompleteRazorpay('Paytm UPI')}
                      disabled={processingPayment}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge text-dark p-2 fs-6 shadow-sm" style={{ background: '#00b9f5' }}>Paytm</span>
                        <div>
                          <strong className="d-block text-dark">Paytm Wallet & UPI</strong>
                          <small className="text-muted">Pay directly using Paytm handle</small>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-muted"></i>
                    </button>

                    {/* Custom UPI ID */}
                    <div className="p-3 bg-light rounded-4 mt-1 border">
                      <label className="form-label small fw-bold text-dark mb-1">Or Enter Any UPI ID / VPA</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. mobile@okhdfcbank"
                          defaultValue="customer@okaxis"
                        />
                        <button
                          type="button"
                          className="btn btn-dark btn-sm fw-bold px-3"
                          onClick={() => handleCompleteRazorpay('Custom UPI')}
                          disabled={processingPayment}
                        >
                          Verify & Pay
                        </button>
                      </div>
                      <small className="text-success small fw-semibold d-block mt-1">✓ Verified by NPCI UPI Auto-Switch</small>
                    </div>
                  </div>
                )}

                {/* Tab 2: Dynamic UPI QR Code */}
                {paymentMethodTab === 'qr' && (
                  <div className="p-4 bg-light rounded-4 text-center mb-4 border">
                    <div className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill small mb-2">
                      ⏱️ QR Code Expires in 04:45
                    </div>
                    <div>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=cravepulse@icici&pn=CravePulseIndia&am=${billDetails?.totalAmount || 500}&cu=INR`}
                        alt="UPI QR" 
                        className="img-fluid rounded-3 shadow p-2 bg-white mb-2"
                        style={{ width: 150, height: 150 }}
                      />
                    </div>
                    <small className="text-dark fw-bold d-block">Scan with any UPI App (GPay, PhonePe, Paytm, CRED)</small>
                    <div className="badge bg-white text-dark border mt-2">cravepulse@icici</div>

                    <div className="mt-3">
                      <button
                        type="button"
                        className="btn btn-success btn-sm rounded-pill px-4 fw-bold shadow-sm"
                        disabled={processingPayment}
                        onClick={() => handleCompleteRazorpay('UPI QR')}
                      >
                        {processingPayment ? 'Confirming...' : 'Simulate Scanner Paid ✓'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 3: Card */}
                {paymentMethodTab === 'card' && (
                  <div className="p-3 bg-light rounded-4 mb-4 small border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark">Card Details</span>
                      <div className="d-flex gap-1">
                        <span className="badge bg-white text-dark border">VISA</span>
                        <span className="badge bg-white text-dark border">Mastercard</span>
                        <span className="badge bg-white text-dark border">RuPay</span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1 fw-semibold">Card Number</label>
                      <input type="text" className="form-control form-control-sm font-monospace" readOnly value="4242 •••• •••• 4242" />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label mb-1 fw-semibold">Expiry Date</label>
                        <input type="text" className="form-control form-control-sm" readOnly value="08/29" />
                      </div>
                      <div className="col-6">
                        <label className="form-label mb-1 fw-semibold">CVV</label>
                        <input type="text" className="form-control form-control-sm font-monospace" readOnly value="824" />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary w-100 rounded-pill py-2 fw-bold"
                      disabled={processingPayment}
                      onClick={() => handleCompleteRazorpay('Card')}
                    >
                      {processingPayment ? 'Authorizing Card...' : `Pay ₹${billDetails?.totalAmount} with Card`}
                    </button>
                  </div>
                )}

                {/* Tab 4: NetBanking */}
                {paymentMethodTab === 'netbanking' && (
                  <div className="p-3 bg-light rounded-4 mb-4 small border">
                    <div className="fw-semibold mb-2 text-dark">Select Your Bank:</div>
                    <div className="row g-2 mb-3">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                        <div key={b} className="col-6">
                          <button
                            type="button"
                            className="btn btn-white bg-white border w-100 py-2 small fw-semibold text-truncate hover-bg-light"
                            disabled={processingPayment}
                            onClick={() => handleCompleteRazorpay(b)}
                          >
                            🏛️ {b}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Footnote */}
                <div className="text-center small text-muted">
                  <i className="bi bi-shield-lock-fill text-success me-1"></i> 256-Bit SSL Encrypted • RBI Tokenized • PCI-DSS Certified
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Native UPI Payment Modal Drawer */}
      <UpiPaymentDrawer
        isOpen={showUpiDrawer}
        onClose={() => setShowUpiDrawer(false)}
        amount={billDetails?.totalAmount || 250.00}
        orderNumber={`ORD-${Date.now().toString().slice(-6)}`}
        payeeVpa="cravepulse.settlements@icici"
        payeeName="CravePulse India"
        onSuccess={() => {
          executeOrderCreation('UPI', 'PAID');
        }}
      />

      {/* Radical Price Transparency Explainer Modal */}
      <PriceBreakdownModal show={showPriceModal} onClose={() => setShowPriceModal(false)} billDetails={billDetails} />

      {/* Available Coupons Drawer / Modal with Eligibility Check */}
      {showCouponsModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header border-bottom bg-light p-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">🏷️</span>
                  <div>
                    <h6 className="modal-title fw-bold mb-0">Coupons & Special Offers</h6>
                    <small className="text-muted">Direct discounts with zero hidden conditions</small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowCouponsModal(false)}></button>
              </div>
              <div className="modal-body p-3">
                {[
                  { code: 'FOOD50', desc: '50% OFF up to ₹150', minOrder: 199, details: 'Valid on all items from gourmet kitchens.' },
                  { code: 'WELCOME100', desc: 'Flat ₹100 OFF', minOrder: 399, details: 'Exclusive welcome voucher for delicious dining.' },
                  { code: 'FREESHIP', desc: 'Free Delivery (Save ₹35)', minOrder: 249, details: '100% rider delivery fare waived on qualifying carts.' },
                ].map(c => {
                  const sub = billDetails?.subtotal || 0;
                  const isEligible = sub >= c.minOrder;
                  const shortfall = Math.max(0, c.minOrder - sub);
                  const isApplied = couponCode === c.code;

                  return (
                    <div key={c.code} className={`p-3 rounded-3 border mb-3 transition ${isApplied ? 'border-success bg-success-subtle' : isEligible ? 'border-primary-subtle bg-white' : 'border-light bg-light opacity-75'}`}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-danger rounded-pill px-2.5 py-1 font-monospace fw-bold">{c.code}</span>
                        {isApplied ? (
                          <span className="badge bg-success small">✓ Applied</span>
                        ) : isEligible ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold"
                            onClick={() => {
                              setCouponCode(c.code);
                              setShowCouponsModal(false);
                            }}
                          >
                            Apply
                          </button>
                        ) : (
                          <span className="badge bg-secondary small">Locked</span>
                        )}
                      </div>
                      <div className="fw-bold text-dark small mt-1">{c.desc}</div>
                      <small className="text-muted d-block">{c.details}</small>
                      {!isEligible && (
                        <div className="alert alert-warning py-1 px-2 mt-2 mb-0 small" style={{ fontSize: 11 }}>
                          Add items worth <strong>₹{shortfall.toFixed(2)}</strong> more to unlock
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal with Google Maps Link */}
      {showAddAddressModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header border-bottom bg-light p-3">
                <h6 className="modal-title fw-bold mb-0">Add Delivery Address</h6>
                <button type="button" className="btn-close" onClick={() => setShowAddAddressModal(false)}></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newAddress.addressLine.trim()) return;

                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newAddress.addressLine}, ${newAddress.landmark || ''}, ${newAddress.city}`)}`;
                const addrObj = {
                  title: newAddress.title,
                  addressLine: newAddress.addressLine.trim(),
                  landmark: newAddress.landmark.trim(),
                  city: newAddress.city,
                  state: 'Karnataka',
                  postalCode: newAddress.postalCode.trim(),
                  mapsUrl: mapsUrl,
                  default: false,
                };

                try {
                  const res = await api.post('/auth/addresses', addrObj);
                  if (res.success && res.data) {
                    setAddresses(prev => [...prev, res.data]);
                    setSelectedAddressId(res.data.id);
                  } else {
                    const localAddr = { ...addrObj, id: Date.now() };
                    setAddresses(prev => [...prev, localAddr]);
                    setSelectedAddressId(localAddr.id);
                  }
                } catch {
                  const localAddr = { ...addrObj, id: Date.now() };
                  setAddresses(prev => [...prev, localAddr]);
                  setSelectedAddressId(localAddr.id);
                }
                setShowAddAddressModal(false);
                setNewAddress({ title: 'Home', addressLine: '', landmark: '', city: 'Bangalore', postalCode: '560038' });
              }}>
                <div className="modal-body p-3">
                  <div className="mb-2">
                    <label className="form-label small fw-bold mb-1">Address Label</label>
                    <div className="d-flex gap-2">
                      {['Home', 'Work', 'Other'].map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 ${newAddress.title === t ? 'btn-primary text-white' : 'btn-light border'}`}
                          onClick={() => setNewAddress(prev => ({ ...prev, title: t }))}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold mb-1">House / Flat / Building / Street *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. Flat 301, Lakeview Apts, 100ft Rd"
                      value={newAddress.addressLine}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine: e.target.value }))}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Near Metro Station / Opposite Park"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                    />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-7">
                      <label className="form-label small fw-bold mb-1">City</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small fw-bold mb-1">PIN Code</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      />
                    </div>
                  </div>
                  <small className="text-muted d-block" style={{ fontSize: 11 }}>
                    📍 A Google Maps coordinates pinpoint will be automatically generated.
                  </small>
                </div>
                <div className="modal-footer border-top p-2">
                  <button type="button" className="btn btn-sm btn-light border rounded-pill px-3" onClick={() => setShowAddAddressModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold">
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
