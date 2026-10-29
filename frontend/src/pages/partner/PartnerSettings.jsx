import ChangePassword from '../../components/ChangePassword';
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PartnerSettings = () => {
  const { restaurant, refreshRestaurant } = useOutletContext();
  const restId = restaurant?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Restaurant Profile Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [commissionRate, setCommissionRate] = useState(15.00);
  const [autoRejectMinutes, setAutoRejectMinutes] = useState(10);

  // Bank & UPI Settlement Fields
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBeneficiaryName, setBankBeneficiaryName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isMaskedAccount, setIsMaskedAccount] = useState(true);

  // Operating Hours
  const [operatingHours, setOperatingHours] = useState([]);

  // Payout Settlements Ledger
  const [payouts, setPayouts] = useState([]);

  const fetchSettingsAndData = async () => {
    if (!restId) return;
    try {
      setLoading(true);
      const [settingsRes, payoutsRes] = await Promise.all([
        api.get(`/restaurants/${restId}/settings`),
        api.get(`/restaurants/${restId}/payouts`)
      ]);

      if (settingsRes.success && settingsRes.data) {
        const s = settingsRes.data;
        setName(s.name || '');
        setPhone(s.phone || '');
        setAddress(s.address || '');
        setBannerImage(s.bannerImage || '');
        setFssaiLicense(s.fssaiLicense || '');
        setGstNumber(s.gstNumber || '');
        setCommissionRate(s.commissionRate || 15.00);
        setAutoRejectMinutes(s.autoRejectMinutes || 10);
        setBankAccountNumber(s.bankAccountNumber || '');
        setBankIfsc(s.bankIfsc || '');
        setBankBeneficiaryName(s.bankBeneficiaryName || '');
        setUpiId(s.upiId || '');
        setIsMaskedAccount(!!(s.bankAccountNumber && s.bankAccountNumber.includes('•')));

        if (Array.isArray(s.operatingHours) && s.operatingHours.length > 0) {
          setOperatingHours(s.operatingHours);
        } else {
          // Initialize default hours Monday-Sunday 10:00 to 23:00
          setOperatingHours(DAYS_OF_WEEK.map(day => ({
            dayOfWeek: day,
            openTime: '10:00',
            closeTime: '23:00',
            isClosed: false
          })));
        }
      }

      if (payoutsRes.success && Array.isArray(payoutsRes.data)) {
        setPayouts(payoutsRes.data);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
      setErrorMsg(e.message || 'Error loading settings from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndData();
  }, [restId]);

  const handleHourChange = (index, field, value) => {
    setOperatingHours(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!restId) return;

    try {
      setSaving(true);
      setErrorMsg('');

      // 1. Save restaurant profile & bank settings
      const settingsPayload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        bannerImage: bannerImage.trim(),
        bankAccountNumber: isMaskedAccount ? null : bankAccountNumber.trim(), // Don't overwrite if untouched masked
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankBeneficiaryName: bankBeneficiaryName.trim(),
        upiId: upiId.trim(),
        autoRejectMinutes: Number(autoRejectMinutes) || 10
      };

      await api.post(`/restaurants/${restId}/settings`, settingsPayload);

      // 2. Save operating hours
      await api.post(`/restaurants/${restId}/hours`, operatingHours);

      setSavedMsg('✓ Kitchen configuration, business hours & payout details saved securely to database!');
      if (refreshRestaurant) refreshRestaurant();
      setTimeout(() => setSavedMsg(''), 4000);
      fetchSettingsAndData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-2" style={{ maxWidth: 960 }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2 bg-white p-3 rounded-4 shadow-sm border">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Kitchen & Merchant Profile Studio</h4>
          <p className="text-muted small mb-0">
            Secure regulatory licensing, auto-reject SLA, operating hours schedule, and bank payout details for <strong className="text-dark">{restaurant?.name}</strong>.
          </p>
        </div>
        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
          🔒 Database Backed
        </span>
      </div>

      {savedMsg && (
        <div className="alert alert-success rounded-4 small py-3 px-4 mb-4 d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <span className="fw-bold">{savedMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger rounded-4 small py-3 px-4 mb-4 d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span className="fw-bold">{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-muted small mt-2">Loading restaurant configuration from database...</p>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* Section 1: Kitchen Profile & Brand Identity */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3 text-dark">🏪 Kitchen & Brand Profile</h5>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted">Restaurant Name *</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted">Primary Phone Hotline *</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted">Physical Kitchen Address *</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted">Banner Photography URL (Validated HTTP/HTTPS)</label>
                <input
                  type="url"
                  className="form-control rounded-3"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                />
                {bannerImage && (
                  <div className="mt-2 rounded-3 overflow-hidden border" style={{ height: 120 }}>
                    <img src={bannerImage} alt="Banner Preview" className="w-100 h-100 object-fit-cover" />
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted">FSSAI License # (Read-Only Audit)</label>
                <input
                  type="text"
                  className="form-control rounded-3 bg-light"
                  value={fssaiLicense}
                  disabled
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted">GST Identification #</label>
                <input
                  type="text"
                  className="form-control rounded-3 bg-light"
                  value={gstNumber || 'Unregistered'}
                  disabled
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold text-muted">Auto-Reject SLA (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  className="form-control rounded-3"
                  value={autoRejectMinutes}
                  onChange={(e) => setAutoRejectMinutes(e.target.value)}
                />
                <small className="text-muted" style={{ fontSize: 11 }}>Orders cancel automatically if not accepted in SLA</small>
              </div>
            </div>
          </div>

          {/* Section 2: Bank Account & UPI Settlement Details */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">🏦 Payout Bank & UPI Settlement</h5>
                <small className="text-muted">Banking details are available to authorized account operations.</small>
              </div>
              <span className="badge bg-light text-muted border small">T+1 Daily Settlement</span>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted">Bank Beneficiary Name</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="e.g. Gourmet Kitchens Pvt Ltd"
                  value={bankBeneficiaryName}
                  onChange={(e) => setBankBeneficiaryName(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted">Bank IFSC Code</label>
                <input
                  type="text"
                  className="form-control rounded-3 font-monospace text-uppercase"
                  placeholder="e.g. HDFC0001234"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted">Bank Account Number</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control rounded-start-3 font-monospace"
                    placeholder="Enter account number"
                    value={bankAccountNumber}
                    onChange={(e) => {
                      setBankAccountNumber(e.target.value);
                      setIsMaskedAccount(false);
                    }}
                  />
                  {isMaskedAccount && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-end-3 small"
                      onClick={() => {
                        setBankAccountNumber('');
                        setIsMaskedAccount(false);
                      }}
                    >
                      Change
                    </button>
                  )}
                </div>
                <small className="text-muted" style={{ fontSize: 11 }}>Masked for security compliance</small>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-muted">Direct UPI ID for Instant Settlements</label>
                <input
                  type="text"
                  className="form-control rounded-3 font-monospace"
                  placeholder="e.g. restaurant@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <small className="text-muted" style={{ fontSize: 11 }}>Supports Google Pay, PhonePe, and BHIM UPI</small>
              </div>
            </div>
          </div>

          {/* Section 3: Weekly Operating Hours Schedule */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <h5 className="fw-bold mb-1 text-dark">⏰ Weekly Business Hours Schedule</h5>
            <small className="text-muted mb-3 d-block">
              Orders will only be allowed during active kitchen business windows.
            </small>

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Day of Week</th>
                    <th>Status</th>
                    <th>Opening Time</th>
                    <th>Closing Time</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {operatingHours.map((oh, idx) => (
                    <tr key={oh.dayOfWeek || idx}>
                      <td className="fw-bold text-dark">{oh.dayOfWeek}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!oh.isClosed}
                            onChange={(e) => handleHourChange(idx, 'isClosed', !e.target.checked)}
                          />
                          <label className="form-check-label small">
                            {oh.isClosed ? 'Closed' : 'Open'}
                          </label>
                        </div>
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control form-control-sm rounded-2"
                          disabled={oh.isClosed}
                          value={oh.openTime || '10:00'}
                          onChange={(e) => handleHourChange(idx, 'openTime', e.target.value)}
                          style={{ width: 130 }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control form-control-sm rounded-2"
                          disabled={oh.isClosed}
                          value={oh.closeTime || '23:00'}
                          onChange={(e) => handleHourChange(idx, 'closeTime', e.target.value)}
                          style={{ width: 130 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="text-end mb-5">
            <button
              type="submit"
              className="btn btn-danger rounded-pill px-5 py-2 fw-bold shadow-sm"
              style={{ background: '#ff5c35' }}
              disabled={saving}
            >
              {saving ? 'Saving to Database...' : 'Save Configuration & Hours'}
            </button>
          </div>
        </form>
      )}

      {/* Section 4: Settlement Payout Ledger & Statements */}
      <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">📜 Payout Ledger & Settlement Statements</h5>
            <small className="text-muted">Certified banking payout statements transferred to partner bank/UPI.</small>
          </div>
          <span className="badge bg-light text-muted border small">{payouts.length} Settlements</span>
        </div>

        {payouts.length === 0 ? (
          <div className="text-center py-4 text-muted small bg-light rounded-3 border">
            No bank payouts processed yet. Settlements appear when processed.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Payout Ref #</th>
                  <th>Settlement Period</th>
                  <th className="text-end">Gross Sales</th>
                  <th className="text-end">Commission (15%)</th>
                  <th className="text-end">Net Payout</th>
                  <th>Status</th>
                  <th>Bank UTR #</th>
                </tr>
              </thead>
              <tbody className="small">
                {payouts.map((p, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-dark font-monospace">{p.payoutReference}</td>
                    <td className="text-muted">{p.periodStart} to {p.periodEnd}</td>
                    <td className="text-end">₹{Number(p.grossSales).toFixed(2)}</td>
                    <td className="text-end text-muted">-₹{Number(p.commissionAmount).toFixed(2)}</td>
                    <td className="text-end fw-bold text-success">₹{Number(p.netPayout).toFixed(2)}</td>
                    <td>
                      <span className={`badge rounded-pill ${p.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="font-monospace text-muted small">{p.utrNumber || 'Processing'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ChangePassword />
    </div>
  );
};

export default PartnerSettings;
