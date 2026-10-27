import React, { useState } from 'react';

const CHEF_AVATARS = [
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150',
  'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=150',
  'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=150',
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150',
];

const PartnerSettings = () => {
  const [restaurantName, setRestaurantName] = useState(() => {
    return localStorage.getItem('cravepulse_partner_rest_name') || 'Spice Symphony & Grill';
  });
  const [headChefName, setHeadChefName] = useState(() => {
    return localStorage.getItem('cravepulse_partner_chef_name') || 'Chef Lohith';
  });
  const [headChefPhoto, setHeadChefPhoto] = useState(() => {
    return localStorage.getItem('cravepulse_partner_chef_photo') || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150';
  });
  const [bannerPhoto, setBannerPhoto] = useState(() => {
    return localStorage.getItem('cravepulse_partner_banner') || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200';
  });
  const [fssaiLicense, setFssaiLicense] = useState('FSSAI-11223344556677');
  const [phone, setPhone] = useState('+91 98490 11223');
  const [address, setAddress] = useState('Plot 88, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru');
  const [commissionRate, setCommissionRate] = useState(15.00);
  const [isThrottled, setIsThrottled] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [bankAccount, setBankAccount] = useState(() => {
    return localStorage.getItem('cravepulse_partner_bank') || '50200088129931';
  });
  const [bankIfsc, setBankIfsc] = useState(() => {
    return localStorage.getItem('cravepulse_partner_ifsc') || 'HDFC0001234';
  });
  const [payoutUpi, setPayoutUpi] = useState(() => {
    return localStorage.getItem('cravepulse_partner_upi') || 'lohith.kitchen@okhdfcbank';
  });
  const [payoutUpiProvider, setPayoutUpiProvider] = useState('gpay');

  const handleChefPhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setHeadChefPhoto(reader.result);
        setSavedMsg('✓ Head Chef photo selected & previewed! Click "Save Configuration" to persist.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerPhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBannerPhoto(reader.result);
        setSavedMsg('✓ Restaurant banner photo selected & previewed! Click "Save Configuration" to persist.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('cravepulse_partner_rest_name', restaurantName.trim());
    localStorage.setItem('cravepulse_partner_chef_name', headChefName.trim());
    localStorage.setItem('cravepulse_partner_chef_photo', headChefPhoto.trim());
    localStorage.setItem('cravepulse_partner_banner', bannerPhoto.trim());
    localStorage.setItem('cravepulse_partner_bank', bankAccount.trim());
    localStorage.setItem('cravepulse_partner_ifsc', bankIfsc.trim());
    localStorage.setItem('cravepulse_partner_upi', payoutUpi.trim());

    setSavedMsg('Kitchen configuration, Payout Bank/UPI & Head Chef profile updated successfully!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 880 }}>
      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark">Kitchen & Merchant Profile Studio</h4>
        <p className="text-muted small mb-0">Manage Head Chef identity, restaurant photography, regulatory FSSAI licenses, and order throttling</p>
      </div>

      {savedMsg && (
        <div className="alert alert-success rounded-4 small py-3 px-4 mb-4 d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <span className="fw-bold">{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Head Chef Profile Card & Photo Form */}
        <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
          <h5 className="fw-bold mb-3 text-dark">👨‍🍳 Head Chef & Culinary Leadership</h5>
          
          <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-4 pb-3 border-bottom">
            <img
              src={headChefPhoto}
              alt={headChefName}
              className="rounded-circle shadow-sm object-fit-cover border border-3 border-warning"
              style={{ width: 84, height: 84 }}
            />
            <div className="flex-grow-1 w-100">
              <label className="form-label small fw-bold text-dark">Upload Head Chef Photo (File) *</label>
              <input
                type="file"
                accept="image/*"
                className="form-control mb-2"
                onChange={handleChefPhotoFile}
              />
              <div className="d-flex align-items-center gap-2">
                <small className="text-muted" style={{ fontSize: 11 }}>Or select a master chef avatar:</small>
                {CHEF_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="chef preset"
                    className={`rounded-circle cursor-pointer border ${headChefPhoto === url ? 'border-primary border-3' : 'border-light'}`}
                    style={{ width: 36, height: 36, objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setHeadChefPhoto(url)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-dark">Head Chef Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={headChefName}
                onChange={(e) => setHeadChefName(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-dark">Kitchen Direct Phone *</label>
              <input
                type="text"
                className="form-control"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Restaurant Details & Banner Photo */}
        <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
          <h5 className="fw-bold mb-3 text-dark">Dining Establishment & Photography</h5>
          
          <div className="mb-4">
            <label className="form-label small fw-bold text-dark">Upload Restaurant Cover Banner Photo (File) *</label>
            <input
              type="file"
              accept="image/*"
              className="form-control mb-2"
              onChange={handleBannerPhotoFile}
            />
            {bannerPhoto && (
              <div className="rounded-3 overflow-hidden shadow-sm" style={{ maxHeight: 180 }}>
                <img src={bannerPhoto} alt="Cover preview" className="w-100 h-100 object-fit-cover" style={{ maxHeight: 180 }} />
              </div>
            )}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold text-dark">Restaurant Brand Name</label>
              <input
                type="text"
                className="form-control"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-dark">FSSAI License No</label>
              <input
                type="text"
                className="form-control font-monospace"
                required
                value={fssaiLicense}
                onChange={(e) => setFssaiLicense(e.target.value)}
              />
              <small className="text-success small fw-semibold">✓ Verified with FSSAI Regulatory Portal</small>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-dark">Physical Dining Table Address</label>
            <input
              type="text"
              className="form-control"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="p-3 bg-light rounded-3 small mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong className="text-dark">Platform Commission Tier</strong>
                <p className="text-muted mb-0 small">Capped at 15% (Strict CravePulse anti-monopoly fair trade protocol)</p>
              </div>
              <span className="badge bg-success rounded-pill px-3 py-2 fs-6">15.0% Fixed</span>
            </div>
          </div>
        </div>

        {/* Merchant Bank & UPI Settlement Payout Configuration */}
        <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <span className="fs-5">🏦</span>
              <span>Merchant Bank & Real-Time UPI Settlement Escrow</span>
            </h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill fw-bold small">
              ✓ Penny-Drop Verified
            </span>
          </div>
          <p className="text-muted small mb-3">
            100% of food charges & packaging fees are remitted directly to your bank account with zero delay and 0% markup deductions.
          </p>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">Primary Current / Savings Account Number *</label>
              <input
                type="text"
                className="form-control font-monospace"
                required
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
              <small className="text-muted" style={{ fontSize: 11 }}>HDFC Bank Ltd • Indiranagar Branch</small>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold text-dark">Bank IFSC Code *</label>
              <input
                type="text"
                className="form-control font-monospace text-uppercase"
                required
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
              />
              <small className="text-success small fw-semibold">✓ Verified RTGS/NEFT/IMPS Routing</small>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-dark">Instant Settlement UPI VPA / Handle *</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control font-monospace"
                required
                placeholder="restaurant@okhdfcbank"
                value={payoutUpi}
                onChange={(e) => setPayoutUpi(e.target.value)}
              />
              <span className="input-group-text bg-light text-success fw-bold small">
                <i className="bi bi-shield-check me-1"></i> Active UPI
              </span>
            </div>
            <small className="text-muted" style={{ fontSize: 11 }}>
              Compatible with Google Pay for Business, PhonePe Merchant, Paytm Business, and BHIM UPI.
            </small>
          </div>

          <div className="p-3 rounded-3 bg-light border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-4">⚡</span>
              <div>
                <strong className="d-block small text-dark">Automated Split Ledger Active</strong>
                <small className="text-muted">Orders settled automatically via NPCI Immediate Payment Service (IMPS)</small>
              </div>
            </div>
            <span className="badge bg-dark text-white rounded-pill px-3 py-1.5 small">
              T+0 Same-Day Settlement
            </span>
          </div>
        </div>

        {/* Kitchen Overload Protection Controls */}
        <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold text-dark mb-1">Kitchen Overload Protection Mode</h5>
              <p className="text-muted small mb-0">
                Temporarily pause new incoming orders when your kitchen is at maximum cooking capacity.
              </p>
            </div>
            <div className="form-check form-switch fs-4">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isThrottled}
                onChange={(e) => setIsThrottled(e.target.checked)}
              />
            </div>
          </div>
          {isThrottled && (
            <div className="mt-3 p-3 bg-warning-subtle text-warning-emphasis rounded-3 small border border-warning">
              ⚠️ Kitchen is currently in Overload Protection mode. Customers will see a friendly 5-minute queue advisory.
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm"
          style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
        >
          Save Kitchen & Photo Settings
        </button>
      </form>
    </div>
  );
};

export default PartnerSettings;
