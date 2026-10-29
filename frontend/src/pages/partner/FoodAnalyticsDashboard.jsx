import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../services/api';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '30days', label: 'Last 30 Days' },
  { key: 'allTime', label: 'All Time' },
];

const FoodAnalyticsDashboard = () => {
  const { restaurant } = useOutletContext();
  const restId = restaurant?.id;

  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [ledgerOrders, setLedgerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadToast, setDownloadToast] = useState('');

  const fetchAnalytics = async () => {
    if (!restId) return;
    try {
      setLoading(true);
      const [resAnalytics, resOrders] = await Promise.all([
        api.get(`/restaurants/${restId}/analytics`),
        api.get(`/orders/restaurant/${restId}`)
      ]);

      if (resAnalytics.success && resAnalytics.data) {
        setAnalytics(resAnalytics.data);
      }
      if (resOrders.success && Array.isArray(resOrders.data)) {
        const mapped = resOrders.data.map(o => {
          const amt = Number(o.totalAmount || o.subtotal || 0);
          const commRate = (restaurant?.commissionRate || 15) / 100;
          const comm = amt * commRate;
          const payout = amt - comm;
          return {
            id: o.orderNumber || `ORD-${o.id}`,
            customer: o.customerName || `Customer #${o.customerId || ''}`,
            items: Array.isArray(o.items) ? o.items.map(i => `${i.itemName} x${i.quantity}`).join(', ') : 'Fresh Order',
            amount: amt,
            comm: comm,
            payout: payout,
            status: o.status,
            time: o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'
          };
        });
        setLedgerOrders(mapped);
      }
    } catch (e) {
      console.warn('Analytics query error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [restId]);

  // Derive active summary block based on selected period
  const getActiveSummary = () => {
    if (!analytics) return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
    switch (selectedPeriod) {
      case 'today':
        return analytics.summaryToday || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
      case '7days':
        return analytics.summary7Days || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
      case '30days':
        return analytics.summary30Days || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
      case 'allTime':
      default:
        return analytics.summaryAllTime || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
    }
  };

  const activeSummary = getActiveSummary();
  const cancellation = analytics?.cancellation || { totalOrders: 0, cancelledOrders: 0, cancellationRate: 0 };
  const peakHours = analytics?.peakHours || { peakHourLabel: '12:00 PM - 2:00 PM', orderCount: 0 };
  const ratings = analytics?.ratings || { overallRating: restaurant?.rating ?? 0, totalReviews: restaurant?.totalReviews || 0 };
  const topDishes = analytics?.topDishes || [];
  const dailyTrend = analytics?.dailyTrend7Days || [];
  const statusGauge = analytics?.statusGauge || {};
  const isEmptyState = !analytics || analytics.isEmpty || (analytics.summaryAllTime?.totalOrders === 0);

  const handleDownloadReport = () => {
    const periodLabel = PERIODS.find(p => p.key === selectedPeriod)?.label || selectedPeriod;
    const rows = [
      ['CRAVEPULSE RESTAURANT PARTNER FINANCIAL LEDGER & TAX REPORT'],
      ['Restaurant Name:', restaurant?.name || 'Restaurant Partner'],
      ['FSSAI License:', restaurant?.fssaiLicense || 'FSSAI-000000000000'],
      ['GSTIN:', restaurant?.gstNumber || 'Not Registered'],
      ['Reporting Period:', periodLabel],
      ['Generated At:', new Date().toLocaleString()],
      ['Fair Trade Guarantee:', '0% Dine-In Menu Price Markup • Real-Time Order Settlement'],
      [],
      ['Order ID', 'Timestamp', 'Customer Name', 'Items Ordered', 'Order Status', 'Gross Total (INR)', 'Platform Fee (INR)', 'Net Kitchen Payout (INR)']
    ];

    ledgerOrders.forEach(item => {
      rows.push([
        item.id,
        item.time,
        item.customer,
        `"${item.items}"`,
        item.status,
        item.amount.toFixed(2),
        item.comm.toFixed(2),
        item.payout.toFixed(2)
      ]);
    });

    rows.push([]);
    rows.push(['PERIOD TOTALS']);
    rows.push(['Total Gross Revenue:', `INR ${Number(activeSummary.totalRevenue).toLocaleString()}`]);
    rows.push(['Total Completed Orders:', activeSummary.totalOrders]);
    rows.push(['Average Order Value:', `INR ${Number(activeSummary.averageOrderValue).toFixed(2)}`]);
    rows.push(['Cancellation Rate:', `${cancellation.cancellationRate}%`]);

    const csvContent = rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cravepulse_analytics_${restaurant?.slug || 'partner'}_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`✓ Real-time sales report (${periodLabel}) downloaded successfully!`);
    setTimeout(() => setDownloadToast(''), 4500);
  };

  return (
    <div>
      {/* Toast Alert */}
      {downloadToast && (
        <div className="alert alert-success rounded-4 shadow-sm border-0 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <span className="fw-bold">{downloadToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 bg-white p-3 rounded-4 shadow-sm border">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-extrabold mb-0 text-dark">Live Kitchen Analytics & Insights</h4>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              SQL Telemetry
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Real performance calculated directly from MySQL transactions for <strong className="text-dark">{restaurant?.name}</strong>.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="btn-group bg-light p-1 rounded-pill border" role="group">
            {PERIODS.map(p => (
              <button
                key={p.key}
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-bold ${selectedPeriod === p.key ? 'btn-danger text-white' : 'btn-light text-secondary'}`}
                style={selectedPeriod === p.key ? { background: '#ff5c35' } : {}}
                onClick={() => setSelectedPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            className="btn btn-outline-secondary rounded-pill btn-sm px-3 fw-bold"
            onClick={handleDownloadReport}
            disabled={ledgerOrders.length === 0}
            title="Export CSV Statement"
          >
            <i className="bi bi-download me-1"></i> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-muted small mt-2">Computing live SQL analytics metrics...</p>
        </div>
      ) : isEmptyState ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-white mb-4">
          <div className="fs-1 mb-2">📊</div>
          <h5 className="fw-bold text-dark">No Order Transactions Recorded Yet</h5>
          <p className="text-muted small mb-3" style={{ maxWidth: 500, margin: '0 auto' }}>
            Live SQL analytics, daily revenue trends, peak ordering hours, and dish popularity rankings will populate automatically once customer orders are placed and processed by the kitchen.
          </p>
          <div>
            <Link to="/partner/menu" className="btn btn-danger btn-sm rounded-pill px-4" style={{ background: '#ff5c35' }}>
              Check Menu & Availability
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="row g-3 mb-4">
            {/* Stat 1: Gross Sales */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-danger-subtle text-danger p-1 rounded-2 me-1">₹</span> Gross Revenue
                  </span>
                  <span className="badge bg-light text-muted border small">SQL</span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">
                  ₹{Number(activeSummary.totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Net sales before platform commission
                </span>
              </div>
            </div>

            {/* Stat 2: Orders Completed */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-primary-subtle text-primary p-1 rounded-2 me-1">📦</span> Orders Completed
                  </span>
                  <span className="badge bg-success-subtle text-success small">Active</span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">{activeSummary.totalOrders}</h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Fulfilled & paid tickets
                </span>
              </div>
            </div>

            {/* Stat 3: Average Order Value */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-warning-subtle text-warning p-1 rounded-2 me-1">💳</span> Avg Order Value
                  </span>
                  <span className="badge bg-light text-muted border small">AOV</span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">
                  ₹{Number(activeSummary.averageOrderValue).toFixed(0)}
                </h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  0% markup dine-in price parity
                </span>
              </div>
            </div>

            {/* Stat 4: Cancellation Rate */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-danger-subtle text-danger p-1 rounded-2 me-1">✕</span> Cancellation Rate
                  </span>
                  <span className={`badge ${cancellation.cancellationRate > 5 ? 'bg-danger text-white' : 'bg-success-subtle text-success'} small`}>
                    {cancellation.cancellationRate}%
                  </span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">{cancellation.cancelledOrders} <small className="fs-6 text-muted font-monospace">cancelled</small></h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  {cancellation.totalOrders} total tickets submitted
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: 7-Day Trend Chart & Operational Insights */}
          <div className="row g-4 mb-4">
            {/* Left: 7-Day Trend Bar/Line Visualization */}
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">7-Day Real Order & Revenue Volume</h6>
                    <small className="text-muted">Calculated from order timestamp telemetry</small>
                  </div>
                  <div className="d-flex align-items-center gap-3 small">
                    <span className="d-flex align-items-center gap-1 text-danger small">
                      <span className="badge bg-danger p-1 rounded-circle"></span> Revenue
                    </span>
                    <span className="d-flex align-items-center gap-1 text-primary small">
                      <span className="badge bg-primary p-1 rounded-circle"></span> Orders
                    </span>
                  </div>
                </div>

                {dailyTrend.length === 0 ? (
                  <div className="text-center py-5 text-muted small">No 7-day trend data available yet</div>
                ) : (
                  <div className="d-flex justify-content-between align-items-end pt-4" style={{ height: 220 }}>
                    {dailyTrend.map((day, idx) => {
                      const maxRev = Math.max(...dailyTrend.map(d => Number(d.revenue) || 0), 100);
                      const heightPct = Math.max(12, Math.round(((Number(day.revenue) || 0) / maxRev) * 100));
                      return (
                        <div key={idx} className="d-flex flex-column align-items-center flex-grow-1">
                          <small className="fw-bold text-dark mb-1" style={{ fontSize: 10 }}>₹{Math.round(day.revenue)}</small>
                          <div
                            className="w-50 rounded-top"
                            style={{
                              height: `${heightPct}%`,
                              background: 'linear-gradient(180deg, #ff5c35 0%, #ff8364 100%)',
                              minHeight: 12
                            }}
                            title={`${day.date}: ₹${day.revenue} (${day.orders} orders)`}
                          ></div>
                          <span className="badge bg-light text-muted border mt-2" style={{ fontSize: 9 }}>
                            {day.orders} ord
                          </span>
                          <small className="text-muted mt-1" style={{ fontSize: 10 }}>{day.date?.slice(5)}</small>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Operational Insights & Peak Hours */}
            <div className="col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-warning text-dark p-2 rounded-2">💡</span>
                  <h6 className="fw-bold mb-0 text-dark">Operational Insights</h6>
                </div>

                <div className="list-group list-group-flush small">
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Peak Ordering Window:</span>
                    <strong className="text-danger">{peakHours.peakHourLabel}</strong>
                  </div>
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Peak Volume:</span>
                    <strong className="text-dark">{peakHours.orderCount} orders/hr</strong>
                  </div>
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Customer Rating:</span>
                    <strong className="text-success">⭐ {Number(ratings.overallRating ?? 0).toFixed(1)} / 5.0</strong>
                  </div>
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Total Customer Reviews:</span>
                    <strong className="text-dark">{ratings.totalReviews} verified</strong>
                  </div>
                  <div className="py-2 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Dine-In Price Markup:</span>
                    <strong className="text-success">0.0% (Certified)</strong>
                  </div>
                </div>

                {/* Rating Dimensions Breakdown if available */}
                {ratings.tasteRating && (
                  <div className="mt-3 p-3 bg-light rounded-3 border">
                    <div className="fw-bold small text-dark mb-2">Multi-Dimensional Ratings</div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Taste & Flavor:</span>
                      <strong>⭐ {ratings.tasteRating}</strong>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Portion Size:</span>
                      <strong>⭐ {ratings.portionRating}</strong>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Packaging & Spill-Proof:</span>
                      <strong>⭐ {ratings.packagingRating}</strong>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Value for Money:</span>
                      <strong>⭐ {ratings.valueRating}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Selling Dishes + Live Order Ticket Statuses */}
          <div className="row g-4 mb-4">
            {/* Top Selling Dishes Table */}
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Top 5 Popular Dishes</h6>
                    <small className="text-muted">Ranked strictly by customer order frequency</small>
                  </div>
                  <span className="badge bg-light text-muted border small">Ranked by Volume</span>
                </div>

                {topDishes.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No dish sales recorded yet</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>#</th>
                          <th>Dish Name</th>
                          <th className="text-end">Units Sold</th>
                          <th className="text-end">Total Gross Sales</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {topDishes.map((dish, i) => (
                          <tr key={i}>
                            <td className="fw-bold text-muted">{i + 1}</td>
                            <td className="fw-semibold text-dark">{dish.name}</td>
                            <td className="text-end font-monospace">{dish.totalQuantity}</td>
                            <td className="text-end fw-bold text-dark">₹{Number(dish.totalRevenue).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Status Distribution Gauge */}
            <div className="col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <h6 className="fw-bold mb-1 text-dark">Order Status Distribution</h6>
                <small className="text-muted mb-3 d-block">All-time order stage lifecycle</small>

                <div className="d-flex flex-column gap-2">
                  {Object.entries(statusGauge).map(([st, count]) => (
                    <div key={st} className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border">
                      <span className="small fw-semibold text-secondary">{st}</span>
                      <span className="badge bg-white text-dark border font-monospace">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Orders Settlement Ledger */}
      <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-dark">Financial Settlement Ledger</h6>
            <small className="text-muted">Live ledger showing gross order value, platform fee deduction, and net partner payout</small>
          </div>
          <span className="badge bg-light text-muted border small">{ledgerOrders.length} Transactions</span>
        </div>

        {ledgerOrders.length === 0 ? (
          <div className="text-center py-4 text-muted small">No order ledger entries recorded yet</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-end">Gross (₹)</th>
                  <th className="text-end">Platform Fee (₹)</th>
                  <th className="text-end">Net Payout (₹)</th>
                </tr>
              </thead>
              <tbody className="small">
                {ledgerOrders.slice(0, 15).map((ord, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-dark">{ord.id}</td>
                    <td className="text-muted">{ord.time}</td>
                    <td>{ord.customer}</td>
                    <td className="text-truncate" style={{ maxWidth: 220 }}>{ord.items}</td>
                    <td>
                      <span className={`badge rounded-pill small ${ord.status === 'DELIVERED' ? 'bg-success' : ord.status === 'CANCELLED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="text-end fw-semibold">₹{ord.amount.toFixed(2)}</td>
                    <td className="text-end text-muted">-₹{ord.comm.toFixed(2)}</td>
                    <td className="text-end fw-bold text-success">₹{ord.payout.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodAnalyticsDashboard;
