import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import realtime from '../../services/websocket';
import { useRealtime } from '../../context/RealtimeContext';

const COLUMNS = [
  { status: 'PLACED', title: 'New Orders', badge: 'bg-danger text-white' },
  { status: 'ACCEPTED', title: 'Confirmed', badge: 'bg-warning text-dark' },
  { status: 'PREPARING', title: 'Cooking / In Prep', badge: 'bg-primary text-white' },
  { status: 'READY', title: 'Packed & Staged', badge: 'bg-success text-white' },
];

const KitchenKanban = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isThrottled, setIsThrottled] = useState(false);
  const { playAlertSound } = useRealtime();

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/restaurant/1');
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn('Error fetching kitchen orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to restaurant channel
    realtime.subscribe('restaurant:1');

    const offNewOrder = realtime.on('new_order_placed', (newOrd) => {
      setOrders(prev => [newOrd, ...prev.filter(o => o.id !== newOrd.id)]);
      playAlertSound('bell');
    });

    const offStatus = realtime.on('order_status_updated', (payload) => {
      setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status } : o));
    });

    return () => {
      realtime.unsubscribe('restaurant:1');
      offNewOrder();
      offStatus();
    };
  }, []);

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    try {
      const res = await api.post(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      }
    } catch (e) {
      alert(e.message || 'Error updating status');
    }
  };

  const handleToggleThrottle = async () => {
    try {
      const res = await api.post('/restaurants/1/toggle-throttle', { throttled: !isThrottled });
      if (res.success) {
        setIsThrottled(!isThrottled);
      }
    } catch (e) {
      console.error('Throttle error', e);
    }
  };

  return (
    <div>
      {/* Top Controls Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold mb-1">Live Kitchen Kanban Board</h4>
          <p className="text-muted small mb-0">Drag or tap orders to advance through real-time kitchen preparation stages.</p>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Overload Protection Manual Throttle Toggle */}
          <div className="card border-0 rounded-pill px-3 py-1 shadow-sm bg-white d-flex flex-row align-items-center gap-2">
            <span className="small fw-bold">Overload Auto-Throttle:</span>
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${isThrottled ? 'btn-danger' : 'btn-outline-success'}`}
              onClick={handleToggleThrottle}
            >
              {isThrottled ? '🔴 Throttle ACTIVE (Paused)' : '🟢 Normal Acceptance'}
            </button>
          </div>
          <button className="btn btn-outline-secondary rounded-pill btn-sm px-3" onClick={fetchOrders}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
        </div>
      ) : (
        <div className="row g-3">
          {COLUMNS.map(col => {
            const colOrders = orders.filter(o => o.status === col.status);

            return (
              <div key={col.status} className="col-12 col-md-6 col-xl-3">
                <div className="card border-0 rounded-4 shadow-sm bg-light h-100 p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">{col.title}</h6>
                    <span className={`badge ${col.badge} rounded-pill`}>{colOrders.length}</span>
                  </div>

                  <div className="d-flex flex-column gap-3" style={{ minHeight: 450 }}>
                    {colOrders.length === 0 ? (
                      <div className="text-center py-5 text-muted small">No orders in this stage</div>
                    ) : (
                      colOrders.map(ord => (
                        <div key={ord.id} className="card border-0 rounded-3 shadow-sm p-3 bg-white">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="fw-bold text-dark">{ord.orderNumber}</span>
                            <span className="badge bg-light text-dark border small">₹{ord.totalAmount}</span>
                          </div>

                          <div className="small text-muted mb-2">
                            {ord.items?.map((it, idx) => (
                              <div key={idx} className="d-flex justify-content-between">
                                <span>{it.quantity}x {it.itemName}</span>
                                {it.variantName && <small className="text-muted">({it.variantName})</small>}
                              </div>
                            ))}
                          </div>

                          {ord.specialInstructions && (
                            <div className="p-2 bg-light rounded-2 border small text-muted mb-2" style={{ fontSize: 11 }}>
                              <strong>Note:</strong> {ord.specialInstructions}
                            </div>
                          )}

                          {/* Action button based on stage */}
                          <div className="mt-2 pt-2 border-top">
                            {ord.status === 'PLACED' && (
                              <button
                                className="btn btn-sm btn-warning w-100 rounded-pill fw-bold"
                                onClick={() => handleAdvanceStatus(ord.id, 'ACCEPTED')}
                              >
                                Accept Order ✓
                              </button>
                            )}
                            {ord.status === 'ACCEPTED' && (
                              <button
                                className="btn btn-sm btn-primary w-100 rounded-pill fw-bold"
                                onClick={() => handleAdvanceStatus(ord.id, 'PREPARING')}
                              >
                                Start Cooking 🔥
                              </button>
                            )}
                            {ord.status === 'PREPARING' && (
                              <button
                                className="btn btn-sm btn-success w-100 rounded-pill fw-bold"
                                onClick={() => handleAdvanceStatus(ord.id, 'READY')}
                              >
                                Mark Food Ready 🍱
                              </button>
                            )}
                            {ord.status === 'READY' && (
                              <div className="text-center small text-muted py-1">
                                <i className="bi bi-clock-history me-1"></i> Waiting for rider pickup...
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenKanban;
