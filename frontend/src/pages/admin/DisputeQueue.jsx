import React, { useState, useEffect } from "react";
import api from "../../services/api";

const DisputeQueue = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING"); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'

  // Resolve Modal state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isApproveAction, setIsApproveAction] = useState(true);
  const [resolveNote, setResolveNote] = useState("");
  const [flagFraud, setFlagFraud] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/disputes");
      if (res.success && Array.isArray(res.data)) {
        setDisputes(res.data);
      } else {
        setDisputes([]);
      }
    } catch (e) {
      console.error("Error fetching disputes", e);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleOpenResolveModal = (dispute, approve) => {
    setSelectedDispute(dispute);
    setIsApproveAction(approve);
    setResolveNote(
      approve
        ? "Refund approved following photographic packaging seal inspection"
        : "Claim denied: Photographic proof does not support claim",
    );
    setFlagFraud(false);
  };

  const handleConfirmResolve = async () => {
    if (!selectedDispute) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/disputes/${selectedDispute.id}/resolve`, {
        approve: isApproveAction,
        notes: resolveNote,
        flagFraud: flagFraud,
      });
      if (res.success) {
        setSelectedDispute(null);
        fetchDisputes();
      }
    } catch (e) {
      alert(e.message || "Error resolving dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (activeTab === "ALL") return true;
    return d.adminStatus === activeTab;
  });

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">
            Instant Dispute Resolution & Refund Queue
          </h4>
          <p className="text-muted small mb-0">
            Audit photo evidence for missing/spoiled food, approve wallet
            compensation, and inspect resolution audit logs.
          </p>
        </div>
        <button
          className="btn btn-outline-info rounded-pill px-3 btn-sm"
          onClick={fetchDisputes}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-1">
        {[
          {
            id: "PENDING",
            label: "Pending Review",
            count: disputes.filter((d) => d.adminStatus === "PENDING").length,
            color: "warning",
          },
          {
            id: "APPROVED",
            label: "Approved & Refunded",
            count: disputes.filter((d) => d.adminStatus === "APPROVED").length,
            color: "success",
          },
          {
            id: "REJECTED",
            label: "Rejected Claims",
            count: disputes.filter((d) => d.adminStatus === "REJECTED").length,
            color: "danger",
          },
          {
            id: "ALL",
            label: "All Disputes",
            count: disputes.length,
            color: "info",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-2 ${
              activeTab === tab.id
                ? "btn-info text-dark fw-bold"
                : "btn-outline-secondary text-white"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span
              className={`badge rounded-pill bg-${tab.color} ${tab.color === "warning" ? "text-dark" : "text-white"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div
          className="card border-0 rounded-4 shadow-sm p-5 text-center text-white"
          style={{ background: "#162032" }}
        >
          <div className="spinner-border text-info" role="status"></div>
          <p className="text-muted small mt-2">Loading dispute queue...</p>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div
          className="card border-0 rounded-4 p-5 text-center text-white"
          style={{ background: "#162032", border: "1px solid #1f293d" }}
        >
          <div className="fs-1 mb-2">🎉</div>
          <h5 className="fw-bold">No Disputes in {activeTab} Queue</h5>
          <p className="text-muted small">
            All customer escalations in this queue have been handled.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredDisputes.map((disp) => (
            <div key={disp.id} className="col-12 col-xl-6">
              <div
                className="card border-0 rounded-4 shadow-sm p-4 text-white h-100 d-flex flex-column justify-content-between"
                style={{ background: "#162032", border: "1px solid #1f293d" }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span
                        className={`badge rounded-pill px-3 py-1 mb-2 ${
                          disp.issueType === "SPOILED_FOOD"
                            ? "bg-danger"
                            : disp.issueType === "MISSING_ITEM"
                              ? "bg-warning text-dark"
                              : "bg-info text-dark"
                        }`}
                      >
                        {disp.issueType}
                      </span>
                      <h5 className="fw-bold mb-0 text-white">
                        {disp.orderNumber || `Order #${disp.orderId}`}
                      </h5>
                      <small className="text-muted">
                        Customer:{" "}
                        <span className="text-white fw-semibold">
                          {disp.customerName || `UID #${disp.customerId}`}
                        </span>{" "}
                        • {disp.restaurantName || "Kitchen Center"}
                      </small>
                    </div>
                    <div className="text-end">
                      <span className="small text-muted d-block">
                        Requested Refund
                      </span>
                      <span className="fs-5 fw-extrabold text-warning">
                        ₹{Number(disp.requestedRefundAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-3 mb-3 small"
                    style={{
                      background: "#0b0f19",
                      border: "1px solid #1f293d",
                    }}
                  >
                    <strong className="text-light">Customer Statement:</strong>
                    <p className="mb-0 text-secondary mt-1">
                      {disp.description}
                    </p>
                  </div>

                  {/* Photo Evidence with Lightbox */}
                  {disp.photoEvidenceUrl && (
                    <div className="mb-3 d-flex align-items-center gap-3 p-2 rounded-3 bg-dark">
                      <img
                        src={disp.photoEvidenceUrl}
                        alt="Dispute evidence"
                        className="rounded-3 border border-secondary shadow-sm cursor-pointer"
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewPhoto(disp.photoEvidenceUrl)}
                      />
                      <div>
                        <span className="small fw-bold d-block text-light">
                          Customer Photo Proof
                        </span>
                        <small
                          className="text-info cursor-pointer"
                          style={{ cursor: "pointer" }}
                          onClick={() => setPreviewPhoto(disp.photoEvidenceUrl)}
                        >
                          <i className="bi bi-zoom-in me-1"></i> Click to
                          inspect high-res image
                        </small>
                      </div>
                    </div>
                  )}

                  {/* Audit Trail & Notes */}
                  {disp.resolutionNotes && (
                    <div
                      className="p-3 rounded-3 mb-3 small"
                      style={{
                        background: "#0d1929",
                        border: "1px solid #19324d",
                      }}
                    >
                      <strong className="text-info">
                        Compliance Audit Notes:
                      </strong>
                      <p className="mb-0 text-white-50 mt-1">
                        {disp.resolutionNotes}
                      </p>
                      {disp.resolvedAt && (
                        <small className="text-muted d-block mt-2">
                          <i className="bi bi-clock-history me-1"></i> Resolved
                          on {new Date(disp.resolvedAt).toLocaleString()}
                        </small>
                      )}
                    </div>
                  )}
                </div>

                {/* Status or Action Buttons */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary">
                  <div>
                    <span
                      className={`badge ${
                        disp.adminStatus === "APPROVED"
                          ? "bg-success text-dark fw-bold"
                          : disp.adminStatus === "REJECTED"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {disp.adminStatus}
                    </span>
                    {disp.autoRefundApproved && (
                      <span className="badge bg-primary-subtle text-primary ms-2">
                        Rule Auto-Refund
                      </span>
                    )}
                  </div>

                  {disp.adminStatus === "PENDING" ? (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        onClick={() => handleOpenResolveModal(disp, false)}
                      >
                        Reject Claim
                      </button>
                      <button
                        className="btn btn-sm btn-success rounded-pill px-4 fw-bold text-dark"
                        style={{
                          background: "#00e676",
                          borderColor: "#00e676",
                        }}
                        onClick={() => handleOpenResolveModal(disp, true)}
                      >
                        Approve ₹{disp.requestedRefundAmount} Refund ✓
                      </button>
                    </div>
                  ) : (
                    <small className="text-muted">Settlement Finalized</small>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {selectedDispute && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.8)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 rounded-4 p-3 text-white"
              style={{ background: "#162032", border: "1px solid #1f293d" }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {isApproveAction
                    ? "✅ Approve Customer Refund"
                    : "❌ Reject Dispute Claim"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedDispute(null)}
                ></button>
              </div>

              <div className="modal-body">
                <p className="text-muted small">
                  {isApproveAction
                    ? `You are approving an instant wallet refund credit of ₹${selectedDispute.requestedRefundAmount} for Order #${selectedDispute.orderNumber}.`
                    : `You are rejecting the claim of ₹${selectedDispute.requestedRefundAmount} for Order #${selectedDispute.orderNumber}.`}
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-bold">
                    Compliance Resolution Note *
                  </label>
                  <textarea
                    className="form-control bg-dark border-secondary text-white"
                    rows="3"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Enter resolution reasoning for audit trail..."
                    required
                  />
                </div>

                {!isApproveAction && (
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="flagFraudCheck"
                      checked={flagFraud}
                      onChange={(e) => setFlagFraud(e.target.checked)}
                    />
                    <label
                      className="form-check-label small text-warning"
                      htmlFor="flagFraudCheck"
                    >
                      Increment user fraud-flag counter (suspicious claim /
                      high-risk activity)
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={() => setSelectedDispute(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn rounded-pill px-4 fw-bold ${isApproveAction ? "btn-success text-dark" : "btn-danger"}`}
                  disabled={submitting}
                  onClick={handleConfirmResolve}
                >
                  {submitting
                    ? "Recording..."
                    : isApproveAction
                      ? "Confirm Refund"
                      : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded photo lightbox */}
      {previewPhoto && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.85)", cursor: "zoom-out" }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 bg-transparent text-center">
              <div className="modal-header border-0 pb-0 justify-content-end">
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPreviewPhoto(null)}
                ></button>
              </div>
              <div className="modal-body p-0">
                <img
                  src={previewPhoto}
                  alt="Enlarged evidence"
                  className="img-fluid rounded-4 shadow-lg border border-secondary"
                  style={{ maxHeight: "80vh", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeQueue;
