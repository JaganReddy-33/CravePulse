import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DEFAULT_ADDRESSES = [
  {
    id: 1,
    title: 'Home',
    addressLine: 'Apartment 402, Sunshine Heights, 12th Main Road',
    landmark: 'Near 100ft Road junction, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    mapsUrl: 'https://maps.google.com/?q=12.978369,77.640835',
    default: true
  },
  {
    id: 2,
    title: 'Work',
    addressLine: 'WeWork Galaxy, 43 Residency Road, Shanthala Nagar',
    landmark: 'Opposite Bangalore Club',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560025',
    mapsUrl: 'https://maps.google.com/?q=12.9698,77.6045',
    default: false
  },
  {
    id: 3,
    title: 'Other',
    addressLine: 'Plot 88, Jubilee Hills Road No. 36',
    landmark: 'Near Peddamma Temple',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500033',
    mapsUrl: 'https://maps.google.com/?q=17.4319,78.4073',
    default: false
  },
];

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
];

const CustomerProfile = () => {
  const { user, login } = useAuth();

  // Personal Profile Details Form State
  const [fullName, setFullName] = useState(() => {
    return user?.fullName || localStorage.getItem('cravepulse_user_name') || 'Jaganmohan Reddy';
  });
  const [email, setEmail] = useState(() => {
    return user?.email || localStorage.getItem('cravepulse_user_email') || 'jaganmohan.reddy@cravepulse.in';
  });
  const [phone, setPhone] = useState(() => {
    return user?.phone || localStorage.getItem('cravepulse_user_phone') || '+91 98490 12345';
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return user?.avatarUrl || localStorage.getItem('cravepulse_user_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  });

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [saveToast, setSaveToast] = useState('');

  // Addresses State
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('cravepulse_addresses');
    return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
  });

  // Add Address Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Home');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newPostalCode, setNewPostalCode] = useState('560038');
  const [newMapsUrl, setNewMapsUrl] = useState('');

  const [walletBalance, setWalletBalance] = useState(250.00);

  const showNotification = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3500);
  };

  const handlePhotoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image file under 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result);
        showNotification('✓ Photo selected & previewed! Click "Save Details" to persist.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    localStorage.setItem('cravepulse_user_name', fullName.trim());
    localStorage.setItem('cravepulse_user_email', email.trim());
    localStorage.setItem('cravepulse_user_phone', phone.trim());
    localStorage.setItem('cravepulse_user_avatar', avatarUrl.trim());

    // Update session storage & user object
    if (user) {
      const updatedUser = {
        ...user,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim()
      };
      sessionStorage.setItem('cravepulse_user', JSON.stringify(updatedUser));
    }

    setIsEditingPersonal(false);
    showNotification('Profile details updated successfully!');
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddressLine.trim()) return;

    let finalMapsUrl = newMapsUrl.trim();
    if (!finalMapsUrl) {
      // Auto-generate Google Maps Search link if not provided
      finalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newAddressLine}, ${newLandmark || ''}, ${newCity}`)}`;
    }

    const newAddr = {
      id: Date.now(),
      title: newTitle,
      addressLine: newAddressLine.trim(),
      landmark: newLandmark.trim(),
      city: newCity,
      state: 'Karnataka',
      postalCode: newPostalCode.trim(),
      mapsUrl: finalMapsUrl,
      default: false
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    localStorage.setItem('cravepulse_addresses', JSON.stringify(updated));

    try {
      await api.post('/auth/addresses', newAddr);
    } catch (err) {
      console.warn('API offline, address saved locally', err);
    }

    setNewAddressLine('');
    setNewLandmark('');
    setNewMapsUrl('');
    setShowAddModal(false);
    showNotification('New delivery address with Google Maps link saved!');
  };

  const handleDeleteAddress = (id) => {
    const filtered = addresses.filter(a => a.id !== id);
    setAddresses(filtered);
    localStorage.setItem('cravepulse_addresses', JSON.stringify(filtered));
    showNotification('Address removed');
  };

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: 880 }}>
      {/* Toast Notification */}
      {saveToast && (
        <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 1090 }}>
          <div className="toast show align-items-center text-white bg-success border-0 shadow-lg rounded-3">
            <div className="d-flex">
              <div className="toast-body fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-5"></i>
                {saveToast}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setSaveToast('')}></button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <img
              src={avatarUrl}
              alt={fullName}
              className="rounded-circle shadow-sm object-fit-cover border border-3 border-white"
              style={{ width: 72, height: 72 }}
            />
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-extrabold text-dark mb-0">{fullName}</h4>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0"
                  style={{ fontSize: 11 }}
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                >
                  <i className="bi bi-pencil me-1"></i>Edit
                </button>
              </div>
              <span className="text-muted small d-block mb-1">{email} • {phone}</span>
              <span className="badge bg-success-subtle text-success border border-success small">
                ✓ Verified CravePulse Member
              </span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link to="/orders" className="btn btn-outline-primary rounded-pill px-4 btn-sm fw-bold">
              My Orders
            </Link>
            <button
              onClick={() => setIsEditingPersonal(!isEditingPersonal)}
              className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
            >
              {isEditingPersonal ? 'Close Form' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* 1. Personal Details Edit Form */}
        {isEditingPersonal && (
          <div className="mt-4 pt-4 border-top">
            <h6 className="fw-bold text-dark mb-3">Edit Personal Details</h6>
            <form onSubmit={handleSavePersonal}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Full Name / Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Upload Profile Photo (File) *</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handlePhotoFileUpload}
                  />
                  <small className="text-muted" style={{ fontSize: 11 }}>
                    Select any JPG, PNG, or WEBP image from your device.
                  </small>
                </div>

                {/* Quick Avatar Presets */}
                <div className="col-12">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label small text-muted mb-0">Or pick a verified persona avatar:</label>
                    {avatarUrl && (
                      <span className="badge bg-success-subtle text-success small">
                        ✓ Photo Ready
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    {AVATAR_OPTIONS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="avatar preset"
                        className={`rounded-circle cursor-pointer border ${avatarUrl === url ? 'border-primary border-3 shadow-sm' : 'border-light'}`}
                        style={{ width: 44, height: 44, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setAvatarUrl(url)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4 btn-sm"
                  onClick={() => setIsEditingPersonal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success rounded-pill px-4 btn-sm fw-bold shadow-sm"
                >
                  Save Personal Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Wallet & Quick Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-bold text-uppercase">CravePulse Digital Wallet</span>
              <span className="badge bg-success">Active & Ready</span>
            </div>
            <h2 className="fw-extrabold text-dark mb-1">₹{walletBalance.toFixed(2)}</h2>
            <small className="text-muted d-block mb-3">Available for instant 1-tap checkout & 100% goodwill refund credits</small>
            <div className="d-flex gap-2">
              <button 
                type="button"
                className="btn btn-sm btn-light border rounded-pill px-3 fw-bold"
                onClick={() => setWalletBalance(prev => prev + 100)}
              >
                + Add ₹100 Test Credit
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-bold text-uppercase">Fair-Pricing Savings</span>
              <span className="badge bg-primary">0% Markup</span>
            </div>
            <h2 className="fw-extrabold text-success mb-1">₹580 Saved</h2>
            <small className="text-muted d-block mb-3">Protected from 25–40% hidden menu inflations on traditional delivery apps</small>
            <Link to="/offers" className="text-primary small fw-semibold text-decoration-none">
              View Available Super-Saver Coupons →
            </Link>
          </div>
        </div>
      </div>

      {/* Saved Delivery Addresses & Exact Google Maps Links */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold text-dark mb-1">Saved Delivery Addresses</h5>
            <p className="text-muted small mb-0">Delivery partners use your exact Google Maps pin for seamless doorstep arrivals</p>
          </div>
          <button 
            type="button"
            className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
            onClick={() => setShowAddModal(true)}
          >
            + Add New Address
          </button>
        </div>

        <div className="row g-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="col-md-6">
              <div className="card border rounded-4 p-3 h-100 bg-light d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-white text-dark border fw-bold px-3 py-1">
                      {addr.title === 'Home' ? '🏠 Home' : addr.title === 'Work' ? '💼 Work' : '📍 ' + addr.title}
                    </span>
                    {addr.default && <span className="badge bg-primary-subtle text-primary small">Default</span>}
                  </div>
                  <p className="text-dark fw-bold small mb-1">{addr.addressLine}</p>
                  {addr.landmark && <small className="text-muted d-block mb-1">Landmark: {addr.landmark}</small>}
                  <small className="text-muted d-block mb-3">{addr.city}, {addr.state} - {addr.postalCode}</small>

                  {/* Clickable Google Maps Pin for Rider & Customer */}
                  {addr.mapsUrl ? (
                    <a
                      href={addr.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-white bg-white border text-primary rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                      style={{ fontSize: 11 }}
                    >
                      <i className="bi bi-geo-alt-fill text-danger"></i>
                      <span>Open in Google Maps ↗</span>
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.addressLine}, ${addr.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-white bg-white border text-primary rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                      style={{ fontSize: 11 }}
                    >
                      <i className="bi bi-geo-alt-fill text-danger"></i>
                      <span>Locate on Map ↗</span>
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-2 border-top d-flex justify-content-end gap-2">
                  <button 
                    type="button"
                    className="btn btn-sm btn-link text-danger p-0 text-decoration-none small fw-semibold"
                    onClick={() => handleDeleteAddress(addr.id)}
                  >
                    Delete Address
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Address Modal with Google Maps Link Input */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0 text-dark">Add New Delivery Location</h5>
                  <small className="text-muted">Enter your flat details and paste a Google Maps location link for the rider</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleAddAddress}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Address Category</label>
                  <div className="d-flex gap-2">
                    {['Home', 'Work', 'Gym', 'Parents', 'Other'].map(type => (
                      <button
                        type="button"
                        key={type}
                        className={`btn btn-sm rounded-pill px-3 fw-bold ${newTitle === type ? 'btn-primary' : 'btn-light border'}`}
                        style={newTitle === type ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
                        onClick={() => setNewTitle(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Flat / House No, Building & Street Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Flat 301, Lakeview Apts, 100ft Road"
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-dark">Landmark</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Near Indiranagar Metro"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">City</label>
                    <select className="form-select" value={newCity} onChange={(e) => setNewCity(e.target.value)}>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi-NCR">Delhi-NCR</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Pune">Pune</option>
                      <option value="Visakhapatnam">Visakhapatnam</option>
                      <option value="Vijayawada">Vijayawada</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Google Maps Location Link Input */}
                <div className="mb-3 p-3 rounded-4 bg-light border border-primary-subtle">
                  <label className="form-label small fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt-fill text-danger"></i>
                    <span>Google Maps / Live GPS Location Link (Recommended)</span>
                  </label>
                  <input
                    type="url"
                    className="form-control mb-1"
                    placeholder="https://maps.google.com/?q=12.978369,77.640835 or https://maps.app.goo.gl/..."
                    value={newMapsUrl}
                    onChange={(e) => setNewMapsUrl(e.target.value)}
                  />
                  <small className="text-muted d-block" style={{ fontSize: 11 }}>
                    💡 <strong>Tip:</strong> Open Google Maps on your phone or browser, drop a pin on your building entrance, click <strong>Share → Copy Link</strong>, and paste it here. Delivery captains like Prasad Rao can tap this link for turn-by-turn navigation!
                  </small>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
