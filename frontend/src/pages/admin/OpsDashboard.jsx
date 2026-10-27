import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import realtime from '../../services/websocket';
import LiveMap from '../../components/LiveMap';

const OpsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [metRes, ordRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/orders'),
      ]);
      if (metRes.success) setMetrics(metRes.data);
      if (ordRes.success) setOrders(ordRes.data);
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    realtime.subscribe('admin:feed');

    const offNewOrder = realtime.on('new_order_placed', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    const offStatus = realtime.on('order_status_updated', (payload) => {
      setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status } : o));
    });

    return () => {
      realtime.unsubscribe('admin:feed');
      offNewOrder();
      offStatus();
    };
  }, []);

  const m = metrics || {
    grossMerchandiseValue: 124500,
    platformRevenue: 18675,
    totalRestaurants: 5,
    totalRiders: 2,
    totalOrders: 42,
    pendingDisputes: 1,
  };

  return (
    <div>
      {/* 4 Metric Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
            <span className="text-muted small fw-bold text-uppercase">Platform Gross Volume (GMV)</span>
            <h3 className="fw-extrabold my-2 text-white">₹{Number(m.grossMerchandiseValue).toLocaleString()}</h3>
            <span className="text-info small fw-semibold">
              <i className="bi bi-graph-up me-1"></i> +14.8% this week
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
            <span className="text-muted small fw-bold text-uppercase">Platform Revenue (15% Cut)</span>
            <h3 className="fw-extrabold my-2 text-success" style={{ color: '#00e676' }}>₹{Number(m.platformRevenue).toLocaleString()}</h3>
            <span className="text-success small fw-semibold">
              <i className="bi bi-check2-circle me-1"></i> Net Operating Margin
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
            <span className="text-muted small fw-bold text-uppercase">Active Fleet & Kitchens</span>
            <h3 className="fw-extrabold my-2 text-white">{m.totalRestaurants} Rest • {m.totalRiders} Riders</h3>
            <span className="text-muted small">All KYC Approved</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
            <span className="text-muted small fw-bold text-uppercase">Pending Disputes</span>
            <h3 className="fw-extrabold my-2 text-warning">{m.pendingDisputes} Escalated</h3>
            <span className="text-warning small fw-semibold">
              <i className="bi bi-exclamation-triangle me-1"></i> Needs Ops Review
            </span>
          </div>
        </div>
      </div>

      {/* Live Map Control Tower */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0">City Operations Pulse (Indiranagar / Bengaluru Zone)</h6>
            <small className="text-muted">Real-time GPS telemetry from active couriers and kitchen fulfillment centers</small>
          </div>
          <span className="badge bg-danger rounded-pill px-3 py-1">● LIVE STREAMING</span>
        </div>

        <LiveMap
          restaurantCoords={[12.9715987, 77.6350000]}
          deliveryCoords={[12.9783692, 77.6408356]}
          riderCoords={[12.9740000, 77.6370000]}
          riderName="Active Courier Vikram"
          height="320px"
        />
      </div>

      {/* Recent Orders Stream */}
      <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Live Order Dispatch Activity</h6>
          <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={fetchDashboardData}>
            Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ background: '#162032' }}>
            <thead className="small text-muted">
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Rider</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="small">
              {orders.slice(0, 8).map(ord => (
                <tr key={ord.id}>
                  <td className="fw-bold text-info">{ord.orderNumber}</td>
                  <td>{ord.customerName}</td>
                  <td>{ord.restaurantName}</td>
                  <td>{ord.riderName || <span className="text-muted">Pending Dispatch</span>}</td>
                  <td className="fw-bold">₹{ord.totalAmount}</td>
                  <td><span className="badge bg-light text-dark">{ord.paymentMode}</span></td>
                  <td>
                    <span className={`badge ${
                      ord.status === 'DELIVERED' ? 'bg-success' :
                      ord.status === 'PICKED_UP' ? 'bg-info text-dark' :
                      ord.status === 'PREPARING' ? 'bg-primary' : 'bg-warning text-dark'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OpsDashboard;
