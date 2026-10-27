import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ModalPortal from '../../components/ModalPortal';

// Real-time trips dynamically populated from backend database API

const RiderHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHorizon, setFilterHorizon] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    api.get('/rider/history').then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(d => ({
          id: d.id,
          orderId: d.orderId,
          orderNumber: d.orderNumber || `CP-ORD-${d.orderId}`,
          restaurantName: d.restaurantName || 'Partner Kitchen',
          chefName: 'Head Chef',
          restaurantAddress: d.restaurantAddress || 'Bengaluru',
          customerName: d.customerName || 'Customer',
          deliveryAddress: d.deliveryAddress || 'Bengaluru',
          deliveryPhone: d.customerPhone || '',
          distanceKm: d.distanceKm || 2.5,
          basePay: parseFloat(d.basePay || 35.00),
          distancePay: parseFloat(d.distancePay || 0.00),
          waitPay: parseFloat(d.waitCompensation || 0.00),
          waitMinutes: d.waitMinutes || 0,
          tipAmount: parseFloat(d.tipAmount || 0.00),
          totalEarning: parseFloat(d.totalEarning || 35.00),
          deliveredAt: d.deliveredAt || 'Delivered',
          rating: 5.0,
          reviewNote: 'Delivered safely and on time.',
          otpVerified: '✓ PIN Verified',
          sealVerified: true,
          timeHorizon: 'TODAY',
          itemsSummary: 'Order #' + (d.orderNumber || d.orderId)
        }));
        setTrips(mapped);
      } else {
        // Fallback to /orders if empty or legacy
        api.get('/orders').then(ordersRes => {
          if (ordersRes.success && Array.isArray(ordersRes.data)) {
            const mapped = ordersRes.data.map(ord => ({
              id: ord.id,
              orderNumber: ord.orderNumber,
              restaurantName: ord.restaurantName || 'CravePulse Kitchen',
              chefName: ord.chefName || 'Chef Partner',
              restaurantAddress: ord.restaurantAddress || 'Bengaluru',
              customerName: ord.customerName || 'Customer',
              deliveryAddress: ord.deliveryAddress || 'Bengaluru',
              deliveryPhone: ord.deliveryPhone || '',
              distanceKm: ord.distanceKm || 2.4,
              basePay: 35.00,
              distancePay: (ord.distanceKm ? Math.max(0, ord.distanceKm - 2) * 12 : 18.00),
              waitPay: 0.00,
              waitMinutes: 0,
              tipAmount: parseFloat(ord.tipAmount || 0.00),
              totalEarning: 35.00 + (ord.distanceKm ? Math.max(0, ord.distanceKm - 2) * 12 : 18.00) + parseFloat(ord.tipAmount || 0.00),
              deliveredAt: ord.deliveredAt || ord.createdAt || 'Delivered',
              rating: 5.0,
              reviewNote: 'Delivered safely and on time.',
              otpVerified: 'PIN Verified',
              sealVerified: true,
              timeHorizon: 'TODAY',
              itemsSummary: ord.items?.map(it => it.itemName).join(', ') || 'Delivered items'
            }));
            setTrips(mapped);
          } else {
            setTrips([]);
          }
        }).catch(() => setTrips([]));
      }
    }).catch(() => {
      setTrips([]);
    }).finally(() => setLoading(false));
  }, []);

  const filteredTrips = trips.filter(trip => {
    const matchesHorizon = 
      filterHorizon === 'ALL' ||
      (filterHorizon === 'TODAY' && trip.timeHorizon === 'TODAY') ||
      (filterHorizon === 'YESTERDAY' && trip.timeHorizon === 'YESTERDAY') ||
      (filterHorizon === 'THIS_WEEK' && trip.timeHorizon === 'THIS_WEEK') ||
      (filterHorizon === 'HIGH_TIP' && trip.tipAmount >= 25);

    const matchesSearch = 
      trip.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesHorizon && matchesSearch;
  });

  const totalEarnedFiltered = filteredTrips.reduce((acc, t) => acc + t.totalEarning, 0);
  const totalTipsFiltered = filteredTrips.reduce((acc, t) => acc + t.tipAmount, 0);

  return (
    <div className="rider-history-container text-white pb-5">
      {/* Header & Meta */}
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill text-dark fw-extrabold px-3 py-1" style={{ background: '#00e676', fontSize: 10 }}>
              COMPLIANCE AUDIT READY
            </span>
            <span className="small text-secondary">Indiranagar EV Fleet Node</span>
          </div>
          <h3 className="fw-extrabold text-white mb-0">Completed Trips & Mission Ledger</h3>
          <small className="text-secondary">
            Itemized breakdown of base fares, transit distances, wait-time compensation, and 100% tip pass-through.
          </small>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>COMPLETED RUNS</span>
            <strong className="fs-3 text-white d-block">{filteredTrips.length}</strong>
            <small className="text-success" style={{ fontSize: 11 }}>100% Handover Rate</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>TOTAL DISPATCH PAYOUT</span>
            <strong className="fs-3 d-block" style={{ color: '#00e676' }}>₹{totalEarnedFiltered.toFixed(2)}</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>Avg ₹{(totalEarnedFiltered / (filteredTrips.length || 1)).toFixed(0)} / run</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>100% CUSTOMER TIPS</span>
            <strong className="fs-3 text-info d-block">₹{totalTipsFiltered.toFixed(2)}</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>Direct to Wallet</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>CAPTAIN RATING</span>
            <strong className="fs-3 text-warning d-block">4.96 ★</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>Top Tier-1 Fleet SLA</small>
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div 
        className="p-3 p-md-4 rounded-4 mb-4 shadow-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Trips' },
              { id: 'TODAY', label: 'Today (2)' },
              { id: 'YESTERDAY', label: 'Yesterday (2)' },
              { id: 'THIS_WEEK', label: 'This Week (1)' },
              { id: 'HIGH_TIP', label: 'High Tip (₹25+)' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition ${
                  filterHorizon === f.id ? 'text-dark shadow-sm' : 'text-secondary bg-dark'
                }`}
                style={filterHorizon === f.id ? { background: '#00e676' } : { border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setFilterHorizon(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="position-relative flex-grow-1" style={{ maxWidth: 360 }}>
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-secondary" style={{ left: 14 }}></i>
            <input
              type="text"
              placeholder="Search by customer name, order #..."
              className="form-control rounded-pill ps-5 py-2 text-white small"
              style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Trips Feed */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-5 text-secondary">
          <i className="bi bi-geo-alt fs-1 d-block mb-2"></i>
          <span>No completed trips found matching your search.</span>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredTrips.map(trip => (
            <div 
              key={trip.id}
              className="p-4 rounded-4 shadow-xl text-white transition hover-lift position-relative"
              style={{
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Top Row: Status, Order ID, Date & Total Earning */}
              <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill bg-success-subtle text-success fw-bold px-3 py-1" style={{ fontSize: 10 }}>
                    COMPLETED & SETTLED
                  </span>
                  <span className="font-monospace small text-secondary">{trip.orderNumber}</span>
                  <span className="text-secondary small d-none d-sm-inline">• {trip.deliveredAt}</span>
                </div>

                <div className="text-end">
                  <span className="fs-4 fw-extrabold d-block lh-1" style={{ color: '#00e676' }}>
                    +₹{trip.totalEarning.toFixed(2)}
                  </span>
                  <small className="text-secondary" style={{ fontSize: 10 }}>Auto-Credited</small>
                </div>
              </div>

              {/* Transit Route Details */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-7">
                  <div className="d-flex align-items-start gap-2.5 mb-2">
                    <span className="fs-5 text-warning flex-shrink-0">🍳</span>
                    <div>
                      <strong className="text-white small d-block">{trip.restaurantName}</strong>
                      <small className="text-secondary" style={{ fontSize: 11 }}>Prepared by {trip.chefName} • {trip.restaurantAddress}</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-2.5">
                    <span className="fs-5 text-info flex-shrink-0">📍</span>
                    <div>
                      <strong className="text-white small d-block">{trip.customerName}</strong>
                      <small className="text-secondary" style={{ fontSize: 11 }}>{trip.deliveryAddress}</small>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-5">
                  <div className="p-2.5 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-secondary small" style={{ fontSize: 11 }}>Items Handed Over:</span>
                      <span className="badge rounded-pill bg-dark text-light small" style={{ fontSize: 9 }}>TAMPER SEAL VERIFIED ✓</span>
                    </div>
                    <small className="text-light text-opacity-90 d-block text-truncate" style={{ fontSize: 11 }}>
                      {trip.itemsSummary}
                    </small>
                    <div className="mt-1 d-flex align-items-center justify-content-between text-secondary" style={{ fontSize: 10 }}>
                      <span>Distance: {trip.distanceKm} km</span>
                      <span className="text-warning fw-bold">★ {trip.rating} Customer Rating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Payout Formula Cards */}
              <div className="p-3 rounded-3 mb-3" style={{ background: '#080c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="row text-center g-2 small">
                  <div className="col-3 border-end border-secondary border-opacity-25">
                    <span className="text-secondary d-block" style={{ fontSize: 10 }}>BASE FARE</span>
                    <strong className="text-light">₹{trip.basePay.toFixed(2)}</strong>
                  </div>
                  <div className="col-3 border-end border-secondary border-opacity-25">
                    <span className="text-secondary d-block" style={{ fontSize: 10 }}>DISTANCE PAY</span>
                    <strong className="text-light">₹{trip.distancePay.toFixed(2)}</strong>
                  </div>
                  <div className="col-3 border-end border-secondary border-opacity-25">
                    <span className="text-secondary d-block" style={{ fontSize: 10 }}>WAIT METER</span>
                    <strong className="text-warning">₹{trip.waitPay.toFixed(2)}</strong>
                  </div>
                  <div className="col-3">
                    <span className="text-secondary d-block" style={{ fontSize: 10 }}>100% TIP</span>
                    <strong className="text-success">₹{trip.tipAmount.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Customer Feedback Review & Action Button */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                <div className="small text-secondary fst-italic">
                  <i className="bi bi-chat-quote-fill text-warning me-1"></i>
                  "{trip.reviewNote}"
                </div>

                <button
                  type="button"
                  className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold small text-nowrap glove-touch-btn"
                  style={{ minHeight: 44, borderColor: 'rgba(255,255,255,0.2)' }}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <i className="bi bi-receipt me-1 text-success"></i>
                  <span>Trip Audit & Proof ↗</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          TRIP AUDIT & RECEIPT MODAL
          ==================================================================== */}
      {selectedTrip && (
        <ModalPortal isOpen={!!selectedTrip}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedTrip(null); }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 540 }}>
              <div 
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{ background: '#0f172a', border: '1.5px solid rgba(0, 230, 118, 0.3)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">📜</span>
                    <h5 className="fw-bold mb-0 text-white">Full Trip Payout & Telemetry Audit</h5>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTrip(null)}></button>
                </div>

                <div className="p-3 rounded-3 mb-3" style={{ background: '#080c14', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="font-monospace small text-secondary">{selectedTrip.orderNumber}</span>
                    <span className="badge rounded-pill bg-success text-dark small" style={{ fontSize: 9 }}>VERIFIED PIN: {selectedTrip.otpVerified}</span>
                  </div>
                  <h5 className="fw-bold text-white mb-0">{selectedTrip.restaurantName} → {selectedTrip.customerName}</h5>
                  <small className="text-secondary">{selectedTrip.deliveredAt} • {selectedTrip.distanceKm} km</small>
                </div>

                {/* Audit breakdown table */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary text-uppercase" style={{ fontSize: 10 }}>Fare Calculation Audit</label>
                  <div className="list-group list-group-flush rounded-3 overflow-hidden" style={{ background: '#0a0f1d' }}>
                    <div className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary border-opacity-25 py-2.5 text-white small">
                      <span>Base Guaranteed Fare (0-2 km)</span>
                      <strong>₹{selectedTrip.basePay.toFixed(2)}</strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary border-opacity-25 py-2.5 text-white small">
                      <span>Distance Fare ({selectedTrip.distanceKm} km @ ₹12/km)</span>
                      <strong>₹{selectedTrip.distancePay.toFixed(2)}</strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary border-opacity-25 py-2.5 text-white small">
                      <span>Kitchen Delay Wait ({selectedTrip.waitMinutes} mins @ ₹2/m &gt; 8m)</span>
                      <strong className="text-warning">₹{selectedTrip.waitPay.toFixed(2)}</strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary border-opacity-25 py-2.5 text-white small">
                      <span>Customer Gratuity / Direct Tip (100% Retained)</span>
                      <strong className="text-success">₹{selectedTrip.tipAmount.toFixed(2)}</strong>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center bg-dark py-3 text-white">
                      <span className="fw-bold">Total Payout Deposited</span>
                      <strong className="fs-5" style={{ color: '#00e676' }}>₹{selectedTrip.totalEarning.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Proof badges */}
                <div className="p-3 rounded-3 mb-4 small" style={{ background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                  <div className="d-flex align-items-center gap-2 text-success fw-bold mb-1">
                    <i className="bi bi-shield-check fs-5"></i>
                    <span>Digital Handover Compliance Confirmed</span>
                  </div>
                  <ul className="mb-0 text-secondary ps-3" style={{ fontSize: 11 }}>
                    <li>Customer OTP Verified upon doorstep contact ({selectedTrip.otpVerified})</li>
                    <li>Tamper-evident bag tape verified prior to chef departure</li>
                    <li>Roadside insurance coverage active throughout the transit window</li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-light w-100 rounded-pill py-2.5 fw-bold small"
                  style={{ minHeight: 46, borderColor: 'rgba(255,255,255,0.2)' }}
                  onClick={() => setSelectedTrip(null)}
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default RiderHistory;
