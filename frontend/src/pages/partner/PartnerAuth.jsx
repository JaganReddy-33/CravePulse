import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AuthBackground from '../../components/AuthBackground';

const PartnerAuth = ({ initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState('North Indian, Biryani');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user, login, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('redirect') || location.state?.from?.pathname || '/partner';

  // If already logged in as restaurant partner, go directly to kitchen console
  useEffect(() => {
    if (user && user.role === 'RESTAURANT_OWNER') {
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
        if (!restaurantName.trim() || !fssaiLicense.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please enter all required restaurant and contact fields');
        }
        await api.post('/partner/apply', {
          fullName: fullName.trim() || 'Restaurant Partner',
          email: email.trim().toLowerCase(),
          phone: phone.trim() || '+919876543210',
          password,
          restaurantName: restaurantName.trim(),
          fssaiLicense: fssaiLicense.trim(),
          cuisineTypes: cuisineTypes.trim() || 'Multi-Cuisine'
        });
        setSuccessMsg('Partner onboarding application submitted! Your account is in PENDING_KYC status pending admin review.');
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both partner email and password');
        }
        await login(email, password);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Restaurant partner authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setLoading(true);
    setError('');
    try {
      await login('chef@foodanalytics.com', 'Password@123');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo partner login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 position-relative" style={{ background: '#120d08' }}>
      {/* Continuous Looping Ambient Chef Wok Flame Video Background */}
      <AuthBackground role="PARTNER" />

      {/* Main Glassmorphism Form Card */}
      <div 
        className="w-100 position-relative" 
        style={{ 
          maxWidth: 520, 
          zIndex: 10,
          '--auth-focus-color': '#f59e0b',
          '--auth-focus-glow': 'rgba(245, 158, 11, 0.35)'
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-3">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-2">
            <div 
              className="rounded-4 text-white fw-bold d-flex align-items-center justify-content-center shadow-lg"
              style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', fontSize: 24 }}
            >
              🍳
            </div>
            <span className="fs-2 fw-extrabold text-white tracking-tight">CravePulse Kitchen</span>
          </Link>
          <p className="text-light text-opacity-75 small mb-0">
            {isRegister ? 'List your culinary brand with 0% predatory commission' : 'Log in to your live kitchen terminal & order dispatch kanban'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div 
          className="card border-0 rounded-4 shadow-2xl p-4 p-md-5 text-white"
          style={{
            background: 'rgba(24, 18, 12, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Toggle Pills */}
          <div className="d-flex p-1 bg-dark bg-opacity-75 rounded-pill mb-4 border border-secondary border-opacity-50">
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 rounded-pill fw-bold transition ${!isRegister ? 'text-dark shadow-sm' : 'text-light text-opacity-75 border-0'}`}
              style={!isRegister ? { background: '#f59e0b' } : {}}
              onClick={() => { setIsRegister(false); setError(''); }}
            >
              Partner Sign In
            </button>
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 rounded-pill fw-bold transition ${isRegister ? 'text-dark shadow-sm' : 'text-light text-opacity-75 border-0'}`}
              style={isRegister ? { background: '#f59e0b' } : {}}
              onClick={() => { setIsRegister(true); setError(''); }}
            >
              Register Kitchen
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
                  <label className="form-label small fw-semibold text-light text-opacity-90">Restaurant / Kitchen Brand *</label>
                  <div className="auth-unified-input-group">
                    <span className="auth-icon"><i className="bi bi-shop"></i></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Spice Symphony & Grill"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-light text-opacity-90">FSSAI License *</label>
                    <div className="auth-unified-input-group">
                      <span className="auth-icon"><i className="bi bi-patch-check"></i></span>
                      <input
                        type="text"
                        className="auth-input font-monospace"
                        placeholder="14-digit FSSAI"
                        value={fssaiLicense}
                        onChange={(e) => setFssaiLicense(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-light text-opacity-90">Cuisine Specials</label>
                    <div className="auth-unified-input-group">
                      <span className="auth-icon"><i className="bi bi-tag"></i></span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Dum Biryani, Tandoori"
                        value={cuisineTypes}
                        onChange={(e) => setCuisineTypes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light text-opacity-90">Head Chef / Owner Name</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-person-badge"></i></span>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Partner Owner / Head Chef"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light text-opacity-90">Registered Kitchen Email *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="partner@kitchen.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-light text-opacity-90 mb-1">Security Password *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-lock"></i></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter kitchen security password"
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
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
              {isRegister ? 'Submit Partner Application' : 'Open Kitchen Terminal →'}
            </button>
          </form>

          {/* Test Persona Demo Login Card - only visible in demo mode */}
          {isDemoMode && (
            <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: 10, letterSpacing: 0.8 }}>
                  Demo Mode Fast Access
                </span>
                <span className="badge rounded-pill bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50" style={{ fontSize: 10 }}>
                  DEMO MERCHANT
                </span>
              </div>

              <div 
                className="demo-stakeholder-card p-2.5 d-flex align-items-center justify-content-between cursor-pointer"
                onClick={handleDemoFill}
              >
                <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold flex-shrink-0"
                    style={{ width: 36, height: 36, background: '#f59e0b' }}
                  >
                    👨‍🍳
                  </div>
                  <div className="text-truncate">
                    <div className="fw-bold text-white small lh-1 mb-1">Demo Partner Restaurant</div>
                    <div className="text-light text-opacity-60 text-truncate" style={{ fontSize: 11 }}>
                      chef@foodanalytics.com
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 fw-bold flex-shrink-0 ms-2"
                  style={{ fontSize: 11 }}
                  disabled={loading}
                >
                  Access →
                </button>
              </div>
            </div>
          )}

          <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-25 small text-light text-opacity-60">
            <Link to="/" className="text-secondary text-decoration-none me-2 hover-underline">← Back to Customer App</Link>
            <span>•</span>
            <Link to="/rider/login" className="text-success text-decoration-none ms-2 hover-underline">Rider Fleet Login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerAuth;
