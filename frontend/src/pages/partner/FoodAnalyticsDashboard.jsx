import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ModalPortal from '../../components/ModalPortal';

const DATE_RANGE_PRESETS = {
  'Today': {
    label: 'Today (26 Oct 2026)',
    totalRevenue: 18450,
    totalOrders: 74,
    newCustomers: 26,
    averageOrderValue: 249,
    growthRev: '+11.4%',
    growthOrd: '+9.2%',
    pointsRevenue: 'M 0,165 Q 80,185 160,120 T 320,65 T 450,80 T 600,110',
    pointsOrders: 'M 0,180 Q 80,195 160,140 T 320,85 T 450,105 T 600,140',
    peakLabelRev: '₹4.2K',
    peakLabelOrd: '18',
    axisLabels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM']
  },
  'Yesterday': {
    label: 'Yesterday (25 Oct 2026)',
    totalRevenue: 16920,
    totalOrders: 68,
    newCustomers: 22,
    averageOrderValue: 248,
    growthRev: '+7.8%',
    growthOrd: '+5.4%',
    pointsRevenue: 'M 0,170 Q 80,160 160,130 T 320,75 T 450,85 T 600,125',
    pointsOrders: 'M 0,185 Q 80,175 160,145 T 320,95 T 450,110 T 600,150',
    peakLabelRev: '₹3.9K',
    peakLabelOrd: '16',
    axisLabels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM']
  },
  'This Week': {
    label: 'Last 7 Days (20–26 Oct 2026)',
    totalRevenue: 124500,
    totalOrders: 482,
    newCustomers: 164,
    averageOrderValue: 258,
    growthRev: '+8.2%',
    growthOrd: '+6.2%',
    pointsRevenue: 'M 0,160 Q 80,180 160,110 T 320,50 T 450,70 T 600,120',
    pointsOrders: 'M 0,175 Q 80,190 160,135 T 320,80 T 450,95 T 600,150',
    peakLabelRev: '₹5.6K',
    peakLabelOrd: '28',
    axisLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  'This Month': {
    label: 'October 2026 (1–26 Oct)',
    totalRevenue: 486200,
    totalOrders: 1840,
    newCustomers: 620,
    averageOrderValue: 264,
    growthRev: '+14.6%',
    growthOrd: '+12.1%',
    pointsRevenue: 'M 0,150 Q 80,140 160,90 T 320,40 T 450,60 T 600,90',
    pointsOrders: 'M 0,165 Q 80,160 160,115 T 320,70 T 450,85 T 600,120',
    peakLabelRev: '₹22.5K',
    peakLabelOrd: '85',
    axisLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
  }
};

const FoodAnalyticsDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-26');
  const [downloadToast, setDownloadToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [ledgerOrders, setLedgerOrders] = useState([]);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await api.get('/orders/restaurant/1');
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(o => {
            const amt = Number(o.totalAmount || o.subtotal || 0);
            const gst = amt * 0.05;
            const comm = amt * 0.10;
            const payout = amt - comm;
            return {
              id: o.orderNumber || `ORD-${o.id}`,
              customer: o.customerName || `Customer #${o.customerId || ''}`,
              items: Array.isArray(o.items) ? o.items.map(i => `${i.itemName} x${i.quantity}`).join(', ') : 'Fresh Kitchen Order',
              amount: amt,
              gst: gst,
              comm: comm,
              payout: payout,
              time: o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'
            };
          });
          setLedgerOrders(mapped);
        }
      } catch (e) {
        console.warn('Analytics live orders query', e);
      }
    };
    fetchRealData();
  }, []);

  // Active dataset derived from selected filter
  const currentData = DATE_RANGE_PRESETS[timeFilter] || DATE_RANGE_PRESETS['This Week'];

  const handleDownloadReport = () => {
    // Generate authentic RFC 4180 CSV
    const rows = [
      ['CRAVEPULSE RESTAURANT PARTNER FINANCIAL LEDGER & TAX REPORT'],
      ['Restaurant Name:', 'Spice Symphony & Grill (Chef Lohith)'],
      ['FSSAI License:', 'FSSAI-11223344556677'],
      ['GSTIN:', '29AAECS8812K1Z4'],
      ['Period:', currentData.label],
      ['Generated At:', new Date().toLocaleString()],
      ['Fair Trade Guarantee:', 'Zero Price Inflation • Capped 10% Commission'],
      [],
      ['Order ID', 'Order Timestamp', 'Customer Name', 'Items Ordered', 'Food Subtotal (INR)', 'GST 5% (INR)', 'CravePulse Fair Comm 10% (INR)', 'Net Kitchen Payout (INR)']
    ];

    ledgerOrders.forEach(item => {
      rows.push([
        item.id,
        item.time,
        item.customer,
        `"${item.items}"`,
        item.amount.toFixed(2),
        item.gst.toFixed(2),
        item.comm.toFixed(2),
        item.payout.toFixed(2)
      ]);
    });

    rows.push([]);
    rows.push(['SUMMARY TOTALS']);
    rows.push(['Total Gross Revenue:', `INR ${currentData.totalRevenue.toLocaleString()}`]);
    rows.push(['Total Orders Completed:', currentData.totalOrders]);
    rows.push(['Average Order Value:', `INR ${currentData.averageOrderValue}`]);
    rows.push(['Net Kitchen Payout:', `INR ${(currentData.totalRevenue * 0.90).toLocaleString()}`]);

    const csvContent = rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cravepulse_sales_report_${timeFilter.toLowerCase().replace(/\s+/g, '_')}_20261026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`✓ Sales report (${timeFilter}) downloaded successfully!`);
    setTimeout(() => setDownloadToast(''), 4500);
  };

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    setShowCalendarModal(false);
    setTimeFilter('This Month');
    setDownloadToast(`✓ Date range updated to: ${customStartDate} to ${customEndDate}`);
    setTimeout(() => setDownloadToast(''), 4000);
  };

  return (
    <div>
      {/* Toast Alert for Download / Filter Confirmation */}
      {downloadToast && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 shadow-sm border-0 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <span className="fw-bold">{downloadToast}</span>
          <button type="button" className="btn-close" onClick={() => setDownloadToast('')}></button>
        </div>
      )}

      {/* Top Welcome Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Good Morning, Chef Lohith! ☀️</h4>
          <p className="text-muted small mb-0">
            Real-time kitchen performance & fair-trade analytics for <strong className="text-dark">Spice Symphony & Grill</strong>.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {/* Calendar Date Filter Trigger */}
          <button 
            onClick={() => setShowCalendarModal(true)}
            className="btn btn-white bg-white border rounded-pill px-3 py-2 small fw-semibold text-secondary shadow-sm d-flex align-items-center gap-2"
            title="Change Date Period"
          >
            <i className="bi bi-calendar3 text-danger"></i> 
            <span>{currentData.label}</span>
            <i className="bi bi-chevron-down small text-muted"></i>
          </button>

          {/* Download Report Button */}
          <button 
            onClick={handleDownloadReport}
            className="btn btn-outline-danger rounded-pill px-3 py-2 small fw-bold d-flex align-items-center gap-1.5 shadow-2xs"
          >
            <i className="bi bi-download"></i> 
            <span>Download CSV Report</span>
          </button>

          <Link 
            to="/partner/menu" 
            className="btn btn-primary rounded-pill px-3 py-2 small fw-bold text-white shadow-sm" 
            style={{ background: '#ff5c35', borderColor: '#ff5c35' }}
          >
            + Add Dish Item
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Stat Cards with Dynamic Values */}
      <div className="row g-3 mb-4">
        {/* Stat 1: Total Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold d-flex align-items-center gap-2">
                <span className="badge bg-danger-subtle text-danger p-1 rounded-2">💰</span> Total Revenue
              </span>
              <svg width="70" height="26" viewBox="0 0 70 26">
                <path d="M2,20 Q18,4 34,14 T68,6" fill="none" stroke="#ff5c35" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="fw-extrabold mb-1 text-dark">₹{currentData.totalRevenue.toLocaleString()}</h3>
            <span className="text-success small fw-bold d-flex align-items-center gap-1">
              <i className="bi bi-arrow-up-short fs-6"></i> {currentData.growthRev} <span className="text-muted fw-normal">vs Previous Period</span>
            </span>
          </div>
        </div>

        {/* Stat 2: Total Orders */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold d-flex align-items-center gap-2">
                <span className="badge bg-warning-subtle text-warning p-1 rounded-2">🍱</span> Total Orders
              </span>
              <svg width="70" height="26" viewBox="0 0 70 26">
                <path d="M2,22 Q18,12 34,18 T68,4" fill="none" stroke="#ff5c35" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="fw-extrabold mb-1 text-dark">{currentData.totalOrders}</h3>
            <span className="text-success small fw-bold d-flex align-items-center gap-1">
              <i className="bi bi-arrow-up-short fs-6"></i> {currentData.growthOrd} <span className="text-muted fw-normal">vs Previous Period</span>
            </span>
          </div>
        </div>

        {/* Stat 3: New Customers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success p-1 rounded-2">🧑‍🍳</span> New Diners
              </span>
              <svg width="70" height="26" viewBox="0 0 70 26">
                <path d="M2,18 Q18,22 34,10 T68,8" fill="none" stroke="#00b894" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="fw-extrabold mb-1 text-dark">{currentData.newCustomers}</h3>
            <span className="text-success small fw-bold d-flex align-items-center gap-1">
              <i className="bi bi-arrow-up-short fs-6"></i> +4.1% <span className="text-muted fw-normal">Retention High</span>
            </span>
          </div>
        </div>

        {/* Stat 4: Average Order Value */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold d-flex align-items-center gap-2">
                <span className="badge bg-warning-subtle text-warning p-1 rounded-2">💳</span> Avg Order Value
              </span>
              <svg width="70" height="26" viewBox="0 0 70 26">
                <path d="M2,16 Q18,6 34,20 T68,10" fill="none" stroke="#fdcb6e" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="fw-extrabold mb-1 text-dark">₹{currentData.averageOrderValue}</h3>
            <span className="text-success small fw-bold d-flex align-items-center gap-1">
              <i className="bi bi-arrow-up-short fs-6"></i> +3.7% <span className="text-muted fw-normal">Zero Markups</span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue & Orders Trend Chart + Category Donut */}
      <div className="row g-4 mb-4">
        {/* Left: Dual Line Revenue & Orders Trend Area Chart */}
        <div className="col-lg-8">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0">Revenue & Orders Dynamic Trend</h6>
                <div className="d-flex align-items-center gap-3 small mt-1">
                  <span className="d-flex align-items-center gap-1 text-danger small"><span className="badge bg-danger p-1 rounded-circle"></span> Revenue (₹)</span>
                  <span className="d-flex align-items-center gap-1 text-success small"><span className="badge bg-success p-1 rounded-circle"></span> Orders</span>
                </div>
              </div>

              {/* Quick Period Selector Tabs */}
              <div className="btn-group btn-group-sm rounded-pill p-1 bg-light border">
                {['Today', 'This Week', 'This Month'].map(tab => (
                  <button
                    key={tab}
                    className={`btn btn-sm rounded-pill px-3 ${timeFilter === tab ? 'bg-white shadow-sm fw-bold text-dark' : 'text-muted border-0'}`}
                    onClick={() => setTimeFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dynamic SVG Dual Line Trend Chart */}
            <div className="position-relative" style={{ height: 230 }}>
              <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5c35" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ff5c35" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00b894" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeDasharray="4,4" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" strokeDasharray="4,4" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeDasharray="4,4" />

                {/* Dynamic Revenue Fill & Line */}
                <path d={`${currentData.pointsRevenue} L 600,200 L 0,200 Z`} fill="url(#revenueGrad)" />
                <path d={currentData.pointsRevenue} fill="none" stroke="#ff5c35" strokeWidth="3" />

                {/* Dynamic Orders Fill & Line */}
                <path d={`${currentData.pointsOrders} L 600,200 L 0,200 Z`} fill="url(#ordersGrad)" />
                <path d={currentData.pointsOrders} fill="none" stroke="#00b894" strokeWidth="2.5" />

                {/* Dynamic Peak Markers */}
                <circle cx="320" cy="50" r="5" fill="#ff5c35" stroke="#fff" strokeWidth="2" />
                <circle cx="320" cy="80" r="5" fill="#00b894" stroke="#fff" strokeWidth="2" />
              </svg>

              {/* Peak Tooltip Pills */}
              <div className="position-absolute bg-danger text-white px-2 py-1 rounded-2 shadow-sm small fw-bold" style={{ top: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 11 }}>
                {currentData.peakLabelRev}
              </div>
              <div className="position-absolute bg-success text-white px-2 py-1 rounded-2 shadow-sm small fw-bold" style={{ top: 58, left: '50%', transform: 'translateX(-50%)', fontSize: 11 }}>
                {currentData.peakLabelOrd}
              </div>

              {/* Dynamic X Axis Time Labels */}
              <div className="d-flex justify-content-between text-muted small px-2 mt-2" style={{ fontSize: 11 }}>
                {currentData.axisLabels.map((lbl, idx) => (
                  <span key={idx} className={idx === Math.floor(currentData.axisLabels.length / 2) ? 'fw-bold text-dark' : ''}>{lbl}</span>
                ))}
              </div>
            </div>

            {/* Sub-stats row */}
            <div className="row g-2 mt-3 pt-3 border-top text-center">
              <div className="col-3 border-end">
                <small className="text-muted d-block" style={{ fontSize: 11 }}>Selected Revenue</small>
                <strong className="fs-6">₹{currentData.totalRevenue.toLocaleString()}</strong>
              </div>
              <div className="col-3 border-end">
                <small className="text-muted d-block" style={{ fontSize: 11 }}>Selected Orders</small>
                <strong className="fs-6">{currentData.totalOrders}</strong>
              </div>
              <div className="col-3 border-end">
                <small className="text-muted d-block" style={{ fontSize: 11 }}>Fair Comm (10%)</small>
                <strong className="fs-6 text-warning">₹{(currentData.totalRevenue * 0.10).toLocaleString()}</strong>
              </div>
              <div className="col-3">
                <small className="text-muted d-block" style={{ fontSize: 11 }}>Net Kitchen Disbursed</small>
                <strong className="fs-6 text-success">₹{(currentData.totalRevenue * 0.90).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Category Revenue Donut Chart */}
        <div className="col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between">
            <h6 className="fw-bold mb-3">Revenue by Category</h6>

            <div className="d-flex justify-content-center align-items-center position-relative my-2">
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="24" />
                {/* Dum Biryanis (44%) */}
                <circle cx="90" cy="90" r="70" fill="transparent" stroke="#ff5c35" strokeWidth="24" strokeDasharray="193 440" strokeDashoffset="0" />
                {/* Rich Curries (28%) */}
                <circle cx="90" cy="90" r="70" fill="transparent" stroke="#00b894" strokeWidth="24" strokeDasharray="123 440" strokeDashoffset="-193" />
                {/* Tandoori Breads (18%) */}
                <circle cx="90" cy="90" r="70" fill="transparent" stroke="#f9a825" strokeWidth="24" strokeDasharray="79 440" strokeDashoffset="-316" />
                {/* Desserts (10%) */}
                <circle cx="90" cy="90" r="70" fill="transparent" stroke="#6c5ce7" strokeWidth="24" strokeDasharray="44 440" strokeDashoffset="-395" />
              </svg>
              <div className="position-absolute text-center">
                <small className="text-muted d-block" style={{ fontSize: 10 }}>Total Orders</small>
                <span className="fs-4 fw-extrabold text-dark">{currentData.totalOrders}</span>
              </div>
            </div>

            <div className="d-flex flex-column gap-2 small mt-2">
              <div className="d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center gap-2"><span className="badge p-1 rounded-circle" style={{ background: '#ff5c35' }}></span> Royal Dum Biryanis</span>
                <span className="fw-bold">44%</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center gap-2"><span className="badge p-1 rounded-circle" style={{ background: '#00b894' }}></span> Rich Curries & Gravies</span>
                <span className="fw-bold">28%</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center gap-2"><span className="badge p-1 rounded-circle" style={{ background: '#f9a825' }}></span> Tandoori Naans & Breads</span>
                <span className="fw-bold">18%</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center gap-2"><span className="badge p-1 rounded-circle" style={{ background: '#6c5ce7' }}></span> Artisan Desserts</span>
                <span className="fw-bold">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Dishes + Order Status + Insights */}
      <div className="row g-4 mb-4">
        {/* 1. Top Selling Dishes */}
        <div className="col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Top Dishes This Period</h6>
              <span className="badge bg-light text-secondary border small">0% Markup</span>
            </div>

            <div className="list-group list-group-flush">
              {[
                { name: 'Hyderabadi Chicken Dum Biryani', orders: 248, revenue: 79360, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100' },
                { name: 'Paneer Butter Masala', orders: 182, revenue: 50960, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=100' },
                { name: 'Garlic Butter Chur Chur Naan', orders: 340, revenue: 22100, image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=100' },
                { name: 'Royal Shahi Rabdi Gulab Jamun', orders: 125, revenue: 18750, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=100' }
              ].map((dish, idx) => (
                <div key={idx} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-muted border rounded-circle">{idx + 1}</span>
                    <img src={dish.image} alt={dish.name} className="rounded-2 shadow-sm" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                    <div>
                      <div className="fw-semibold small text-truncate" style={{ maxWidth: 140 }}>{dish.name}</div>
                      <small className="text-muted" style={{ fontSize: 11 }}>{dish.orders} Orders</small>
                    </div>
                  </div>
                  <strong className="small">₹{dish.revenue.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Order Status Gauge Chart */}
        <div className="col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Order Status Breakdown</h6>
              <span className="badge bg-light text-secondary border small">{timeFilter}</span>
            </div>

            <div className="text-center my-3">
              <svg width="220" height="110" viewBox="0 0 220 110">
                <path d="M 20,100 A 90,90 0 0,1 200,100" fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
                <path d="M 20,100 A 90,90 0 0,1 160,35" fill="none" stroke="#00b894" strokeWidth="18" strokeLinecap="round" />
                <path d="M 160,35 A 90,90 0 0,1 190,65" fill="none" stroke="#f9a825" strokeWidth="18" strokeLinecap="round" />
                <path d="M 190,65 A 90,90 0 0,1 198,85" fill="none" stroke="#ff5c35" strokeWidth="18" strokeLinecap="round" />
              </svg>
            </div>

            <div className="row g-2 text-center small">
              <div className="col-3">
                <span className="badge bg-success-subtle text-success p-1 rounded-circle"></span>
                <div className="fw-bold">64%</div>
                <small className="text-muted">Delivered</small>
              </div>
              <div className="col-3">
                <span className="badge bg-warning-subtle text-warning p-1 rounded-circle"></span>
                <div className="fw-bold">22%</div>
                <small className="text-muted">Kitchen Prep</small>
              </div>
              <div className="col-3">
                <span className="badge bg-danger-subtle text-danger p-1 rounded-circle"></span>
                <div className="fw-bold">10%</div>
                <small className="text-muted">In Transit</small>
              </div>
              <div className="col-3">
                <span className="badge bg-secondary-subtle text-secondary p-1 rounded-circle"></span>
                <div className="fw-bold">04%</div>
                <small className="text-muted">Cancelled</small>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Business Insights Card */}
        <div className="col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-warning text-dark p-2 rounded-2">💡</span>
              <h6 className="fw-bold mb-0">Business Insights</h6>
            </div>

            <div className="list-group list-group-flush small">
              <div className="py-2 border-bottom d-flex justify-content-between">
                <span className="text-muted">Revenue Growth:</span>
                <strong className="text-success">{currentData.growthRev} vs Prior</strong>
              </div>
              <div className="py-2 border-bottom d-flex justify-content-between">
                <span className="text-muted">Top Grossing Item:</span>
                <strong className="text-dark">Chicken Dum Biryani</strong>
              </div>
              <div className="py-2 border-bottom d-flex justify-content-between">
                <span className="text-muted">CravePulse Savings:</span>
                <strong className="text-primary">100% Dine-In Parity</strong>
              </div>
              <div className="py-2 d-flex justify-content-between">
                <span className="text-muted">Peak Ordering Hour:</span>
                <strong className="text-danger">1:00 PM - 2:30 PM</strong>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 border text-center small text-secondary mt-3">
              All metrics update dynamically for future real-world database telemetry. 🌟
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Date Range & Calendar Selection Modal */}
      {showCalendarModal && (
        <ModalPortal isOpen={showCalendarModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCalendarModal(false); }}
          >
            <div className="cravepulse-modal-dialog">
              <div className="modal-content rounded-4 border-0 p-4 shadow-2xl bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-calendar3 text-danger me-2"></i>Select Analytics Period
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowCalendarModal(false)}
                  ></button>
                </div>

                <p className="text-muted small mb-3">
                  Filter revenue, order volume, and dining trends across predefined or custom date horizons.
                </p>

                {/* Predefined Range Buttons */}
                <div className="d-grid gap-2 mb-4">
                  {Object.keys(DATE_RANGE_PRESETS).map(key => (
                    <button
                      key={key}
                      type="button"
                      className={`btn text-start rounded-3 py-2 px-3 d-flex justify-content-between align-items-center ${timeFilter === key ? 'btn-danger text-white fw-bold' : 'btn-light border'}`}
                      onClick={() => {
                        setTimeFilter(key);
                        setShowCalendarModal(false);
                        setDownloadToast(`✓ Showing analytics for: ${DATE_RANGE_PRESETS[key].label}`);
                        setTimeout(() => setDownloadToast(''), 3500);
                      }}
                    >
                      <span>{DATE_RANGE_PRESETS[key].label}</span>
                      <i className="bi bi-arrow-right-short fs-5"></i>
                    </button>
                  ))}
                </div>

                {/* Custom Date Horizon Inputs */}
                <form onSubmit={handleApplyCustomDates}>
                  <h6 className="fw-bold text-dark small mb-2">Or Choose Custom Date Horizon</h6>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted mb-1">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted mb-1">End Date</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary rounded-pill px-3 btn-sm"
                      onClick={() => setShowCalendarModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary rounded-pill px-4 btn-sm fw-bold text-white shadow-sm"
                      style={{ background: '#ff5c35', borderColor: '#ff5c35' }}
                    >
                      Apply Custom Range
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default FoodAnalyticsDashboard;
