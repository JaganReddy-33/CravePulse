import React, { useState } from "react";

/**
 * CheckoutTipSelector: Delivery captain tip pills with 100% tip pass-through badge.
 */
const CheckoutTipSelector = ({ riderTip, setRiderTip }) => {
  const [customTip, setCustomTip] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const tipOptions = [0, 20, 30, 50];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(customTip);
    if (!isNaN(val) && val >= 0) {
      setRiderTip(val);
      setShowCustomInput(false);
    }
  };

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <span>🛵 Delivery Partner Tip</span>
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
            100% Pass-Through
          </span>
        </h6>
        {riderTip > 0 && (
          <span className="badge bg-danger rounded-pill fw-bold">
            ₹{riderTip} Applied
          </span>
        )}
      </div>

      <p className="text-muted small mb-3" style={{ fontSize: 12 }}>
        CravePulse takes 0% commission on tips. 100% of your generous tip goes
        straight to the delivery captain's bank account.
      </p>

      {/* Tip Option Pills */}
      <div className="d-flex flex-wrap gap-2">
        {tipOptions.map((amount) => (
          <button
            key={amount}
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 fw-bold touch-target ${
              riderTip === amount && !showCustomInput
                ? "btn-danger text-white"
                : "btn-light border text-dark"
            }`}
            onClick={() => {
              setRiderTip(amount);
              setShowCustomInput(false);
            }}
          >
            {amount === 0 ? "No Tip" : `₹${amount}`}
          </button>
        ))}

        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 py-1 fw-bold touch-target ${
            showCustomInput
              ? "btn-danger text-white"
              : "btn-light border text-dark"
          }`}
          onClick={() => setShowCustomInput(!showCustomInput)}
        >
          Custom
        </button>
      </div>

      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} className="mt-3">
          <div
            className="input-group input-group-sm rounded-pill border overflow-hidden"
            style={{ maxWidth: 200 }}
          >
            <span className="input-group-text bg-white border-0 ps-3">₹</span>
            <input
              type="number"
              className="form-control border-0"
              placeholder="Amount"
              min="0"
              max="500"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary px-3 fw-bold"
              style={{
                background: "var(--c-primary)",
                borderColor: "var(--c-primary)",
              }}
            >
              Set
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CheckoutTipSelector;
