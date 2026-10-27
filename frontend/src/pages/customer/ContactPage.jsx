import React, { useState } from 'react';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('ORDER_SUPPORT');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmittedTicket(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitting(false);
    }, 700);
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold mb-2">
          📞 24/7 CUSTOMER CARE
        </span>
        <h1 className="fw-extrabold text-dark display-6 mb-2">How Can We Help You?</h1>
        <p className="text-muted">Our dedicated operations and customer support team in Bangalore is here to assist you.</p>
      </div>

      <div className="row g-4 justify-content-center">
        {/* Support Ticket Form */}
        <div className="col-lg-7">
          <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white">
            <h4 className="fw-bold mb-3 text-dark">Submit a Support Ticket</h4>

            {submittedTicket ? (
              <div className="text-center py-4">
                <div className="fs-1 text-success mb-2">✓</div>
                <h5 className="fw-bold">Ticket Submitted Successfully!</h5>
                <p className="text-muted small mb-3">
                  Your ticket ID is <strong>{submittedTicket}</strong>. An operations officer will respond to your registered email within 15 minutes.
                </p>
                <button 
                  className="btn btn-outline-primary rounded-pill px-4 btn-sm"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setMessage('');
                  }}
                >
                  Submit Another Query
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Your Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Inquiry Category *</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="ORDER_SUPPORT">Order Delivery & Status</option>
                      <option value="REFUND_DISPUTE">Refunds & Cancellation</option>
                      <option value="RESTAURANT_PARTNER">Restaurant Partner Inquiry</option>
                      <option value="RIDER_FLEET">Delivery Partner / Rider Query</option>
                      <option value="TECHNICAL_FEEDBACK">Website / App Feedback</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Order Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ORD-20261025-002"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-dark">Message / Issue Details *</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Please describe your issue or inquiry with specific details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm"
                  style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
                  disabled={submitting}
                >
                  {submitting ? 'Generating Ticket...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Contact Info & Office Details */}
        <div className="col-lg-5">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3 text-dark">Direct Helplines</h5>
            
            <div className="d-flex align-items-start gap-3 mb-3">
              <div className="badge bg-light text-primary border rounded-circle p-3 fs-5">
                <i className="bi bi-telephone-fill"></i>
              </div>
              <div>
                <strong className="d-block text-dark">Toll-Free Helpline</strong>
                <a href="tel:18001234567" className="text-primary text-decoration-none fw-bold">1800-123-4567</a>
                <small className="d-block text-muted">Available 24x7 for active orders</small>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 mb-3">
              <div className="badge bg-light text-success border rounded-circle p-3 fs-5">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <div>
                <strong className="d-block text-dark">Email Support</strong>
                <a href="mailto:support@cravepulse.in" className="text-dark text-decoration-none fw-semibold">support@cravepulse.in</a>
                <small className="d-block text-muted">Average response time: 12 minutes</small>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3">
              <div className="badge bg-light text-warning border rounded-circle p-3 fs-5">
                <i className="bi bi-building"></i>
              </div>
              <div>
                <strong className="d-block text-dark">CravePulse India Headquarters</strong>
                <span className="text-secondary small d-block">
                  Tower 4, Embassy TechVillage, Outer Ring Road, Devarabisanahalli, Bellandur, Bengaluru, Karnataka 560103
                </span>
              </div>
            </div>
          </div>

          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <h6 className="fw-bold mb-2">Escalation & Grievance Officer</h6>
            <p className="text-muted small mb-1">In compliance with Consumer Protection (E-Commerce) Rules, 2020:</p>
            <div className="small text-secondary">
              <strong>Nodal Grievance Officer</strong> (Compliance & Legal Operations)<br />
              Email: <code>grievance@cravepulse.in</code><br />
              Resolution SLA: 48 business hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
