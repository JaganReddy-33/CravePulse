import React, { useState } from "react";
import ModalPortal from "../ModalPortal";

/**
 * TrackingCancelModal: Order cancellation confirmation with refund policy disclosure.
 */
const TrackingCancelModal = ({
  show,
  onClose,
  onConfirmCancel,
  cancelling,
  orderStatus,
}) => {
  const [cancelReason, setCancelReason] = useState("Placed order by mistake");

  if (!show) return null;

  const isCooking = ["PREPARING", "READY", "PICKED_UP"].includes(orderStatus);

  return (
    <ModalPortal isOpen={show}>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 10050, backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
          style={{ maxWidth: 480 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5
              className="fw-extrabold text-danger mb-0"
              id="cancel-order-title"
            >
              Cancel Order Confirmation
            </h5>
            <button
              type="button"
              className="btn-close touch-target"
              onClick={onClose}
              aria-label="Close dialog"
            ></button>
          </div>

          <p className="text-muted small mb-3">
            Please let us know why you wish to cancel this order:
          </p>

          <div className="d-flex flex-column gap-2 mb-4">
            {[
              "Placed order by mistake",
              "Delivery time is taking too long",
              "Need to change delivery address or items",
              "Kitchen requested cancellation",
            ].map((reason) => (
              <label
                key={reason}
                className={`p-3 rounded-3 border d-flex align-items-center gap-2 cursor-pointer transition ${
                  cancelReason === reason
                    ? "border-danger bg-danger-subtle"
                    : "border-light bg-light"
                }`}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  className="form-check-input mt-0"
                />
                <span className="small text-dark fw-semibold">{reason}</span>
              </label>
            ))}
          </div>

          {/* Refund Policy Disclosure */}
          <div className="p-3 bg-warning-subtle border border-warning rounded-4 mb-4 small">
            <div className="fw-bold text-dark mb-1">
              <i className="bi bi-info-circle-fill text-warning me-1"></i>
              Refund Policy
            </div>
            {isCooking ? (
              <span className="text-muted">
                Since the kitchen has already commenced preparation, a partial
                cancellation fee may apply unless the restaurant agrees to waive
                charges.
              </span>
            ) : (
              <span className="text-success fw-semibold">
                Your order hasn't entered preparation yet. A 100% full refund
                will be credited instantly back to your CravePulse Wallet or
                original source.
              </span>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-pill px-3 touch-target"
              onClick={onClose}
              disabled={cancelling}
            >
              Keep My Order
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger rounded-pill px-4 fw-bold touch-target text-white"
              onClick={() => onConfirmCancel(cancelReason)}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default TrackingCancelModal;
