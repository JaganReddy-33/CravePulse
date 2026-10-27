import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthBackground from '../../components/AuthBackground';

const CustomerAuth = ({ initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, login, register, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('redirect') || location.state?.from?.pathname || '/';

  // If already logged in, redirect user directly to target or home
  useEffect(() => {
    if (user) {
      if (user.role === 'RESTAURANT_OWNER') navigate('/partner', { replace: true });
      else if (user.role === 'RIDER') navigate('/rider', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please fill in all required fields');
        }
        await register(fullName, email, phone || '+91 98490 12345', password, 'CUSTOMER');
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password');
        }
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setLoading(true);
    setError('');
    try {
      await switchDemoRole('CUSTOMER');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 position-relative" style={{ background: '#0a0f1d' }}>
      {/* Continuous Looping Ambient Culinary Video Background */}
      <AuthBackground role="CUSTOMER" />

      {/* Main Glassmorphism Form Card */}
      <div 
        className="w-100 position-relative" 
        style={{ 
          maxWidth: 480, 
          zIndex: 10,
          '--auth-focus-color': '#ff5c35',
          '--auth-focus-glow': 'rgba(255, 92, 53, 0.35)'
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-3">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-2">
            <div 
              className="rounded-4 text-white fw-bold d-flex align-items-center justify-content-center shadow-lg"
              style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', fontSize: 24 }}
            >
              🔥
            </div>
            <span className="fs-2 fw-extrabold text-white tracking-tight">CravePulse</span>
          </Link>
          <p className="text-light text-opacity-75 small mb-0">
            {isRegister ? 'Join India’s Fair Food Network • 0% Price Inflation Guarantee' : 'Welcome back! Taste authentic food with direct-from-kitchen pricing'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div 
          className="card border-0 rounded-4 shadow-2xl p-4 p-md-5 text-white"
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)'
          }}
        >
          {/* Toggle Pills */}
          <div className="d-flex p-1 bg-dark bg-opacity-75 rounded-pill mb-4 border border-secondary border-opacity-50">
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 rounded-pill fw-bold transition ${!isRegister ? 'text-white shadow-sm' : 'text-light text-opacity-75 border-0'}`}
              style={!isRegister ? { background: '#ff5c35' } : {}}
              onClick={() => { setIsRegister(false); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 rounded-pill fw-bold transition ${isRegister ? 'text-white shadow-sm' : 'text-light text-opacity-75 border-0'}`}
              style={isRegister ? { background: '#ff5c35' } : {}}
              onClick={() => { setIsRegister(true); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="alert alert-danger py-2.5 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3 bg-danger bg-opacity-25 border border-danger text-white">
              <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="mb-3">
                <label className="form-label small fw-semibold text-light text-opacity-90">Full Name *</label>
                <div className="auth-unified-input-group">
                  <span className="auth-icon"><i className="bi bi-person"></i></span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Jaganmohan Reddy"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light text-opacity-90">Email Address *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="jaganmohan.reddy@cravepulse.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="mb-3">
                <label className="form-label small fw-semibold text-light text-opacity-90">Phone Number (Optional)</label>
                <div className="auth-unified-input-group">
                  <span className="auth-icon text-muted" style={{ fontSize: 13, fontWeight: 700 }}>+91</span>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="98490 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold text-light text-opacity-90 mb-0">Password *</label>
                {!isRegister && (
                  <Link to="/help" className="small text-decoration-none text-light text-opacity-60 hover-underline">Forgot?</Link>
                )}
              </div>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-lock"></i></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your secure password"
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
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-lg mb-3 text-white border-0 transition hover-lift"
              style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)' }}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              ) : null}
              {isRegister ? 'Create CravePulse Account' : 'Sign In to CravePulse'}
            </button>
          </form>

          {/* Test Persona 1-Click Login Card */}
          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: 10, letterSpacing: 0.8 }}>
                Demo Quick Access
              </span>
              <span className="badge rounded-pill bg-primary bg-opacity-25 text-white border border-primary border-opacity-50" style={{ fontSize: 10 }}>
                1-CLICK LOGIN
              </span>
            </div>

            <div 
              className="demo-stakeholder-card p-2.5 d-flex align-items-center justify-content-between cursor-pointer"
              onClick={handleDemoFill}
            >
              <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)' }}
                >
                  JR
                </div>
                <div className="text-truncate">
                  <div className="fw-bold text-white small lh-1 mb-1">Jaganmohan Reddy</div>
                  <div className="text-light text-opacity-60 text-truncate" style={{ fontSize: 11 }}>
                    jaganmohan.reddy@cravepulse.in
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 fw-bold flex-shrink-0 ms-2"
                style={{ fontSize: 11 }}
                disabled={loading}
              >
                Sign In →
              </button>
            </div>
          </div>

          {/* Cross-Portal Switcher */}
          <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-25 small text-light text-opacity-60">
            <span>Are you a partner? </span>
            <Link to="/partner/login" className="text-warning fw-semibold text-decoration-none hover-underline">
              Restaurant Login
            </Link>
            <span className="mx-2">•</span>
            <Link to="/rider/login" className="text-success fw-semibold text-decoration-none hover-underline">
              Fleet Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
