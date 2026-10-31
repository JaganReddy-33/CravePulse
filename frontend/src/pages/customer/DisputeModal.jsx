import React, { useState } from "react";
import api from "../../services/api";
import ModalPortal from "../../components/ModalPortal";

const DisputeModal = ({ show, onClose, order }) => {
  const [issueType, setIssueType] = useState("MISSING_ITEM");
  const [description, setDescription] = useState("");
  const [refundAmount, setRefundAmount] = useState("50");
  const [photoUrl, setPhotoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!show || !order) return null;

  const totalBill = Number(order.totalAmount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/disputes", {
        orderId: order.id,
        issueType,
        description,
        photoEvidenceUrl: photoUrl,
        requestedRefundAmount: Number(refundAmount),
      });

      if (res.success) {
        setResult(res.data);
      } else {
        throw new Error(res.message || "The dispute could not be submitted");
      }
    } catch (err) {
      setError(err.message || "The dispute was not submitted. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={show}>
      <div
        className="cravepulse-modal-overlay"
        tabIndex="-1"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="cravepulse-modal-dialog" style={{ maxWidth: 580 }}>
          <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
            {/* Header */}
            <div className="modal-header border-0 bg-light p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-danger-subtle text-danger shadow-sm"
                  style={{ width: 48, height: 48, fontSize: 22 }}
                >
                  <i className="bi bi-shield-check"></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="modal-title fw-extrabold mb-0 text-dark">
                      Instant Dispute Resolution
                    </h5>
                    <span
                      className="badge bg-success-subtle text-success border border-success small"
                      style={{ fontSize: 10 }}
                    >
                      ESCROW PROTECTED
                    </span>
                  </div>
                  <small className="text-muted">
                    Order Ref:{" "}
                    <span className="font-monospace fw-bold text-dark">
                      {order.orderNumber}
                    </span>{" "}
                    • Total Bill: ₹{totalBill}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body p-4">
              {result ? (
                <div className="text-center py-4">
                  <div className="fs-1 mb-2">
                    {result.autoRefundApproved ? "🎉" : "🛡️"}
                  </div>
                  <h4 className="fw-extrabold text-dark mb-2">
                    {result.autoRefundApproved
                      ? "Instant Refund Approved!"
                      : "Claim Escrowed for Express Ops Review"}
                  </h4>
                  <div className="p-3 bg-light rounded-4 border mb-4 text-start">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">Refund Status:</span>
                      <span
                        className={`fw-bold small ${result.autoRefundApproved ? "text-success" : "text-primary"}`}
                      >
                        {result.autoRefundApproved
                          ? "✓ 100% Automated Instant Credit"
                          : "⏳ Priority SLA: < 15 Mins"}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">Credited Amount:</span>
                      <strong className="fs-5 text-dark">
                        ₹{result.requestedRefundAmount}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted small">
                        Payout Destination:
                      </span>
                      <span className="small fw-semibold text-secondary">
                        CravePulse Balance Wallet
                      </span>
                    </div>
                  </div>
                  <p className="text-muted small mb-4">
                    {result.autoRefundApproved
                      ? "Because your claim meets our transparent instant resolution threshold (≤ ₹100), your claim was accepted for processing. Check your wallet or payment status for the recorded refund."
                      : "Your photo evidence and kitchen ticket have been dispatched directly to the Head Chef and Central Ops Console. A notification will appear momentarily."}
                  </p>
                  <button
                    className="btn btn-primary rounded-pill px-5 py-2.5 fw-bold shadow"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--c-primary) 0%, var(--c-secondary) 100%)",
                      borderColor: "var(--c-primary)",
                    }}
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* 1. Category selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark text-uppercase">
                      1. What went wrong?
                    </label>
                    <select
                      className="form-select rounded-3 py-2 shadow-none border"
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                    >
                      <option value="MISSING_ITEM">
                        🍽️ Missing Dish, Side or Addon in Bag
                      </option>
                      <option value="SPILLAGE">
                        🥣 Gravy Spillage / Crushed Packaging
                      </option>
                      <option value="WRONG_ITEM">
                        ❌ Incorrect Dish Delivered
                      </option>
                      <option value="SEVERE_DELAY">
                        ⏳ Severe Delivery Delay Past SLA Guarantee
                      </option>
                      <option value="SPOILED_FOOD">
                        ❄️ Food Temperature / Quality Issue
                      </option>
                    </select>
                  </div>

                  {/* 2. Description text */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-dark text-uppercase mb-0">
                        2. Brief Details *
                      </label>
                      <small className="text-muted">
                        {description.length}/300 chars
                      </small>
                    </div>
                    <textarea
                      className="form-control rounded-3 p-2.5 shadow-none border"
                      rows="3"
                      maxLength="300"
                      placeholder="e.g. Garlic Naan was missing from sealed package, or biryani gravy leaked during transit..."
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* 3. Refund Amount with Presets */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-dark text-uppercase mb-0">
                        3. Claim Refund Amount (₹)
                      </label>
                      <span
                        className="badge bg-success-subtle text-success border border-success small"
                        style={{ fontSize: 10 }}
                      >
                        ≤ ₹100 Instant Approval
                      </span>
                    </div>

                    <div className="d-flex gap-2 mb-2">
                      {["50", "100", "150", String(totalBill)].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 fw-bold border ${refundAmount === val ? "btn-primary text-white shadow-sm" : "btn-light"}`}
                          style={
                            refundAmount === val
                              ? {
                                  background: "var(--c-primary)",
                                  borderColor: "var(--c-primary)",
                                }
                              : {}
                          }
                          onClick={() => setRefundAmount(val)}
                        >
                          {val === String(totalBill)
                            ? `Full Bill (₹${val})`
                            : `₹${val}`}
                        </button>
                      ))}
                    </div>

                    <div className="input-group">
                      <span className="input-group-text bg-light fw-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        className="form-control shadow-none"
                        min="10"
                        max={totalBill || 1000}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* 4. Photo Evidence Uploader */}
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-dark text-uppercase mb-1">
                      4. Photo Proof (Bag / Dish Seal)
                    </label>
                    <div className="p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Evidence preview"
                          className="rounded-3 border object-fit-cover shadow-sm flex-shrink-0"
                          style={{ width: 54, height: 54 }}
                        />
                      ) : (
                        <div
                          className="rounded-3 border bg-white d-flex align-items-center justify-content-center text-muted flex-shrink-0"
                          style={{ width: 54, height: 54 }}
                        >
                          📷
                        </div>
                      )}
                      <div className="flex-grow-1 overflow-hidden">
                        <label className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold mb-1 cursor-pointer">
                          <i className="bi bi-camera me-1"></i> Evidence image
                          URL
                          <input
                            type="url"
                            className="form-control"
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            placeholder="https://.../photo.jpg"
                          />
                        </label>
                        <div
                          className="small text-muted text-truncate"
                          style={{ fontSize: 11 }}
                        >
                          {fileName ||
                            "Enter a publicly accessible HTTPS image link"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust footer guarantee */}
                  <div className="p-3 bg-light rounded-3 border mb-4 small text-secondary d-flex align-items-center gap-2">
                    <i className="bi bi-patch-check-fill text-success fs-5 flex-shrink-0"></i>
                    <div>
                      <strong>CravePulse Fair-Resolution Promise:</strong>{" "}
                      Claims ≤ ₹100 are processed instantly by automated rule
                      validation with zero customer hold queues.
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light rounded-pill px-4 fw-semibold border"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                          ></span>
                          <span>Validating Claim...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-fill-check"></i>
                          <span>Submit Dispute Claim</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default DisputeModal;
