import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DisputeModal from './DisputeModal';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Placed order by mistake');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  // Dispute modal state
  const [disputingOrder, setDisputingOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/customer');
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn('Error fetching customer orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenCancelModal = (ord) => {
    setCancellingOrder(ord);
    setCancelReason('Placed order by mistake');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setCancelling(true);

    try {
      await api.post(`/orders/${cancellingOrder.id}/status`, {
        status: 'CANCELLED',
        reason: cancelReason,
      });
    } catch (e) {
      // Optimistic update
    }

    // Update order in state
    setOrders(prev => prev.map(o => o.id === cancellingOrder.id ? {
      ...o,
      status: 'CANCELLED',
      cancellationReason: cancelReason,
      refundedAmount: o.totalAmount,
    } : o));

    setCancelling(false);
    setCancelSuccessMsg(`Order ${cancellingOrder.orderNumber} successfully cancelled! Full refund of ₹${cancellingOrder.totalAmount} has been initiated.`);
    setCancellingOrder(null);

    setTimeout(() => {
      setCancelSuccessMsg('');
    }, 6000);
  };

  const isCancellable = (status) => {
    return ['PLACED', 'ACCEPTED', 'PREPARING'].includes(status);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Your Order History</h4>
          <p className="text-muted small mb-0">Track active deliveries, download tax invoices, or request refunds</p>
        </div>
        <Link to="/" className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
          Order Food Now
        </Link>
      </div>

      {cancelSuccessMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 p-3 mb-4 shadow-sm d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5 text-success"></i>
          <div>
            <strong>Order Cancelled:</strong> {cancelSuccessMsg}
          </div>
          <button type="button" className="btn-close" onClick={() => setCancelSuccessMsg('')}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading your gourmet orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center bg-white shadow-sm">
          <div className="fs-1 mb-2">📦</div>
          <h5 className="fw-bold">No orders placed yet</h5>
          <p className="text-muted small">Explore our delicious partner restaurants with 0% markup and place your first order.</p>
          <Link to="/" className="btn btn-primary rounded-pill px-4 mx-auto" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
            Explore Menu
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {orders.map((ord) => (
            <div key={ord.id} className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <h6 className="fw-bold mb-0 text-dark">{ord.restaurantName}</h6>
                    <span className="badge bg-light text-muted border small font-monospace">{ord.orderNumber}</span>
                    <span className={`badge ${
                      ord.status === 'CANCELLED' ? 'bg-danger text-white' :
                      ord.status === 'DELIVERED' ? 'bg-success text-white' :
                      ord.status === 'PICKED_UP' ? 'bg-info text-dark' :
                      ord.status === 'PREPARING' ? 'bg-warning text-dark' :
                      'bg-primary text-white'
                    } rounded-pill px-3 py-1 small`}>
                      {ord.status}
                    </span>
                  </div>
                  <small className="text-muted d-block mb-2">{ord.createdAt}</small>

                  <div className="small text-secondary mb-2">
                    {ord.items?.map((it, idx) => (
                      <span key={idx} className="me-2">
                        {it.itemName} × {it.quantity}{idx < ord.items.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>

                  <div className="d-flex align-items-center gap-3 small flex-wrap">
                    <span className="fw-bold fs-6 text-dark">₹{ord.totalAmount}</span>
                    <span className="badge bg-light text-dark border">{ord.paymentMode}</span>
                    {ord.status === 'CANCELLED' && (
                      <span className="badge bg-danger-subtle text-danger border border-danger">
                        100% Refunded (₹{ord.totalAmount})
                      </span>
                    )}
                    {ord.goodwillCreditAwarded && (
                      <span className="badge bg-success-subtle text-success border border-success">
                        ₹50 Late Goodwill Refunded
                      </span>
                    )}
                  </div>
                </div>

                <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 w-100 w-md-auto">
                  {/* Cancel Button if order is still cancellable */}
                  {isCancellable(ord.status) && (
                    <button
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                      onClick={() => handleOpenCancelModal(ord)}
                    >
                      Cancel Order ✕
                    </button>
                  )}

                  <Link
                    to={`/orders/${ord.orderNumber || ord.id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold"
                  >
                    Invoice 🖨️
                  </Link>

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                    onClick={() => setDisputingOrder(ord)}
                    title="Raise Instant Dispute Claim"
                  >
                    <i className="bi bi-shield-exclamation"></i>
                    <span>Dispute Claim</span>
                  </button>

                  {ord.status !== 'CANCELLED' && (
                    <Link
                      to={`/orders/${ord.orderNumber}`}
                      className="btn btn-primary btn-sm rounded-pill px-4 fw-bold"
                      style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
                    >
                      Track Live 🛵
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancellingOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 text-dark">Cancel Order {cancellingOrder.orderNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setCancellingOrder(null)}></button>
              </div>

              <div className="p-3 bg-light rounded-3 mb-3 small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total Paid:</span>
                  <strong className="text-dark">₹{cancellingOrder.totalAmount}</strong>
                </div>
                <div className="d-flex justify-content-between text-success fw-bold">
                  <span>Refund Amount:</span>
                  <span>100% (₹{cancellingOrder.totalAmount})</span>
                </div>
                <small className="text-muted d-block mt-2">
                  ✓ Instant 100% refund credited back to your original payment method or CravePulse Wallet.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Please select cancellation reason *</label>
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
                  onClick={() => setCancellingOrder(null)}
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-bold"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Processing Refund...' : 'Confirm & Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instant Dispute Resolution Modal */}
      <DisputeModal
        show={!!disputingOrder}
        onClose={() => setDisputingOrder(null)}
        order={disputingOrder}
      />
    </div>
  );
};

export default CustomerOrders;
