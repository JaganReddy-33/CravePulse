import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const Footer = () => {
  const deliveryCities = [
    'Bengaluru', 'Mumbai', 'Delhi-NCR', 'Hyderabad', 'Chennai', 
    'Pune', 'Kolkata', 'Ahmedabad', 'Chandigarh', 'Jaipur', 
    'Kochi', 'Coimbatore', 'Lucknow', 'Indore', 'Nagpur', 'Goa'
  ];

  return (
    <footer className="bg-dark text-light pt-5 pb-4 mt-auto border-top border-secondary border-opacity-25" style={{ zIndex: 1 }}>
      <div className="container-fluid px-3 px-md-5">
        {/* Main Footer Links Columns */}
        <div className="row g-4 pb-4 border-bottom border-secondary border-opacity-25">
          {/* Col 1: Brand & Identity */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="mb-3">
              <BrandLogo size="md" lightMode={true} />
            </div>
            <p className="text-secondary small mb-3 lh-base">
              India's premier real-time food delivery ecosystem built on <strong>Radical Price Transparency</strong>. 100% Dine-In Menu Parity, Fair-Pay Rider Protocol, and Honest ETA Guarantee.
            </p>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2 py-1 small">
                <i className="bi bi-shield-check me-1"></i> FSSAI Certified: 11223344556677
              </span>
            </div>
            <div className="text-muted small">
              © {new Date().getFullYear()} CravePulse Technologies Pvt Ltd. Architected by <strong>Jaganmohan Reddy</strong>.
            </div>
          </div>

          {/* Col 2: Company */}
          <div className="col-6 col-md-6 col-lg-2">
            <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-3">Company</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li><Link to="/about" className="text-secondary text-decoration-none hover-white">About Us</Link></li>
              <li><Link to="/careers" className="text-secondary text-decoration-none hover-white">Careers <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: 10 }}>We're Hiring</span></Link></li>
              <li><Link to="/offers" className="text-secondary text-decoration-none hover-white">Offers & Deals</Link></li>
              <li><Link to="/cities" className="text-secondary text-decoration-none hover-white">Delivery Cities</Link></li>
              <li><Link to="/about" className="text-secondary text-decoration-none hover-white">0% Markup Story</Link></li>
              <li><Link to="/help" className="text-secondary text-decoration-none hover-white">Honest ETA Guarantee</Link></li>
            </ul>
          </div>

          {/* Col 3: Support & Legal */}
          <div className="col-6 col-md-6 col-lg-2">
            <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-3">Support & Legal</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li><Link to="/help" className="text-secondary text-decoration-none hover-white">Help & FAQs</Link></li>
              <li><Link to="/contact" className="text-secondary text-decoration-none hover-white">Contact Us 24x7</Link></li>
              <li><Link to="/orders" className="text-secondary text-decoration-none hover-white">My Orders & Invoices</Link></li>
              <li><Link to="/terms" className="text-secondary text-decoration-none hover-white">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-secondary text-decoration-none hover-white">Privacy Policy</Link></li>
              <li><Link to="/contact" className="text-secondary text-decoration-none hover-white">Grievance Officer</Link></li>
            </ul>
          </div>

          {/* Col 4: Partner With Us & Portals */}
          <div className="col-12 col-md-6 col-lg-3">
            <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-3">Partner & Portals</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-3">
              <li>
                <Link to="/partner/login" className="text-secondary text-decoration-none hover-white d-flex align-items-center gap-2">
                  <span className="badge bg-warning-subtle text-dark border">Kitchen</span>
                  <span>Restaurant Partner Login</span>
                </Link>
              </li>
              <li>
                <Link to="/partner/register" className="text-secondary text-decoration-none hover-white d-flex align-items-center gap-2">
                  <span className="badge bg-warning-subtle text-dark border">Onboard</span>
                  <span>Register Your Restaurant</span>
                </Link>
              </li>
              <li>
                <Link to="/rider/login" className="text-secondary text-decoration-none hover-white d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-dark border">Fleet</span>
                  <span>Delivery Partner / Rider Login</span>
                </Link>
              </li>
              <li>
                <Link to="/rider/register" className="text-secondary text-decoration-none hover-white d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-dark border">Join</span>
                  <span>Apply to Ride with Us (₹12/km)</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-secondary text-decoration-none hover-white d-flex align-items-center gap-2">
                  <span className="badge bg-info-subtle text-dark border">Central</span>
                  <span>Platform Ops Control Tower</span>
                </Link>
              </li>
            </ul>

            <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-2">Delivery Cities</h6>
            <div className="d-flex flex-wrap gap-1">
              {deliveryCities.slice(0, 8).map((city, idx) => (
                <Link 
                  key={idx} 
                  to="/cities"
                  className="badge bg-secondary bg-opacity-25 text-light text-decoration-none border border-secondary border-opacity-25 fw-normal px-2 py-1 mb-1 hover-white"
                  style={{ fontSize: 11 }}
                >
                  {city}
                </Link>
              ))}
              <Link to="/cities" className="badge bg-primary bg-opacity-25 text-primary text-decoration-none px-2 py-1 mb-1" style={{ fontSize: 11 }}>
                View All 16 Cities →
              </Link>
            </div>
          </div>

          {/* Col 5: Social & Security Disclaimers */}
          <div className="col-12 col-md-6 col-lg-2">
            <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-3">Connect With Us</h6>
            <div className="d-flex gap-2 mb-3">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }} aria-label="LinkedIn">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }} aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }} aria-label="Twitter">
                <i className="bi bi-twitter-x"></i>
              </a>
            </div>

            <h6 className="fw-bold text-white text-uppercase tracking-wider small mb-2">Verified Security</h6>
            <div className="small text-secondary mb-2" style={{ fontSize: 11 }}>
              <i className="bi bi-lock-fill text-success me-1"></i> 256-Bit SSL Encryption
            </div>
            <div className="small text-secondary mb-2" style={{ fontSize: 11 }}>
              <i className="bi bi-shield-check text-info me-1"></i> RBI Tokenized Checkout
            </div>
            <div className="small text-secondary" style={{ fontSize: 11 }}>
              <i className="bi bi-patch-check-fill text-warning me-1"></i> Fair Trade Standards
            </div>
          </div>
        </div>

        {/* Bottom Payment Badges Row */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center pt-4 gap-3">
          <div className="d-flex flex-wrap align-items-center gap-3 text-secondary small">
            <span>Accepted Payment Partners:</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">Google Pay</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">PhonePe</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">Paytm</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">UPI QR</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">Visa / Mastercard</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">RuPay</span>
            <span className="badge bg-light text-dark px-2 py-1 fw-bold">NetBanking</span>
          </div>

          <div className="small text-muted text-center text-md-end">
            Handcrafted with excellence in Bengaluru, India
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
