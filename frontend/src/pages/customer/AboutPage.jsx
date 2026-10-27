import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="container py-5">
      {/* Hero Banner */}
      <div className="text-center mb-5">
        <span className="badge bg-warning-subtle text-dark border px-3 py-2 rounded-pill fw-bold mb-3">
          🌟 THE FAIR FOOD REVOLUTION
        </span>
        <h1 className="fw-extrabold text-dark display-5 mb-3">
          Disrupting Food Delivery with <span style={{ color: 'var(--c-primary)' }}>100% Price Parity</span>
        </h1>
        <p className="text-muted lead mx-auto" style={{ maxWidth: 720 }}>
          For a decade, traditional aggregators charged hidden 20-30% menu inflation, predatory commissions on small restaurants, and suppressed delivery partner payouts. CravePulse changes that forever.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white text-center">
            <div className="fs-1 mb-3">🏷️</div>
            <h5 className="fw-bold mb-2">0% Price Inflation</h5>
            <p className="text-muted small mb-0">
              The price you pay on CravePulse is the exact same price printed on the physical restaurant table menu. We legally prohibit and algorithmically block marked-up online pricing.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white text-center">
            <div className="fs-1 mb-3">🛵</div>
            <h5 className="fw-bold mb-2">Fair-Pay Rider Protocol</h5>
            <p className="text-muted small mb-0">
              100% of customer tips go straight to the delivery partner's bank account with zero platform cut. Distance pay is fixed at ₹12/km with wait-time compensation for kitchen delays.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white text-center">
            <div className="fs-1 mb-3">⏱️</div>
            <h5 className="fw-bold mb-2">Honest ETA Guarantee</h5>
            <p className="text-muted small mb-0">
              No deceptive algorithm that promises 15 minutes and takes an hour. If our delivery arrives even 1 minute after our upper ETA window, you receive an automated ₹50 credit instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 mb-5 bg-white">
        <h3 className="fw-extrabold text-dark mb-4 text-center">How CravePulse Compares</h3>
        <div className="table-responsive">
          <table className="table align-middle text-center mb-0">
            <thead>
              <tr className="border-bottom">
                <th className="text-start py-3 text-muted">Feature Comparison</th>
                <th className="py-3 text-danger">Traditional Aggregators</th>
                <th className="py-3 text-success fw-bold" style={{ background: '#f0fdf4' }}>CravePulse Platform</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-start py-3 fw-semibold">Menu Price vs Dine-in</td>
                <td className="text-danger">20% to 35% Inflated</td>
                <td className="text-success fw-bold" style={{ background: '#f0fdf4' }}>Exact 1:1 Dine-In Parity</td>
              </tr>
              <tr>
                <td className="text-start py-3 fw-semibold">Restaurant Commission</td>
                <td className="text-danger">25% to 32% per order</td>
                <td className="text-success fw-bold" style={{ background: '#f0fdf4' }}>Fair 12% to 15% capped</td>
              </tr>
              <tr>
                <td className="text-start py-3 fw-semibold">Delivery Partner Tips</td>
                <td className="text-muted">Often pooled or obscured</td>
                <td className="text-success fw-bold" style={{ background: '#f0fdf4' }}>100% Direct to Rider</td>
              </tr>
              <tr>
                <td className="text-start py-3 fw-semibold">Packaging Markups</td>
                <td className="text-danger">₹30 to ₹70 arbitrary fees</td>
                <td className="text-success fw-bold" style={{ background: '#f0fdf4' }}>At-cost verified ₹15</td>
              </tr>
              <tr>
                <td className="text-start py-3 fw-semibold">Dispute Resolution</td>
                <td className="text-danger">Unresponsive AI Chatbots</td>
                <td className="text-success fw-bold" style={{ background: '#f0fdf4' }}>Instant Ops Team Escrow</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Box */}
      <div 
        className="rounded-4 p-5 text-center text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #ff5722 0%, #ff8a65 100%)' }}
      >
        <h2 className="fw-extrabold mb-3">Join Thousands of Smart Food Lovers</h2>
        <p className="lead mb-4 mx-auto" style={{ maxWidth: 600 }}>
          Taste the difference of gourmet food cooked with care and delivered with transparent respect for chefs and riders alike.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/" className="btn btn-light rounded-pill px-4 py-2 fw-bold text-dark shadow-sm">
            Order Delicious Food →
          </Link>
          <Link to="/partner/login" className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold">
            Partner with Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
