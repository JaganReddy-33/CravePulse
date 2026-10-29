import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import realtime from '../../services/websocket';
import LiveMap from '../../components/LiveMap';
import ModalPortal from '../../components/ModalPortal';


const RiderActiveJob = () => {
  const [profile, setProfile] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [dispatchError, setDispatchError] = useState('');
  const [activeJobOffer, setActiveJobOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workflow state machine: 'ACCEPTED' | 'AT_KITCHEN' | 'PICKED_UP' | 'AT_DOORSTEP' | 'DELIVERED'
  const [currentStep, setCurrentStep] = useState('ACCEPTED');

  // Kitchen wait time meter state
  const [waitingAtKitchen, setWaitingAtKitchen] = useState(false);
  const [waitTimerMinutes, setWaitTimerMinutes] = useState(0);
  const [claimedWaitPay, setClaimedWaitPay] = useState(0);

  // Bag item verification checklist
  const [verifiedItems, setVerifiedItems] = useState({});

  // Handover modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [deliveryProofPhoto, setDeliveryProofPhoto] = useState(null);
  const [deliveryComplete, setDeliveryComplete] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('PUNCTURE_OR_BREAKDOWN');

  // Fetch the authenticated rider?s current dispatch
  const fetchActiveJob = async () => {
    try {
      const pRes = await api.get('/rider/profile');
      if (pRes.success) setProfile(pRes.data);

      const jobRes = await api.get('/rider/active-job').catch(() => api.get('/rider/orders/active'));
      if (jobRes && jobRes.success && jobRes.data) {
        setActiveJob(jobRes.data);
      } else {
        setActiveJob(null);
      }
    } catch (e) {
      setActiveJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJob();
  }, []);

  useEffect(() => {
    const loadOffers = () => api.get('/rider/offers').then(res => { if (res.success) setActiveJobOffer(res.data?.[0] || null); }).catch(err => setDispatchError(err.message));
    loadOffers();
    const off = realtime.on('rider_job_offer', loadOffers);
    const timer = setInterval(() => { loadOffers(); fetchActiveJob(); }, 15000);
    return () => { off(); clearInterval(timer); };
  }, []);

  // Wait time counter
  useEffect(() => {
    let interval;
    if (waitingAtKitchen) {
      interval = setInterval(() => {
        setWaitTimerMinutes(prev => prev + 1);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [waitingAtKitchen]);

  // Only device GPS positions are sent; permission failures never fabricate movement.
  useEffect(() => {
    if (!activeJob || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(pos => {
      setGpsCoords([pos.coords.latitude, pos.coords.longitude]);
      api.post('/rider/telemetry', { orderId: activeJob.orderId, latitude: pos.coords.latitude, longitude: pos.coords.longitude, speed: pos.coords.speed == null ? 0 : pos.coords.speed * 3.6, heading: pos.coords.heading || 0 }).catch(err => console.warn('Location update failed', err.message));
    }, () => {}, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [activeJob?.orderId]);

  const toggleItemVerified = (itemId) => {
    setVerifiedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const allItemsVerified = activeJob?.items?.length > 0 && activeJob.items.every(i => verifiedItems[i.id]);

  const handleArriveAtKitchen = async () => {

    if (activeJob) {
      try {
        await api.post(`/rider/orders/${activeJob.orderId}/status`, { status: 'ARRIVED_AT_RESTAURANT' });
        setWaitingAtKitchen(true); setWaitTimerMinutes(0); setCurrentStep('AT_KITCHEN');
      } catch (e) {
        console.warn('Failed to record kitchen arrival milestone', e);
      }
    }
  };

  const handleClaimWaitCompensation = async () => {
    if (activeJob) {
      try {
        const res = await api.post(`/rider/orders/${activeJob.orderId}/wait-compensation`);
        if (res.success && res.data && res.data.compensationCredited !== undefined) {
          setClaimedWaitPay(parseFloat(res.data.compensationCredited));
        } else {
          window.alert('Wait compensation was not credited. Please retry.');
        }
      } catch (e) {
        window.alert('Wait compensation was not credited. Please retry.');
      }
      setWaitingAtKitchen(false);
    } else {
      setWaitingAtKitchen(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (activeJob) {
      try {
        await api.post(`/rider/orders/${activeJob.orderId}/status`, { status: 'PICKED_UP' });
        setCurrentStep('PICKED_UP');
      } catch (e) {
        console.warn('Failed to record pickup milestone', e);
      }
    }
  };

  const handleConfirmFinalDelivery = async () => {
    try {
      const res = await api.post(`/rider/orders/${activeJob.orderId}/status`, { 
        status: 'DELIVERED',
        deliveryOtp,
        proofPhoto: deliveryProofPhoto 
      });
      if (res.success) {
        setDeliveryComplete(true);
        setTimeout(() => {
          setShowDeliveryModal(false);
          setActiveJob(null);
        }, 2200);
      } else {
        alert(res.message || 'Delivery confirmation failed');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Invalid delivery PIN or error completing delivery');
    }
  };

  const handleProofPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDeliveryProofPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="rider-cockpit-container position-relative">
      {dispatchError && <div className="alert alert-danger" role="alert">{dispatchError}</div>}
      {!activeJob && activeJobOffer && <div className="card p-4 mb-4"><h2 className="h5">New delivery offer</h2><p>{activeJobOffer.orderNumber || `Order ${activeJobOffer.orderId}`} ? Earning: {Number(activeJobOffer.totalEarning || 0).toFixed(2)} INR</p><div className="d-flex flex-wrap gap-2"><button className="btn btn-success" onClick={async () => { try { await api.post(`/rider/${activeJobOffer.id}/accept`, {}); setActiveJobOffer(null); await fetchActiveJob(); } catch (err) { setDispatchError(err.message); } }}>Accept delivery</button><button className="btn btn-outline-secondary" onClick={async () => { try { await api.post(`/rider/${activeJobOffer.id}/reject`, {}); setActiveJobOffer(null); } catch (err) { setDispatchError(err.message); } }}>Decline</button></div></div>}

      {activeJob ? (
        <div className="row g-3 g-xl-4 align-items-start">
          {/* ====================================================================
              LEFT COLUMN: MISSION CONTROL, TIMELINE & ITEM CHECKLIST
              ==================================================================== */}
          <div className="col-12 col-xl-7">
            {/* Mission Hero Banner */}
            <div 
              className="p-3 p-md-4 rounded-4 shadow-xl mb-3 position-relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
                border: '1.5px solid rgba(0, 230, 118, 0.25)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* Top Meta Header */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span 
                      className="badge rounded-pill fw-extrabold text-dark px-3 py-1.5"
                      style={{ background: '#00e676', fontSize: 10, letterSpacing: 0.5 }}
                    >
                      LIVE RUN IN PROGRESS
                    </span>
                    <span className="font-monospace small text-secondary">{activeJob.orderNumber}</span>
                  </div>
                  <h4 className="fw-extrabold text-white mb-0">Delivery Run Dispatch</h4>
                </div>

                <div className="text-end">
                  <span className="display-6 fw-extrabold lh-1 d-block mb-1" style={{ color: '#00e676', fontSize: '2rem' }}>
                    ₹{Number(activeJob.totalEarning || 0).toFixed(2)}
                  </span>
                  <div className="badge bg-dark border border-secondary border-opacity-50 text-secondary" style={{ fontSize: 9 }}>
                    BASE ₹{activeJob.basePay} + DIST ₹{activeJob.distancePay} + 100% TIP ₹{activeJob.tipAmount}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 01: Kitchen Pickup Elevated Container */}
            <div 
              className={`p-3 p-md-4 rounded-4 mb-3 transition shadow-lg ${
                currentStep === 'ACCEPTED' || currentStep === 'AT_KITCHEN' 
                  ? 'cockpit-step-active' 
                  : 'cockpit-step-completed'
              }`}
              style={{
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(16px)',
                border: currentStep === 'ACCEPTED' || currentStep === 'AT_KITCHEN'
                  ? '2px solid #00e676'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: currentStep === 'ACCEPTED' || currentStep === 'AT_KITCHEN'
                  ? '0 0 25px rgba(0, 230, 118, 0.15)'
                  : 'none'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ 
                      width: 32, 
                      height: 32, 
                      background: currentStep === 'PICKED_UP' ? '#00e676' : '#1e293b',
                      color: currentStep === 'PICKED_UP' ? '#080c14' : '#ffffff',
                      fontSize: 13
                    }}
                  >
                    {currentStep === 'PICKED_UP' ? '✓' : '01'}
                  </div>
                  <div>
                    <span className="small fw-extrabold text-uppercase tracking-wider" style={{ color: '#00e676', fontSize: 11 }}>
                      STEP 01 • KITCHEN PICKUP
                    </span>
                    <h5 className="fw-bold text-white mb-0">{activeJob.restaurantName}</h5>
                  </div>
                </div>

                <a 
                  href="tel:+918047483333" 
                  className="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: 44, height: 44, borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  title="Call Kitchen via CravePulse Masked Proxy (+91 80 4748 3333)"
                >
                  <i className="bi bi-telephone-fill text-warning fs-6"></i>
                </a>
              </div>

              <p className="text-secondary small mb-3 d-flex align-items-center gap-1.5">
                <i className="bi bi-geo-alt-fill text-warning"></i>
                <span>{activeJob.restaurantAddress}</span>
              </p>

              {/* 48px Glove-Friendly Navigation Button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.restaurantLat},${activeJob.restaurantLng}`}
                target="_blank"
                rel="noreferrer"
                className="btn w-100 rounded-pill fw-bold text-dark d-flex align-items-center justify-content-center gap-2 mb-3 shadow-md transition hover-lift"
                style={{ 
                  minHeight: 50, 
                  background: '#00e676', 
                  fontSize: 15, 
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(0, 230, 118, 0.35)' 
                }}
              >
                <i className="bi bi-geo-fill fs-5"></i>
                <span>Open Kitchen in Google Maps ↗</span>
              </a>

              {/* Modern Wait-Time Compensation Meter Widget */}
              <div 
                className="p-3 rounded-4 mb-3"
                style={{ 
                  background: 'rgba(8, 12, 20, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)' 
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-5">⏱️</span>
                    <div>
                      <strong className="text-white small d-block">Kitchen Wait Meter</strong>
                      <small className="text-secondary" style={{ fontSize: 10 }}>₹2/min credited if chef wait &gt; 8m</small>
                    </div>
                  </div>
                  <span 
                    className="badge rounded-pill fw-extrabold px-3 py-1.5"
                    style={{ 
                      background: waitTimerMinutes > 8 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: waitTimerMinutes > 8 ? '#ff5252' : '#00e676',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: 12
                    }}
                  >
                    {waitTimerMinutes} Mins Elapsed
                  </span>
                </div>

                {!waitingAtKitchen ? (
                  <button
                    type="button"
                    className="btn btn-outline-light w-100 rounded-pill fw-bold py-2.5 small transition"
                    style={{ minHeight: 46, borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    onClick={handleArriveAtKitchen}
                  >
                    I Have Arrived at Kitchen 📍
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-warning w-100 rounded-pill fw-bold py-2.5 text-dark shadow-sm"
                    style={{ minHeight: 46 }}
                    onClick={handleClaimWaitCompensation}
                  >
                    Claim ₹{Math.max(0, waitTimerMinutes - 8) * 2} Delay Compensation & Confirm Bag Handover
                  </button>
                )}

                {claimedWaitPay > 0 && (
                  <div className="text-success small fw-bold text-center mt-2">
                    ✓ ₹{claimedWaitPay} credited directly into your wallet balance!
                  </div>
                )}
              </div>

              {/* Large Touch-Target Bag Item Verification Checklist */}
              <div className="pt-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-extrabold text-light text-uppercase tracking-wider" style={{ fontSize: 11 }}>
                    Tamper-Evident Bag Verification
                  </span>
                  <span 
                    className="badge rounded-pill fw-bold px-2.5 py-1"
                    style={{ 
                      background: allItemsVerified ? '#00e676' : 'rgba(255, 255, 255, 0.12)',
                      color: allItemsVerified ? '#080c14' : '#94a3b8',
                      fontSize: 10
                    }}
                  >
                    {Object.values(verifiedItems).filter(Boolean).length} / {activeJob.items?.length} Verified
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 mb-3">
                  {activeJob.items?.map((item) => {
                    const isChecked = !!verifiedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemVerified(item.id)}
                        className="p-3 rounded-3 d-flex align-items-center justify-content-between transition cursor-pointer"
                        style={{
                          minHeight: 54,
                          background: isChecked ? 'rgba(0, 230, 118, 0.12)' : 'rgba(10, 15, 26, 0.85)',
                          border: isChecked ? '1.5px solid #00e676' : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: isChecked ? '0 0 16px rgba(0, 230, 118, 0.12)' : 'none'
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center transition flex-shrink-0"
                            style={{ 
                              width: 28, 
                              height: 28, 
                              background: isChecked ? '#00e676' : 'transparent',
                              border: isChecked ? 'none' : '2px solid rgba(255, 255, 255, 0.35)',
                              color: isChecked ? '#080c14' : 'transparent'
                            }}
                          >
                            <i className="bi bi-check-lg fw-extrabold fs-6"></i>
                          </div>
                          <div>
                            <div className={`fw-bold small ${isChecked ? 'text-white' : 'text-light'}`}>
                              {item.itemName}
                            </div>
                            <small className="text-secondary" style={{ fontSize: 10 }}>
                              🔒 {item.sealType}
                            </small>
                          </div>
                        </div>

                        <span 
                          className="badge rounded-pill fw-bold px-2.5 py-1"
                          style={{ 
                            background: isChecked ? '#00e676' : 'rgba(255, 255, 255, 0.1)',
                            color: isChecked ? '#080c14' : '#ffffff',
                            fontSize: 11
                          }}
                        >
                          x{item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-light w-100 rounded-pill fw-bold py-3 small d-flex align-items-center justify-content-center gap-2 transition"
                  style={{ minHeight: 48, borderColor: 'rgba(255, 255, 255, 0.25)' }}
                  onClick={handleConfirmPickup}
                >
                  <i className="bi bi-box-seam text-success fs-5"></i>
                  <span>Confirm All Items Picked Up from Chef →</span>
                </button>
              </div>
            </div>

            {/* Step 02: Customer Doorstep Elevated Container */}
            <div 
              className={`p-3 p-md-4 rounded-4 shadow-lg transition ${
                currentStep === 'PICKED_UP' ? 'cockpit-step-active' : 'cockpit-step-pending'
              }`}
              style={{
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(16px)',
                border: currentStep === 'PICKED_UP' 
                  ? '2px solid #38bdf8' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: currentStep === 'PICKED_UP' 
                  ? '0 0 25px rgba(56, 189, 248, 0.2)' 
                  : 'none'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{ 
                      width: 32, 
                      height: 32, 
                      background: currentStep === 'PICKED_UP' ? '#0284c7' : '#1e293b',
                      fontSize: 13
                    }}
                  >
                    02
                  </div>
                  <div>
                    <span className="small fw-extrabold text-uppercase tracking-wider text-info" style={{ fontSize: 11 }}>
                      STEP 02 • DOORSTEP DELIVERY
                    </span>
                    <h5 className="fw-bold text-white mb-0">{activeJob.customerName}</h5>
                  </div>
                </div>

                <a 
                  href="tel:+918047483333" 
                  className="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: 44, height: 44, borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  title="Call Customer via CravePulse Masked Proxy (+91 80 4748 3333)"
                >
                  <i className="bi bi-telephone-fill text-info fs-6"></i>
                </a>
              </div>

              <p className="text-secondary small mb-2 d-flex align-items-center gap-1.5">
                <i className="bi bi-geo-alt-fill text-info"></i>
                <span>{activeJob.deliveryAddress}</span>
              </p>

              {activeJob.deliveryInstructions && (
                <div 
                  className="p-3 rounded-3 mb-3 small"
                  style={{ 
                    background: 'rgba(14, 165, 233, 0.1)', 
                    border: '1px solid rgba(14, 165, 233, 0.25)',
                    color: '#bae6fd'
                  }}
                >
                  <i className="bi bi-bell-fill me-1 text-info"></i>
                  <strong>Doorbell / Drop Note:</strong> {activeJob.deliveryInstructions}
                </div>
              )}

              {/* 48px Glove-Friendly Navigation Button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.deliveryLat},${activeJob.deliveryLng}`}
                target="_blank"
                rel="noreferrer"
                className="btn w-100 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2 mb-3 shadow-md transition hover-lift"
                style={{ 
                  minHeight: 50, 
                  background: '#0284c7', 
                  fontSize: 15, 
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
                }}
              >
                <i className="bi bi-compass-fill fs-5"></i>
                <span>Navigate to Customer Doorstep ↗</span>
              </a>

              {/* 52px Primary Handover Action Button */}
              <button
                type="button"
                className="btn w-100 rounded-pill fw-extrabold text-dark shadow-xl d-flex align-items-center justify-content-center gap-2 transition hover-lift"
                style={{ 
                  minHeight: 54, 
                  background: '#00e676', 
                  fontSize: 16, 
                  border: 'none',
                  boxShadow: '0 0 25px rgba(0, 230, 118, 0.45)'
                }}
                onClick={() => setShowDeliveryModal(true)}
              >
                <i className="bi bi-shield-check fs-4"></i>
                <span>I Am at Doorstep • Verify Customer Delivery PIN</span>
              </button>
            </div>
          </div>

          {/* ====================================================================
              RIGHT COLUMN: HIGH-IMPACT SATELLITE RADAR MAP & TURN HUD
              ==================================================================== */}
          <div className="col-12 col-xl-5">
            {/* Live Interactive Navigation Map Container */}
            <div 
              className="card border-0 rounded-4 shadow-2xl overflow-hidden mb-3 text-white position-relative"
              style={{ 
                background: '#090d16', 
                border: '1px solid rgba(255, 255, 255, 0.12)' 
              }}
            >
              {/* Floating Floating Turn-by-Turn Instruction Banner */}
              <div 
                className="position-absolute d-flex align-items-center justify-content-between p-3 rounded-4 shadow-2xl"
                style={{ 
                  top: 14, 
                  left: 14, 
                  right: 14, 
                  zIndex: 1000, 
                  background: 'rgba(15, 23, 42, 0.94)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="rounded-3 d-flex align-items-center justify-content-center text-dark fw-extrabold flex-shrink-0"
                    style={{ width: 42, height: 42, background: '#00e676', fontSize: 20 }}
                  >
                    <i className="bi bi-arrow-up-right"></i>
                  </div>
                  <div>
                    <strong className="d-block text-white small" style={{ fontSize: 13 }}>
                      In 350m, Turn Right onto 100 Feet Rd
                    </strong>
                    <small className="text-secondary" style={{ fontSize: 10 }}>
                      Indiranagar Corridor • Clear Road Ahead
                    </small>
                  </div>
                </div>

                <div className="text-end ps-2 flex-shrink-0">
                  <span className="fs-5 fw-extrabold d-block lh-1 text-success">7 Mins</span>
                  <small className="text-secondary" style={{ fontSize: 9 }}>1.8 KM LEFT</small>
                </div>
              </div>

              {/* Dark-Matter Leaflet Map */}
              <div style={{ height: 420, width: '100%', position: 'relative' }}>
                <LiveMap
                  restaurantCoords={[activeJob.restaurantLat, activeJob.restaurantLng]}
                  deliveryCoords={[activeJob.deliveryLat, activeJob.deliveryLng]}
                  riderCoords={gpsCoords}
                  riderName={profile?.fullName || 'Captain Prasad Rao'}
                  darkMode={true}
                  height="420px"
                  interactive={true}
                />
              </div>

              {/* Map Footer Telemetry Bar */}
              <div 
                className="p-3 d-flex align-items-center justify-content-between border-top border-dark"
                style={{ background: 'rgba(10, 15, 26, 0.96)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="spinner-grow spinner-grow-sm text-success" style={{ width: 7, height: 7 }}></span>
                  <small className="text-light fw-bold" style={{ fontSize: 11 }}>Ather EV GPS Telemetry: Streaming 28 km/h</small>
                </div>
                <span className="badge rounded-pill bg-success-subtle text-success small" style={{ fontSize: 10 }}>
                  GPS LOCK: 100%
                </span>
              </div>
            </div>

            {/* Captain Shift Performance Radar Card */}
            <div 
              className="p-3 p-md-4 rounded-4 shadow-xl text-white"
              style={{ 
                background: 'rgba(15, 23, 42, 0.85)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)' 
              }}
            >
              <h6 className="fw-extrabold small text-secondary text-uppercase mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-graph-up text-success"></i>
                <span>Shift Metrics & SLA Radar</span>
              </h6>

              <div className="row g-2 text-center small mb-3">
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-secondary d-block" style={{ fontSize: 9 }}>RUNS TODAY</span>
                    <strong className="fs-5 text-white">6</strong>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-secondary d-block" style={{ fontSize: 9 }}>ON-TIME SLA</span>
                    <strong className="fs-5 text-success">98.4%</strong>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-secondary d-block" style={{ fontSize: 9 }}>RATING</span>
                    <strong className="fs-5 text-warning">4.98 ★</strong>
                  </div>
                </div>
              </div>

              <div 
                className="p-2.5 rounded-3 d-flex align-items-center justify-content-between"
                style={{ background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)' }}
              >
                <div className="d-flex align-items-center gap-2 small text-success">
                  <i className="bi bi-shield-check fs-5"></i>
                  <strong>Zero Arbitrary Penalty Guarantee</strong>
                </div>
                <span className="badge rounded-pill bg-success text-dark small" style={{ fontSize: 10 }}>PROTECTED</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standby Radar State */
        <div 
          className="p-5 rounded-4 shadow-2xl text-center text-white mx-auto my-5"
          style={{ 
            maxWidth: 580, 
            background: 'rgba(15, 23, 42, 0.92)', 
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(0, 230, 118, 0.3)' 
          }}
        >
          <div className="fs-1 mb-3">📡</div>
          <h3 className="fw-extrabold text-white mb-2">Captain Radar Online</h3>
          <p className="text-secondary small mb-4">
            Waiting for delivery offers in your service area.
          </p>

        </div>
      )}

      {/* ====================================================================
          PERSISTENT SAFETY & QUICK-ACTION FLOATING DOCK
          ==================================================================== */}
      <div 
        className="position-fixed d-flex align-items-center justify-content-between p-2.5 px-3 rounded-pill shadow-2xl"
        style={{
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: 620,
          background: 'rgba(10, 15, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          zIndex: 1030
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
            style={{ width: 34, height: 34, background: '#ef4444' }}
          >
            <i className="bi bi-shield-fill-exclamation fs-6"></i>
          </div>
          <div className="lh-1">
            <strong className="text-white small d-block" style={{ fontSize: 12 }}>24x7 Safety Emergency SOS</strong>
            <small className="text-secondary" style={{ fontSize: 10 }}>Roadside Medical & Vehicle Breakdown Assistance</small>
          </div>
        </div>

        <a
          href="tel:18001234567"
          className="btn btn-sm btn-danger rounded-pill px-3 py-1.5 fw-bold text-nowrap d-flex align-items-center gap-1.5 shadow"
          style={{ minHeight: 38, fontSize: 12 }}
        >
          <i className="bi bi-telephone-fill"></i>
          <span>Dial Hotline</span>
        </a>
      </div>

      {/* ====================================================================
          DELIVERY HANDOVER VERIFICATION MODAL
          ==================================================================== */}
      {showDeliveryModal && (
        <ModalPortal isOpen={showDeliveryModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget && !deliveryComplete) setShowDeliveryModal(false); }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 480 }}>
              <div 
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{ background: '#0f172a', border: '1px solid rgba(0, 230, 118, 0.3)' }}
              >
                {deliveryComplete ? (
                  <div className="text-center py-4">
                    <div className="fs-1 mb-2">🎉</div>
                    <h3 className="fw-extrabold text-success mb-1">Handover Verified!</h3>
                    <p className="text-secondary small mb-3">
                      ₹{activeJob?.totalEarning.toFixed(2)} has been deposited into your CravePulse Captain Wallet.
                    </p>
                    <span className="badge rounded-pill bg-success text-dark px-3 py-1.5 fw-bold">
                      Payout Credited ✓
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-4">📦</span>
                        <h5 className="fw-bold mb-0 text-white">Customer Handover Verification</h5>
                      </div>
                      <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeliveryModal(false)}></button>
                    </div>

                    <p className="text-secondary small mb-3">
                      Ask customer <strong className="text-white">{activeJob?.customerName}</strong> for their 4-digit Delivery PIN to complete run.
                    </p>

                    {/* 4-Digit OTP PIN Input */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-light">Customer 4-Digit Handover PIN *</label>
                      <input
                        type="text"
                        maxLength="4"
                        className="form-control text-center fw-extrabold rounded-3 font-monospace shadow-none"
                        style={{
                          fontSize: 32,
                          letterSpacing: 12,
                          background: '#080c14',
                          color: '#00e676',
                          border: '2px solid #00e676',
                          minHeight: 56
                        }}
                        placeholder="••••"
                        value={deliveryOtp}
                        onChange={(e) => setDeliveryOtp(e.target.value)}
                      />
                      <small className="text-secondary d-block mt-1 text-center" style={{ fontSize: 11 }}>
                        (Demo Hint: Customer PIN is <strong className="text-success">4829</strong>)
                      </small>
                    </div>

                    {/* Contactless Photo Proof */}
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-light">Contactless Photo Proof (Optional)</label>
                      <div className="d-flex align-items-center gap-3 p-2.5 rounded-3 bg-dark border border-secondary border-opacity-25">
                        {deliveryProofPhoto ? (
                          <img
                            src={deliveryProofPhoto}
                            alt="Proof"
                            className="rounded-3 border border-success"
                            style={{ width: 48, height: 48, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="rounded-3 p-2 bg-secondary bg-opacity-25 text-white">📷</div>
                        )}
                        <label className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold cursor-pointer mb-0">
                          Take Doorstep Photo
                          <input type="file" accept="image/*" className="d-none" onChange={handleProofPhotoUpload} />
                        </label>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary rounded-pill px-4"
                        style={{ minHeight: 46 }}
                        onClick={() => setShowDeliveryModal(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        className="btn btn-success rounded-pill px-4 fw-extrabold text-dark shadow transition hover-lift"
                        style={{ minHeight: 46, background: '#00e676', border: 'none' }}
                        onClick={handleConfirmFinalDelivery}
                      >
                        Confirm Handover & Payout →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default RiderActiveJob;
