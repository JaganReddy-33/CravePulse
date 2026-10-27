import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthBackground from '../../components/AuthBackground';

const RiderAuth = ({ initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('ELECTRIC_BIKE');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [cityZone, setCityZone] = useState('Indiranagar, Bengaluru');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user, login, register, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('redirect') || location.state?.from?.pathname || '/rider';

  // If already logged in as fleet captain, go directly to cockpit
  useEffect(() => {
    if (user && user.role === 'RIDER') {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim() || !email.trim() || !drivingLicense.trim() || !password.trim()) {
          throw new Error('Please fill in your name, license number, email and password');
        }
        await register(
          fullName || 'Prasad Rao',
          email,
          phone || '+91 98490 56789',
          password,
          'RIDER'
        );
        setSuccessMsg('Rider application registered! Connecting to fleet network...');
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter rider registered email and password');
        }
        await login(email, password);
      }
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err) {
      setError(err.message || 'Delivery fleet authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setLoading(true);
    setError('');
    try {
      await switchDemoRole('RIDER');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo fleet login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 position-relative" style={{ background: '#071118' }}>
      {/* Continuous Looping Night Fleet Highway Video Background */}
      <AuthBackground role="RIDER" />

      {/* Main Glassmorphism Form Card */}
      <div 
        className="w-100 position-relative" 
        style={{ 
          maxWidth: 520, 
          zIndex: 10,
          '--auth-focus-color': '#00e676',
          '--auth-focus-glow': 'rgba(0, 230, 118, 0.35)'
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-3">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-2">
            <div 
              className="rounded-4 text-dark fw-bold d-flex align-items-center justify-content-center shadow-lg"
              style={{ width: 48, height: 48, background: '#00e676', fontSize: 24 }}
            >
              ⚡
            </div>
            <span className="fs-2 fw-extrabold text-white tracking-tight">CravePulse Fleet</span>
          </Link>
          <p className="text-light text-opacity-75 small mb-0">
            {isRegister ? 'Join India’s Highest-Paying Delivery Fleet • Zero Arbitrary Penalties' : 'Log in to your Captain Cockpit, live dispatch radar & payout wallet'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div 
          className="card border-0 rounded-4 shadow-2xl p-4 p-md-5 text-white"
          style={{
            background: 'rgba(10, 20, 28, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 230, 118, 0.25)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
          }}
        >
          {/* Toggle Pills */}
          <div className="d-flex p-1 bg-dark bg-opacity-75 rounded-pill mb-4 border border-secondary border-opacity-50">
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 rounded-pill fw-bold transition ${!isRegister ? 'text-dark shadow-sm' : 'text-light text-opacity-75 border-0'}`}
              style={!isRegister ? { background: '#00e676' } : {}}
              onClick={() => { setIsRegister(false); setError(''); }}
            >
              Captain Sign In
            </button>
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 rounded-pill fw-bold transition ${isRegister ? 'text-dark shadow-sm' : 'text-light text-opacity-75 border-0'}`}
              style={isRegister ? { background: '#00e676' } : {}}
              onClick={() => { setIsRegister(true); setError(''); }}
            >
              Join the Fleet
            </button>
          </div>

          {error && (
            <div className="alert alert-danger py-2.5 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3 bg-danger bg-opacity-25 border border-danger text-white">
              <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success py-2.5 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3 bg-success bg-opacity-25 border border-success text-white">
              <i className="bi bi-check-circle-fill text-success flex-shrink-0"></i>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-light text-opacity-90">Captain Full Name *</label>
                  <div className="auth-unified-input-group">
                    <span className="auth-icon"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Prasad Rao"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-light text-opacity-90">Driving License No. *</label>
                    <div className="auth-unified-input-group">
                      <span className="auth-icon"><i className="bi bi-card-text"></i></span>
                      <input
                        type="text"
                        className="auth-input font-monospace text-uppercase"
                        placeholder="KA-03-2022-9988"
                        value={drivingLicense}
                        onChange={(e) => setDrivingLicense(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-light text-opacity-90">Vehicle Fleet Type</label>
                    <div className="auth-unified-input-group">
                      <span className="auth-icon"><i className="bi bi-bicycle"></i></span>
                      <select
                        className="auth-input bg-transparent"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        style={{ color: '#ffffff' }}
                      >
                        <option value="ELECTRIC_BIKE" className="bg-dark text-white">⚡ Ather / Ola EV</option>
                        <option value="PETROL_BIKE" className="bg-dark text-white">🛵 Motorcycle / Scooter</option>
                        <option value="BICYCLE" className="bg-dark text-white">🚲 Cycle (Eco Fleet)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light text-opacity-90">Captain Registered Email *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="prasad.rao@cravepulse.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-light text-opacity-90 mb-1">Access Passcode *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-lock"></i></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter captain passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-link p-0 text-light text-opacity-75 text-decoration-none border-0"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-100 py-3 rounded-pill fw-bold text-dark shadow-lg mb-3 border-0 transition hover-lift"
              style={{ background: '#00e676' }}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
              {isRegister ? 'Submit Captain Onboarding' : 'Enter Captain Cockpit ⚡'}
            </button>
          </form>

          {/* Test Persona 1-Click Login Card */}
          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: 10, letterSpacing: 0.8 }}>
                Verified Fleet Captain Demo
              </span>
              <span className="badge rounded-pill bg-success bg-opacity-25 text-success border border-success border-opacity-50" style={{ fontSize: 10 }}>
                1-CLICK LOGIN
              </span>
            </div>

            <div 
              className="demo-stakeholder-card p-2.5 d-flex align-items-center justify-content-between cursor-pointer"
              onClick={handleDemoFill}
            >
              <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
                  alt="Prasad Rao"
                  className="rounded-circle border border-success flex-shrink-0"
                  style={{ width: 36, height: 36, objectFit: 'cover' }}
                />
                <div className="text-truncate">
                  <div className="fw-bold text-white small lh-1 mb-1">Captain Prasad Rao</div>
                  <div className="text-light text-opacity-60 text-truncate" style={{ fontSize: 11 }}>
                    prasad.rao@cravepulse.in
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold flex-shrink-0 ms-2"
                style={{ fontSize: 11 }}
                disabled={loading}
              >
                Launch →
              </button>
            </div>
          </div>

          <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-25 small text-light text-opacity-60">
            <Link to="/" className="text-secondary text-decoration-none me-2 hover-underline">← Back to Customer App</Link>
            <span>•</span>
            <Link to="/partner/login" className="text-warning text-decoration-none ms-2 hover-underline">Kitchen Login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderAuth;
