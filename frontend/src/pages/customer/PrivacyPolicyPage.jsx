import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="container py-5" style={{ maxWidth: 880 }}>
      <div className="mb-4 pb-3 border-bottom">
        <span className="badge bg-light text-muted border px-3 py-1 rounded-pill small mb-2">PRIVACY & TRUST</span>
        <h1 className="fw-extrabold text-dark">Privacy Policy & Consumer Data Protection</h1>
        <small className="text-muted">Effective: October 2026 • Compliant with DPDP Act 2023 & RBI Payment Tokenization Guidelines</small>
      </div>

      <div className="text-secondary small" style={{ lineHeight: 1.8 }}>
        <h5 className="fw-bold text-dark mt-4">1. Information We Collect</h5>
        <p>
          To facilitate gourmet food delivery, CravePulse collects necessary personal details including your name, delivery address coordinates, mobile phone number, and encrypted authentication tokens. We also access precise real-time geolocation when the consumer application is active to calculate accurate distance-based delivery fees and provide honest ETAs.
        </p>

        <h5 className="fw-bold text-dark mt-4">2. Zero Sale of Personal Data</h5>
        <p>
          Unlike legacy food aggregators who monetize customer consumption habits with third-party advertisers, CravePulse never sells, rents, or licenses your personal or dining data to any third-party marketing brokers.
        </p>

        <h5 className="fw-bold text-dark mt-4">3. Payment Security & RBI Tokenization</h5>
        <p>
          All online financial transactions (UPI, Credit/Debit Cards, NetBanking) are processed via PCI-DSS Level-1 certified payment gateways. In compliance with Reserve Bank of India (RBI) mandates, CravePulse never stores raw 16-digit card numbers or CVVs on our backend servers. All card details are cryptographically tokenized.
        </p>

        <h5 className="fw-bold text-dark mt-4">4. Location Tracking & Delivery Privacy</h5>
        <p>
          Your delivery address and phone number are masked when shown to delivery partners. Telemetry data is exclusively used during active fulfillment to calculate live courier coordinates and automatically stops as soon as the order is marked delivered.
        </p>

        <h5 className="fw-bold text-dark mt-4">5. Data Retention & Account Deletion</h5>
        <p>
          You retain the right to download a copy of your dining history or request permanent erasure of your CravePulse profile and saved addresses at any time by contacting <code>privacy@cravepulse.in</code>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
