import React from "react";

const LegalTermsPage = () => {
  return (
    <div className="container py-5" style={{ maxWidth: 880 }}>
      <div className="mb-4 pb-3 border-bottom">
        <span className="badge bg-light text-muted border px-3 py-1 rounded-pill small mb-2">
          LEGAL COMPLIANCE
        </span>
        <h1 className="fw-extrabold text-dark">
          Terms of Service & Fair Trade Covenant
        </h1>
        <small className="text-muted">
          Last Updated: October 2026 • Effective for all CravePulse Consumers &
          Partners
        </small>
      </div>

      <div className="text-secondary small" style={{ lineHeight: 1.8 }}>
        <h5 className="fw-bold text-dark mt-4">
          1. The 100% Price Transparency Covenant
        </h5>
        <p>
          CravePulse operates under strict fair-pricing standards. Unlike
          conventional multi-tier food aggregators, CravePulse strictly
          prohibits restaurants from charging marked-up prices for online food
          deliveries compared to their dine-in menu cards. All item prices
          displayed on the platform are verified directly against physical
          dine-in menus. If a customer identifies an unauthorized price
          discrepancy, CravePulse will refund twice (2x) the differential amount
          directly to the customer's wallet under our Price Parity Guarantee.
        </p>

        <h5 className="fw-bold text-dark mt-4">
          2. Order Placement, Cancellation & Refunds
        </h5>
        <p>
          Customers retain the unconditional right to cancel an order at any
          point during the <strong>PLACED</strong>, <strong>ACCEPTED</strong>,
          or <strong>PREPARING</strong> stages. Upon cancellation, a 100% full
          refund is immediately credited to the original payment source (UPI,
          Credit/Debit Card, NetBanking) or the user's CravePulse Wallet
          balance. Once an order has been marked as <strong>PICKED_UP</strong>{" "}
          by a delivery rider, cancellation is restricted to protect the rider's
          dispatched transit time and compensation.
        </p>

        <h5 className="fw-bold text-dark mt-4">
          3. Honest ETA Goodwill Guarantee
        </h5>
        <p>
          CravePulse provides algorithmic, honest delivery time windows (e.g.
          20–30 minutes). If our delivery partner arrives after the maximum
          estimated delivery timestamp due to platform or logistics delays, an
          automated goodwill credit of ₹50 is automatically credited to the
          customer's account without requiring customer support escalation.
        </p>

        <h5 className="fw-bold text-dark mt-4">
          4. Delivery Rider Fair-Pay Protocol
        </h5>
        <p>
          CravePulse enforces a zero-commission policy on delivery partner
          gratuities. 100% of tips provided by customers are disbursed directly
          to the assigned delivery partner. Delivery partners receive guaranteed
          distance pay calculated at ₹12 per kilometer beyond the base 2km zone,
          plus wait-time compensation for restaurant kitchen delays.
        </p>

        <h5 className="fw-bold text-dark mt-4">
          5. FSSAI Certification & Food Quality
        </h5>
        <p>
          All culinary establishments listed on CravePulse must maintain valid
          FSSAI (Food Safety and Standards Authority of India) licenses.
          Restaurants are solely responsible for the hygiene, ingredients,
          preparation, and thermal packaging of meals.
        </p>
      </div>
    </div>
  );
};

export default LegalTermsPage;
