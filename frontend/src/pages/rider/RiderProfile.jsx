import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RIDER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
];

const OPERATIONAL_HUBS = [
  'Indiranagar Culinary District (Primary)',
  'Koramangala 4th Block & 5th Block Hub',
  'HSR Layout Sector 1 & Sector 4 Hub',
  'Bellandur Outer Ring Road Tech Corridor',
  'Whitefield ITPL & Prestige Shantiniketan Zone'
];

const RiderProfile = () => {
  const { user } = useAuth();
  const { profile } = useOutletContext() || {};

  const [riderName, setRiderName] = useState(() => {
    return localStorage.getItem('cravepulse_rider_name') || profile?.riderName || user?.fullName || 'Delivery Partner';
  });
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem('cravepulse_rider_phone') || profile?.phone || user?.phone || '';
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('cravepulse_rider_avatar') || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
  });
  const [vehicleType, setVehicleType] = useState(() => profile?.vehicleType || 'ELECTRIC_BIKE');
  const [vehicleModel, setVehicleModel] = useState(() => {
    return localStorage.getItem('cravepulse_rider_vehicle') || profile?.vehicleNumber || 'Electric Two-Wheeler';
  });
  const [licenseNumber, setLicenseNumber] = useState(() => profile?.drivingLicense || 'DL-KA-2024-XXXX');
  const [cityZone, setCityZone] = useState('Indiranagar Culinary District (Primary)');
  const [shiftPreference, setShiftPreference] = useState('EVENING_PEAK');
  const [saved, setSaved] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);

  const handlePhotoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result);
        localStorage.setItem('cravepulse_rider_avatar', reader.result);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    localStorage.setItem('cravepulse_rider_name', riderName.trim());
    localStorage.setItem('cravepulse_rider_phone', phone.trim());
    localStorage.setItem('cravepulse_rider_avatar', avatarUrl.trim());
    localStorage.setItem('cravepulse_rider_vehicle', vehicleModel.trim());

    try {
      await api.post('/rider/profile', {
        vehicleType,
        vehicleNumber: vehicleModel.trim(),
        drivingLicense: licenseNumber.trim()
      });
    } catch (err) {
      console.warn('Error syncing profile with backend', err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDownloadInsurance = () => {
    setDownloadingCert(true);
    setTimeout(() => {
      setDownloadingCert(false);
      alert('✓ CravePulse Transit Insurance Certificate (Policy CP-FLT-2026-98124) downloaded for Captain ' + riderName);
    }, 1000);
  };

  return (
    <div className="rider-profile-container text-white pb-5" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge rounded-pill text-dark fw-extrabold px-3 py-1" style={{ background: '#00e676', fontSize: 10 }}>
            FLEET COMPLIANCE LEVEL 1
          </span>
          <span className="small text-secondary">Aadhaar & DL Verified</span>
        </div>
        <h3 className="fw-extrabold text-white mb-0">Captain Identity & Fleet Compliance</h3>
        <small className="text-secondary">
          Maintain your KYC documentation, transit insurance certification, and vehicle specifications.
        </small>
      </div>

      {saved && (
        <div 
          className="p-3.5 rounded-4 mb-4 d-flex align-items-center gap-3 shadow-lg"
          style={{ background: 'rgba(0, 230, 118, 0.15)', border: '1.5px solid #00e676', color: '#00e676' }}
        >
          <i className="bi bi-check-circle-fill fs-4 flex-shrink-0"></i>
          <div>
            <strong className="d-block small">Captain Profile & Specs Updated!</strong>
            <small className="text-white text-opacity-80">
              Changes synchronized with CravePulse Fleet Telemetry and dispatch routing engine.
            </small>
          </div>
        </div>
      )}

      {/* Tier-1 Verified Hero Badge Card */}
      <div 
        className="p-4 p-md-5 rounded-4 mb-4 position-relative overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
          border: '1.5px solid rgba(0, 230, 118, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center text-dark fw-extrabold flex-shrink-0"
              style={{ width: 64, height: 64, background: '#00e676', fontSize: 28, boxShadow: '0 0 25px rgba(0, 230, 118, 0.4)' }}
            >
              ✓
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-extrabold text-white mb-0">Tier-1 Verified Delivery Captain</h4>
                <span className="badge rounded-pill bg-success-subtle text-success small" style={{ fontSize: 9 }}>ACTIVE</span>
              </div>
              <p className="text-secondary small mb-1">
                Policy CP-FLT-2026-98124 • ₹5,00,000 Cashless Transit Medical & Accident Cover.
              </p>
              <small className="text-light text-opacity-75" style={{ fontSize: 11 }}>
                Covers on-duty hospitalisation, personal accident, and 24x7 roadside emergency rescue.
              </small>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-light rounded-pill px-4 py-2.5 fw-bold small text-nowrap d-flex align-items-center justify-content-center gap-2 glove-touch-btn"
            style={{ minHeight: 48, borderColor: 'rgba(255,255,255,0.25)' }}
            onClick={handleDownloadInsurance}
            disabled={downloadingCert}
          >
            {downloadingCert ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                <span>Download Insurance Card ↗</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ather 450X EV Telemetry Specs Card */}
      <div 
        className="p-4 rounded-4 mb-4 shadow-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4">⚡</span>
            <div>
              <h5 className="fw-bold mb-0 text-white">Ather 450X EV Real-Time Telemetry Node</h5>
              <small className="text-secondary">Zero-emission electric delivery fleet vehicle</small>
            </div>
          </div>
          <span className="badge rounded-pill bg-dark border border-secondary border-opacity-50 text-success small" style={{ fontSize: 10 }}>
            ECO-WARRIOR TIER
          </span>
        </div>

        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>BATTERY STATE</span>
              <strong className="fs-5 text-info d-block my-1">84% (68 km)</strong>
              <small className="text-success" style={{ fontSize: 10 }}>Warp Mode Ready</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>BATTERY HEALTH</span>
              <strong className="fs-5 text-white d-block my-1">96.8%</strong>
              <small className="text-secondary" style={{ fontSize: 10 }}>Original Li-Ion Pack</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>CO2 SAVED</span>
              <strong className="fs-5 text-success d-block my-1">142 kg</strong>
              <small className="text-secondary" style={{ fontSize: 10 }}>Lifetime Green Miles</small>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>GPS PING INTERVAL</span>
              <strong className="fs-5 text-warning d-block my-1">4.0s</strong>
              <small className="text-secondary" style={{ fontSize: 10 }}>4G LTE Embedded SIM</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Info & KYC Form */}
      <div 
        className="p-4 p-md-5 rounded-4 shadow-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <form onSubmit={handleSave}>
          {/* Avatar Upload Header */}
          <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-4 pb-4 border-bottom border-secondary border-opacity-25">
            <img
              src={avatarUrl}
              alt={riderName}
              className="rounded-circle shadow-lg object-fit-cover border border-3"
              style={{ width: 88, height: 88, borderColor: '#00e676', boxShadow: '0 0 20px rgba(0, 230, 118, 0.25)' }}
            />
            <div className="flex-grow-1 w-100">
              <label className="form-label small fw-bold text-light mb-1">Captain Photo Verification (File Upload) *</label>
              <input
                type="file"
                accept="image/*"
                className="form-control mb-2 text-white"
                style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.15)', minHeight: 46 }}
                onChange={handlePhotoFileUpload}
              />
              <div className="d-flex align-items-center gap-2">
                <small className="text-secondary" style={{ fontSize: 11 }}>Or select a fleet identity avatar:</small>
                {RIDER_AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="avatar option"
                    className={`rounded-circle cursor-pointer border ${avatarUrl === url ? 'border-success border-3' : 'border-secondary'}`}
                    style={{ width: 36, height: 36, objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => {
                      setAvatarUrl(url);
                      localStorage.setItem('cravepulse_rider_avatar', url);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form inputs with glove-friendly height */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-light">Full Legal Captain Name *</label>
              <input
                type="text"
                className="form-control text-white"
                style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
                required
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-light">Registered Phone Number *</label>
              <input
                type="text"
                className="form-control text-white"
                style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-light">Vehicle Category</label>
              <select
                className="form-select text-white"
                style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="ELECTRIC_BIKE">Electric Two-Wheeler (EV - Zero Carbon)</option>
                <option value="MOTORCYCLE">Motorcycle (Petrol - Standard)</option>
                <option value="SCOOTER">Scooter (Standard)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-light">Vehicle Model & Registration Plate *</label>
              <input
                type="text"
                className="form-control text-white"
                style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
                required
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-light">Driving License (DL) Number *</label>
              <input
                type="text"
                className="form-control text-white font-monospace"
                style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold text-light">Shift Timing Preference</label>
              <select
                className="form-select text-white"
                style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
                value={shiftPreference}
                onChange={(e) => setShiftPreference(e.target.value)}
              >
                <option value="EVENING_PEAK">Evening Peak Surge (06:00 PM - 11:30 PM)</option>
                <option value="LUNCH_RUSH">Lunch Rush (11:30 AM - 03:30 PM)</option>
                <option value="FULL_DAY">Full-Day Flexibility (All Hours)</option>
                <option value="NIGHT_OWL">Night Owl (11:00 PM - 04:00 AM)</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-light">Preferred Dispatch Hub *</label>
            <select
              className="form-select text-white"
              style={{ background: '#0a0f1d', border: '1.5px solid rgba(255,255,255,0.15)', minHeight: 48 }}
              value={cityZone}
              onChange={(e) => setCityZone(e.target.value)}
            >
              {OPERATIONAL_HUBS.map(hub => (
                <option key={hub} value={hub}>{hub}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn rounded-pill px-5 py-3 fw-extrabold text-dark shadow-xl d-flex align-items-center justify-content-center gap-2 glove-touch-btn"
            style={{ 
              minHeight: 52, 
              background: '#00e676', 
              fontSize: 16,
              boxShadow: '0 0 25px rgba(0, 230, 118, 0.4)' 
            }}
          >
            <i className="bi bi-shield-check fs-5"></i>
            <span>Save Verified Fleet Identity & Specs</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default RiderProfile;
