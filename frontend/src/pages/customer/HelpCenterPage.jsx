import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    category: 'Orders & Tracking',
    question: 'How does live order tracking work?',
    answer: 'Once you place an order, our system coordinates directly with the restaurant POS kitchen terminal. When the food is ready, our dispatch engine allocates the nearest delivery partner. You can track real-time GPS telemetry from kitchen pickup directly to your doorstep on our interactive map.'
  },
  {
    category: 'Refunds & Cancellation',
    question: 'Can I cancel my order, and what is the refund policy?',
    answer: 'Yes! You can cancel your order anytime from your Order History or Tracking page while the order is in PLACED, ACCEPTED, or PREPARING stages. Because CravePulse believes in fair consumer rights, 100% of your payment is instantly credited back to your original payment method or CravePulse Wallet with zero cancellation penalties.'
  },
  {
    category: 'Price Parity Guarantee',
    question: 'What is the 100% Dine-In Menu Price Parity Guarantee?',
    answer: 'Traditional food aggregators encourage or tolerate restaurants inflating their online delivery prices by 20% to 35% compared to their dine-in physical menu. On CravePulse, menu prices are legally mandated to match the in-restaurant physical menu. If you ever find a price discrepancy, we refund 2x the difference instantly.'
  },
  {
    category: 'Delivery Fees & Tips',
    question: 'How are delivery fees calculated, and where does my tip go?',
    answer: 'Delivery fees are calculated using transparent distance bands (base ₹35 for initial 2km + ₹12/km thereafter). Furthermore, 100% of customer tips are credited directly to the delivery rider’s wallet without any platform deductions or commission cuts.'
  },
  {
    category: 'Honest ETA Guarantee',
    question: 'What happens if my order is delivered late?',
    answer: 'We provide an honest ETA window (e.g. 20-30 minutes). If your food arrives after the upper window due to platform logistics delays, our automated system triggers an instant ₹50 goodwill credit to your wallet.'
  },
  {
    category: 'Safety & Hygiene',
    question: 'How do you ensure food safety and packaging standards?',
    answer: 'All partner restaurants must maintain active FSSAI certifications, verified by our compliance team. Food is packed in food-grade, tamper-evident sealed packaging to guarantee freshness and prevent unauthorized contact during transit.'
  }
];

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = FAQS.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'ALL' || faq.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold mb-2">
          💡 HELP & KNOWLEDGE BASE
        </span>
        <h1 className="fw-extrabold text-dark display-6 mb-3">Frequently Asked Questions</h1>
        <p className="text-muted lead mx-auto" style={{ maxWidth: 640 }}>
          Got questions about our transparent pricing, order tracking, cancellations, or delivery policies? We've got answers.
        </p>

        {/* Search input */}
        <div className="mx-auto mt-4" style={{ maxWidth: 540 }}>
          <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
            <span className="input-group-text bg-white border-0 ps-4 text-muted"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control border-0 ps-2"
              placeholder="Search help topics, refunds, ETA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn btn-white border-0 pe-4 text-muted" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
        {['ALL', 'Orders & Tracking', 'Refunds & Cancellation', 'Price Parity Guarantee', 'Delivery Fees & Tips'].map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === cat ? 'btn-primary' : 'btn-light border text-muted'}`}
            style={activeCategory === cat ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {filteredFaqs.length === 0 ? (
            <div className="card border-0 rounded-4 p-5 text-center bg-white shadow-sm">
              <h5>No matching help articles found</h5>
              <p className="text-muted small">Try searching with different terms or reach out to our 24/7 team.</p>
              <Link to="/contact" className="btn btn-outline-primary rounded-pill px-4 mx-auto btn-sm">
                Contact Support Directly
              </Link>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden transition">
                    <button
                      className="btn text-start p-4 w-100 d-flex justify-content-between align-items-center border-0 bg-transparent"
                      onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                    >
                      <span className="fw-bold text-dark fs-6 pe-3">{faq.question}</span>
                      <span className="badge bg-light text-muted border rounded-circle p-2">
                        <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-secondary small" style={{ lineHeight: 1.7 }}>
                        <span className="badge bg-light text-primary border mb-2 small">{faq.category}</span>
                        <p className="mb-0">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Still Need Help Box */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-light mt-5 text-center">
            <h5 className="fw-bold text-dark mb-1">Still need help with an active order?</h5>
            <p className="text-muted small mb-3">Our live operations desk in Bangalore is available 24 hours a day, 7 days a week.</p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/contact" className="btn btn-primary rounded-pill px-4 btn-sm fw-bold" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
                Raise a Support Ticket
              </Link>
              <a href="tel:18001234567" className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold">
                Call 1800-123-4567
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
