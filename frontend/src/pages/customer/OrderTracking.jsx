import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import realtime from '../../services/websocket';
import LiveMap from '../../components/LiveMap';
import DisputeModal from './DisputeModal';
import ModalPortal from '../../components/ModalPortal';

const STAGES = [
  { key: 'PLACED', label: 'Order Placed', icon: 'bi-check2-circle' },
  { key: 'ACCEPTED', label: 'Confirmed', icon: 'bi-check-all' },
  { key: 'PREPARING', label: 'In Kitchen', icon: 'bi-fire' },
  { key: 'READY', label: 'Food Packed', icon: 'bi-box2-heart' },
  { key: 'PICKED_UP', label: 'Out for Delivery', icon: 'bi-bicycle' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'bi-house-check-fill' },
];

const OrderTracking = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderCoords, setRiderCoords] = useState([12.9740, 77.6370]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Placed order by mistake');
  const [cancelling, setCancelling] = useState(false);

  // Live Chat & Communication State (User <-> Rider & User <-> Kitchen)
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatTarget, setChatTarget] = useState('RIDER'); // 'RIDER' | 'KITCHEN'
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Review Form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [foodRating, setFoodRating] = useState(5);
  const [packagingRating, setPackagingRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${order.id}/status`, {
        status: 'CANCELLED',
        reason: cancelReason,
      });
    } catch (e) {
      // optimistic
    }
    setOrder(prev => ({
      ...prev,
      status: 'CANCELLED',
      cancellationReason: cancelReason,
    }));
    setCancelling(false);
    setShowCancelModal(false);
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/number/${orderNumber}`);
      if (res.success && res.data) {
        setOrder(res.data);
        return;
      }
    } catch (e) {
      console.warn('API error fetching order:', e);
    } finally {
      setLoading(false);
    }

    // Only fallback to simulated preview if demo mode is explicitly enabled
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      setOrder(prev => prev || {
        id: 99,
        orderNumber: orderNumber,
        restaurantName: 'Spice Symphony & Grill',
        restaurantPhone: '+91 98490 11223',
        restaurantLat: 12.9715987,
        restaurantLng: 77.6350000,
        deliveryAddress: 'Apartment 402, Sunshine Heights, 12th Main Road, Indiranagar',
        deliveryLat: 12.9783692,
        deliveryLng: 77.6408356,
        status: 'PICKED_UP',
        subtotal: 560.00,
        couponDiscount: 50.00,
        packagingFee: 15.00,
        deliveryFee: 35.00,
        platformFee: 5.00,
        gstTax: 26.25,
        totalAmount: 591.25,
        paymentMode: 'COD',
        paymentStatus: 'PENDING',
        deliveryOtp: '4829',
        etaMinMinutes: 18,
        etaMaxMinutes: 28,
        riderName: 'Delivery Captain',
        riderPhone: '+91 98490 56789',
        items: [
          { id: 1, itemName: 'Hyderabadi Chicken Biryani', quantity: 1, totalPrice: 320.00, variantName: 'Half (1 Person)' },
          { id: 2, itemName: 'Paneer Butter Masala', quantity: 1, totalPrice: 240.00 }
        ]
      });
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  // Smooth live GPS rider movement animation along route
  useEffect(() => {
    let progress = 0.2;
    const animInterval = setInterval(() => {
      progress = (progress + 0.04) % 1.0;
      const startLat = 12.9715987;
      const startLng = 77.6350000;
      const destLat = 12.9783692;
      const destLng = 77.6408356;
      const curLat = startLat + (destLat - startLat) * progress;
      const curLng = startLng + (destLng - startLng) * progress;
      setRiderCoords([curLat, curLng]);
    }, 3000);
    return () => clearInterval(animInterval);
  }, []);

  useEffect(() => {
    if (!order?.id) return;

    realtime.subscribe(`order:${order.id}`);

    // Load persisted chat message history
    api.get(`/orders/${order.id}/messages`).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setChatMessages(res.data);
      }
    }).catch(() => {});

    const offStatus = realtime.on('order_status_updated', (payload) => {
      if (payload.orderId === order.id) {
        setOrder(prev => ({ ...prev, status: payload.status }));
      }
    });

    const offTelemetry = realtime.on('rider_location_updated', (payload) => {
      if (payload.orderId === order.id) {
        setRiderCoords([payload.latitude, payload.longitude]);
      }
    });

    const offChat = realtime.on('new_chat_message', (payload) => {
      if (payload.orderId === order.id) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      }
    });

    return () => {
      realtime.unsubscribe(`order:${order.id}`);
      offStatus();
      offTelemetry();
      offChat();
    };
  }, [order?.id]);

  const handleSubmitReview = async () => {
    try {
      const res = await api.post('/reviews', {
        orderId: order.id,
        foodRating,
        packagingRating,
        deliveryRating,
        reviewText,
      });
      if (res.success) {
        setReviewSubmitted(true);
        setShowReviewModal(false);
      }
    } catch (e) {
      alert(e.message || 'Error submitting review');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Connecting to live tracking satellite...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h4>Order not found</h4>
        <Link to="/" className="btn btn-primary mt-3">Back to Home</Link>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.key === order.status);

  const handleSendMessage = async (textToSend) => {
    const msg = (textToSend || chatInput).trim();
    if (!msg || !order?.id) return;

    setChatInput('');
    try {
      const res = await api.post(`/orders/${order.id}/messages`, {
        messageText: msg,
        recipientRole: chatTarget === 'RIDER' ? 'RIDER' : 'RESTAURANT'
      });
      if (res.success && res.data) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (e) {
      console.error('Error sending order chat message', e);
    }
  };

  return (
    <div className="container py-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-extrabold mb-0">Live Order Tracking</h4>
            <span className="badge bg-light text-dark border small">{order.orderNumber}</span>
          </div>
          <small className="text-muted">From: <strong>{order.restaurantName}</strong></small>
        </div>

        <div className="d-flex gap-2">
          <Link
            to={`/orders/${order.orderNumber || order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold"
          >
            <i className="bi bi-printer me-1"></i> Tax Invoice
          </Link>
          {['PLACED', 'ACCEPTED'].includes(order.status) && (
            <button
              className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
              onClick={() => setShowCancelModal(true)}
            >
              <i className="bi bi-x-circle me-1"></i> Cancel Order
            </button>
          )}
          <button
            className="btn btn-outline-danger btn-sm rounded-pill px-3"
            onClick={() => setShowDisputeModal(true)}
          >
            <i className="bi bi-shield-exclamation me-1"></i> Instant Dispute
          </button>
        </div>
      </div>

      {/* 4-Digit Delivery OTP Card */}
      {order.deliveryOtp && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-primary-subtle text-primary border border-primary-subtle d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center shadow-sm" style={{ width: 44, height: 44 }}>
              <i className="bi bi-key-fill fs-5"></i>
            </div>
            <div>
              <div className="small fw-semibold text-muted text-uppercase">Delivery Verification OTP</div>
              <small className="text-muted">Share this code with your delivery captain upon package handover</small>
            </div>
          </div>
          <div className="badge bg-white text-primary border border-primary-subtle fs-4 font-monospace px-3 py-1 shadow-sm">
            {order.deliveryOtp}
          </div>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="alert alert-danger border-danger rounded-4 p-4 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <div className="fs-1 text-danger">✕</div>
            <div>
              <h5 className="fw-bold mb-1">Order Has Been Cancelled</h5>
              <p className="small mb-1">
                Reason: <strong>{order.cancellationReason || 'Cancelled by customer'}</strong>
              </p>
              <div className="badge bg-danger text-white px-3 py-2 rounded-pill small">
                ✓ 100% Refund Initiated: ₹{order.totalAmount} credited to original payment source / CravePulse Wallet
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Progress Rail & Live Telemetry Map */}
        <div className="col-lg-8">
          {/* Status Progress Rail */}
          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <span className="text-muted small text-uppercase fw-bold">Live Status</span>
                <h5 className="fw-bold mb-0 text-primary" style={{ color: 'var(--c-primary)' }}>
                  {STAGES.find(s => s.key === order.status)?.label || order.status}
                </h5>
              </div>
              <div className="text-end">
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-3 py-2 rounded-pill fw-bold">
                  Est. Delivery: {order.etaMinMinutes}-{order.etaMaxMinutes} Mins
                </span>
              </div>
            </div>

            {/* Step rail bar */}
            <div className="d-flex justify-content-between position-relative px-2">
              <div
                className="position-absolute top-50 start-0 translate-middle-y bg-light"
                style={{ height: 4, width: '100%', zIndex: 0 }}
              >
                <div
                  className="bg-primary h-100 transition"
                  style={{
                    width: `${Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 100)}%`,
                    background: 'var(--c-primary)',
                  }}
                ></div>
              </div>

              {STAGES.map((st, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={st.key} className="text-center z-1" style={{ width: 60 }}>
                    <div
                      className={`rounded-circle mx-auto d-flex align-items-center justify-content-center shadow-sm ${
                        isCurrent ? 'bg-primary text-white pulse-active' : isPassed ? 'bg-primary text-white' : 'bg-white text-muted border'
                      }`}
                      style={{
                        width: 38,
                        height: 38,
                        background: isPassed ? 'var(--c-primary)' : '#fff',
                        borderColor: isPassed ? 'var(--c-primary)' : '#e2e8f0',
                      }}
                    >
                      <i className={`bi ${st.icon}`}></i>
                    </div>
                    <small className={`d-none d-md-block mt-2 ${isCurrent ? 'fw-bold text-dark' : 'text-muted'}`} style={{ fontSize: 11 }}>
                      {st.label}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live OpenStreetMap Leaflet View */}
          <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2 px-2">
              <span className="small fw-bold text-secondary">
                <i className="bi bi-broadcast text-danger me-1"></i> Live Rider Telemetry Stream
              </span>
              <span className="badge bg-light text-dark border small">OpenStreetMap • Leaflet</span>
            </div>
            <LiveMap
              restaurantCoords={[order.restaurantLat || 12.9715, order.restaurantLng || 77.6350]}
              deliveryCoords={[order.deliveryLat || 12.9783, order.deliveryLng || 77.6408]}
              riderCoords={riderCoords}
              riderName={order.riderName || 'Vikram Singh'}
              height="380px"
            />
          </div>

          {/* SLA Goodwill Delay Guarantee Banner */}
          <div className="p-3 bg-light rounded-4 border d-flex align-items-center gap-3">
            <span className="fs-3">🛡️</span>
            <div>
              <div className="fw-bold small">Honest Delivery SLA Guarantee</div>
              <small className="text-muted">
                If your order arrives more than 10 minutes past the estimated delivery window, our automated SLA monitor deposits an instant <strong>₹50 goodwill credit</strong> into your wallet.
              </small>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details & Dual Contact Cards */}
        <div className="col-lg-4">
          {/* 1. Delivery Rider Info & Contact Card */}
          {order.riderName && (
            <div className="card border-0 rounded-4 shadow-sm p-3 mb-3 bg-white">
              <span className="small text-muted fw-bold text-uppercase mb-2 d-block">🛵 Delivery Partner</span>
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
                  alt={order.riderName}
                  className="rounded-circle border"
                  style={{ width: 52, height: 52, objectFit: 'cover' }}
                />
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 text-dark">{order.riderName}</h6>
                  <small className="text-muted d-block">★ 5.0 • 420+ deliveries</small>
                  <small className="text-success fw-bold">Ather 450X EV Scooter</small>
                </div>
              </div>

              <div className="d-flex gap-2">
                <a
                  href="tel:+918047483333"
                  title="Masked Calling Proxy (+91 80 4748 3333)"
                  className="btn btn-outline-success flex-grow-1 rounded-pill btn-sm fw-bold d-flex align-items-center justify-content-center gap-1"
                >
                  <i className="bi bi-shield-shaded"></i> Call Rider (Masked)
                </a>
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1 rounded-pill btn-sm fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
                  onClick={() => {
                    setChatTarget('RIDER');
                    setShowChatModal(true);
                  }}
                >
                  <i className="bi bi-chat-dots-fill"></i> Chat with Rider
                </button>
              </div>
            </div>
          )}

          {/* 2. Restaurant / Kitchen Contact Card */}
          <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
            <span className="small text-muted fw-bold text-uppercase mb-2 d-block">🍳 Restaurant & Kitchen</span>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="rounded-circle bg-warning-subtle text-warning-emphasis fw-bold d-flex align-items-center justify-content-center border"
                style={{ width: 52, height: 52, fontSize: 22 }}
              >
                👨‍🍳
              </div>
              <div className="flex-grow-1">
                <h6 className="fw-bold mb-0 text-dark">{order.restaurantName || 'Restaurant'}</h6>
                <small className="text-muted d-block">Kitchen Partner • Order Desk</small>
                <small className="text-primary fw-semibold">100% Dine-In Menu Parity</small>
              </div>
            </div>

            <div className="d-flex gap-2">
              <a
                href="tel:+918047483333"
                title="Masked Calling Proxy (+91 80 4748 3333)"
                className="btn btn-outline-secondary flex-grow-1 rounded-pill btn-sm fw-bold d-flex align-items-center justify-content-center gap-1"
              >
                <i className="bi bi-shield-shaded"></i> Call Kitchen (Masked)
              </a>
              <button
                type="button"
                className="btn btn-outline-primary flex-grow-1 rounded-pill btn-sm fw-bold d-flex align-items-center justify-content-center gap-1"
                onClick={() => {
                  setChatTarget('KITCHEN');
                  setShowChatModal(true);
                }}
              >
                <i className="bi bi-chat-text-fill"></i> Note to Kitchen
              </button>
            </div>
          </div>

          {/* Order Bill Summary */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <h6 className="fw-bold mb-3">Items in Order</h6>
            <div className="list-group list-group-flush mb-3">
              {order.items?.map(it => (
                <div key={it.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="small fw-semibold">{it.itemName} x {it.quantity}</div>
                    {it.variantName && <small className="text-muted d-block">{it.variantName}</small>}
                  </div>
                  <span className="small fw-bold">₹{it.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="border-top pt-2 small">
              <div className="d-flex justify-content-between py-1 text-muted">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="d-flex justify-content-between py-1 text-success fw-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{order.couponDiscount}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-1 text-muted">
                <span>Packaging & Delivery</span>
                <span>₹{Number(order.packagingFee) + Number(order.deliveryFee)}</span>
              </div>
              <div className="d-flex justify-content-between py-1 text-muted">
                <span>Taxes & Platform</span>
                <span>₹{Number(order.gstTax) + Number(order.platformFee)}</span>
              </div>
              <div className="d-flex justify-content-between py-2 mt-2 border-top fs-6 fw-bold">
                <span>Total Amount ({order.paymentMode}):</span>
                <span className="text-primary" style={{ color: 'var(--c-primary)' }}>₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Delivered Review Trigger */}
            {order.status === 'DELIVERED' && !reviewSubmitted && (
              <button
                className="btn btn-warning w-100 mt-3 rounded-pill fw-bold"
                onClick={() => setShowReviewModal(true)}
              >
                ★ Review Food, Packaging & Delivery
              </button>
            )}

            {reviewSubmitted && (
              <div className="alert alert-success mt-3 py-2 text-center small rounded-3">
                ✓ Thank you! Your 3-way rating has been recorded.
              </div>
            )}

            {/* Instant Dispute Resolution Action Card */}
            <div className="card border-0 rounded-4 shadow-sm p-3 mt-3 bg-white border-start border-4 border-danger">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="badge bg-danger-subtle text-danger fw-bold small">
                  <i className="bi bi-shield-lock-fill me-1"></i> Escrow Protection
                </span>
                <span className="small text-muted" style={{ fontSize: 11 }}>Instant Refund</span>
              </div>
              <h6 className="fw-bold mb-1 text-dark">Issue with this order?</h6>
              <p className="text-muted small mb-3">
                Missing dish, crushed box, or spillage? Request an instant automated refund or replacement with zero wait time.
              </p>
              <button
                type="button"
                className="btn btn-outline-danger w-100 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm transition hover-lift"
                onClick={() => setShowDisputeModal(true)}
              >
                <i className="bi bi-shield-exclamation"></i>
                <span>Instant Dispute Resolution</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Dispute Modal */}
      <DisputeModal
        show={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        order={order}
      />

      {/* Review Modal */}
      {showReviewModal && (
        <ModalPortal isOpen={showReviewModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowReviewModal(false); }}
          >
            <div className="cravepulse-modal-dialog">
              <div className="modal-content rounded-4 border-0 p-4 shadow-2xl bg-white">
                <h5 className="fw-bold mb-3">Rate Your CravePulse Delivery</h5>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Food Taste & Freshness (1-5★)</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`btn btn-sm ${foodRating >= star ? 'btn-warning text-white' : 'btn-light border'}`}
                        onClick={() => setFoodRating(star)}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Packaging & Temperature Integrity (1-5★)</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`btn btn-sm ${packagingRating >= star ? 'btn-warning text-white' : 'btn-light border'}`}
                        onClick={() => setPackagingRating(star)}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Delivery Partner Speed & Courteousness (1-5★)</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`btn btn-sm ${deliveryRating >= star ? 'btn-warning text-white' : 'btn-light border'}`}
                        onClick={() => setDeliveryRating(star)}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Comments / Feedback</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Share details about the flavor, temperature, or rider service..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowReviewModal(false)}>Cancel</button>
                  <button className="btn btn-primary rounded-pill px-4 fw-bold shadow" onClick={handleSubmitReview}>Submit Rating</button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
      {/* Cancellation Modal */}
      {showCancelModal && (
        <ModalPortal isOpen={showCancelModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCancelModal(false); }}
          >
            <div className="cravepulse-modal-dialog">
              <div className="modal-content border-0 rounded-4 shadow-2xl p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark">Cancel Order {order.orderNumber}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
                </div>

                <div className="p-3 bg-light rounded-3 mb-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Total Paid:</span>
                    <strong className="text-dark">₹{order.totalAmount}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-success fw-bold">
                    <span>Refund Amount:</span>
                    <span>100% (₹{order.totalAmount})</span>
                  </div>
                  <small className="text-muted d-block mt-2">
                    ✓ Instant 100% refund credited back to your original payment method or CravePulse Wallet.
                  </small>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-dark">Select Cancellation Reason *</label>
                  <select
                    className="form-select"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="Placed order by mistake">Placed order by mistake</option>
                    <option value="Delivery time is longer than expected">Delivery time is longer than expected</option>
                    <option value="Need to modify delivery address or food dishes">Need to modify delivery address or food dishes</option>
                    <option value="Found better dining alternative">Found better dining alternative</option>
                    <option value="Other personal reason">Other personal reason</option>
                  </select>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4 fw-bold shadow"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 3. Interactive Live Chat & Communication Modal */}
      {showChatModal && (
        <ModalPortal isOpen={showChatModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowChatModal(false); }}
          >
            <div className="cravepulse-modal-dialog">
              <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
                {/* Modal Header with Target Tabs */}
                <div className="modal-header border-0 bg-light p-3 pb-2 d-flex flex-column align-items-start">
                  <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success p-1 rounded-circle" style={{ width: 10, height: 10 }}></span>
                      <h6 className="fw-bold mb-0 text-dark">Live Conversation Channel</h6>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setShowChatModal(false)}></button>
                  </div>

                  {/* Target Toggle Tabs */}
                  <div className="d-flex gap-2 w-100">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${chatTarget === 'RIDER' ? 'btn-primary text-white' : 'btn-white border text-dark'}`}
                      style={chatTarget === 'RIDER' ? { background: '#ff5c35', borderColor: '#ff5c35' } : {}}
                      onClick={() => setChatTarget('RIDER')}
                    >
                      🛵 {order.riderName || 'Delivery Partner'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${chatTarget === 'KITCHEN' ? 'btn-primary text-white' : 'btn-white border text-dark'}`}
                      style={chatTarget === 'KITCHEN' ? { background: '#ff5c35', borderColor: '#ff5c35' } : {}}
                      onClick={() => setChatTarget('KITCHEN')}
                    >
                      🍳 {order.restaurantName || 'Kitchen Partner'}
                    </button>
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="modal-body p-3" style={{ height: 320, overflowY: 'auto', background: '#f8fafc' }}>
                  <div className="text-center my-2">
                    <span className="badge bg-white text-muted border small px-3 py-1 rounded-pill" style={{ fontSize: 10 }}>
                      Direct Encrypted Channel • Order {order.orderNumber}
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-2 mt-3">
                    {chatMessages
                      .filter(m => {
                        const sRole = m.senderRole || m.sender;
                        const rRole = m.recipientRole;
                        if (chatTarget === 'RIDER') {
                          return sRole === 'RIDER' || rRole === 'RIDER' || (!sRole && !rRole);
                        } else {
                          return sRole === 'RESTAURANT' || rRole === 'RESTAURANT' || sRole === 'KITCHEN' || rRole === 'KITCHEN';
                        }
                      })
                      .map((msg) => {
                        const sRole = msg.senderRole || msg.sender;
                        const isMe = sRole === 'CUSTOMER';
                        const senderDisplayName = isMe
                          ? 'You'
                          : (sRole === 'RIDER' ? (order.riderName || 'Delivery Partner') : (order.restaurantName || 'Kitchen Staff'));
                        const formattedTime = msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : (msg.time || 'Just now');

                        return (
                          <div
                            key={msg.id || Math.random()}
                            className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}
                          >
                            <small className="text-muted mb-1" style={{ fontSize: 10 }}>
                              {senderDisplayName} • {formattedTime}
                            </small>
                            <div
                              className={`p-3 rounded-4 shadow-sm small ${
                                isMe
                                  ? 'bg-primary text-white rounded-bottom-end-0'
                                  : 'bg-white text-dark border rounded-bottom-start-0'
                              }`}
                              style={{
                                maxWidth: '82%',
                                background: isMe ? 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)' : '#fff'
                              }}
                            >
                              {msg.messageText || msg.text}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Quick Prompt Chips */}
                <div className="p-2 bg-light border-top border-bottom overflow-auto d-flex gap-1" style={{ scrollbarWidth: 'none' }}>
                  {(chatTarget === 'RIDER' ? [
                    'Where are you now? 📍',
                    'Please leave at the security gate 👍',
                    'Please do not ring the bell 🤫',
                    'I am waiting in the lobby 🚪'
                  ] : [
                    'Please make it extra spicy 🌶️',
                    'Please do not forget tissues & cutlery 🍴',
                    'Pack hot please 🍲',
                    'Is the food packed yet? ⏱️'
                  ]).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-sm btn-white border rounded-pill px-2 py-1 text-nowrap small text-muted hover-text-dark"
                      style={{ fontSize: 11 }}
                      onClick={() => handleSendMessage(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Message Input Box */}
                <div className="p-3 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="d-flex gap-2"
                  >
                    <input
                      type="text"
                      className="form-control rounded-pill border"
                      placeholder={`Message ${chatTarget === 'RIDER' ? (order.riderName || 'Rider') : (order.restaurantName || 'Kitchen')}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center"
                      style={{ width: 40, height: 40, background: '#ff5c35', borderColor: '#ff5c35' }}
                    >
                      <i className="bi bi-send-fill text-white"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default OrderTracking;
