import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthBackground from '../../components/AuthBackground';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('ROOT-SEC-2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('redirect') || location.state?.from?.pathname || '/admin';

  // If already logged in as platform admin, go directly to ops console
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter authorized admin credentials');
      }
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Platform administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setLoading(true);
    setError('');
    try {
      await switchDemoRole('ADMIN');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 position-relative" style={{ background: '#080d1a' }}>
      {/* Continuous Looping Digital Telemetry Cyber Stream Video Background */}
      <AuthBackground role="ADMIN" />

      {/* Main Glassmorphism Form Card */}
      <div 
        className="w-100 position-relative" 
        style={{ 
          maxWidth: 480, 
          zIndex: 10,
          '--auth-focus-color': '#38bdf8',
          '--auth-focus-glow': 'rgba(56, 189, 248, 0.35)'
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-3">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-2">
            <div 
              className="rounded-4 text-white fw-bold d-inline-flex align-items-center justify-content-center shadow-lg"
              style={{ width: 48, height: 48, background: '#1e293d', border: '1px solid #38bdf8', fontSize: 24 }}
            >
              🛡️
            </div>
            <span className="fs-2 fw-extrabold text-white tracking-tight">CravePulse Ops</span>
          </Link>
          <p className="text-light text-opacity-75 small mb-0">
            Restricted Central Control Tower • Authorized Operations Personnel Only
          </p>
        </div>

        {/* Auth Glass Card */}
        <div 
          className="card border-0 rounded-4 shadow-2xl p-4 p-md-5 text-white"
          style={{
            background: 'rgba(13, 20, 36, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-secondary border-opacity-25">
            <span className="fw-bold text-info small text-uppercase tracking-wider">
              <i className="bi bi-shield-lock-fill me-1"></i> Root Administration
            </span>
            <span className="badge bg-dark border border-secondary text-light small font-monospace">TLS 1.3 / AES-256</span>
          </div>

          {error && (
            <div className="alert alert-danger py-2.5 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3 bg-danger bg-opacity-25 border border-danger text-white">
              <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-light text-opacity-90">Admin Operator Email *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-shield-shaded"></i></span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin.jagan@cravepulse.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light text-opacity-90 mb-1">Security Password *</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-key-fill"></i></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter administrator password"
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

            <div className="mb-4">
              <label className="form-label small fw-semibold text-light text-opacity-90">Hardware / MFA Root Passkey</label>
              <div className="auth-unified-input-group">
                <span className="auth-icon"><i className="bi bi-cpu"></i></span>
                <input
                  type="text"
                  className="auth-input font-monospace"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-info w-100 py-3 rounded-pill fw-bold text-dark shadow-lg mb-3 border-0 transition hover-lift"
              style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' }}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
              Authorize Console Access →
            </button>
          </form>

          {/* Test Persona 1-Click Login Card */}
          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: 10, letterSpacing: 0.8 }}>
                Lead Ops Admin Demo
              </span>
              <span className="badge rounded-pill bg-info bg-opacity-25 text-info border border-info border-opacity-50" style={{ fontSize: 10 }}>
                1-CLICK LOGIN
              </span>
            </div>

            <div 
              className="demo-stakeholder-card p-2.5 d-flex align-items-center justify-content-between cursor-pointer"
              onClick={handleDemoFill}
            >
              <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold flex-shrink-0"
                  style={{ width: 36, height: 36, background: '#38bdf8' }}
                >
                  JR
                </div>
                <div className="text-truncate">
                  <div className="fw-bold text-white small lh-1 mb-1">Jaganmohan Reddy (Founder & Ops)</div>
                  <div className="text-light text-opacity-60 text-truncate" style={{ fontSize: 11 }}>
                    admin.jagan@cravepulse.in
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 fw-bold flex-shrink-0 ms-2"
                style={{ fontSize: 11 }}
                disabled={loading}
              >
                Access →
              </button>
            </div>
          </div>

          <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-25 small text-light text-opacity-60">
            <Link to="/" className="text-secondary text-decoration-none hover-underline">← Return to Consumer Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
