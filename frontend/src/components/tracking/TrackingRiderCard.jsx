import React, { useState } from 'react';
import ModalPortal from '../ModalPortal';

/**
 * TrackingRiderCard: Delivery captain card with secure OTP display, masked phone proxy, and in-app chat.
 */
const TrackingRiderCard = ({ order, onOpenChat }) => {
  const [showMaskedCallModal, setShowMaskedCallModal] = useState(false);

  if (!order || order.status === 'CANCELLED') return null;

  const riderName = order.riderName || 'Assigned Captain';
  const riderRating = order.riderRating || '4.9';
  const riderVehicle = order.riderVehicle || 'Electric EV (KA-03-EQ-4421)';
  const deliveryOtp = order.deliveryOtp || '4829';

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
      <div className="row g-3 align-items-center">
        {/* Delivery Captain Profile */}
        <div className="col-sm-7 d-flex align-items-center gap-3">
          <div 
            className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shadow flex-shrink-0"
            style={{ width: 50, height: 50, background: '#10b981', fontSize: 20 }}
          >
            ⚡
          </div>
          <div className="text-truncate">
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong className="text-dark small text-truncate">{riderName}</strong>
              <span className="badge bg-success small">★ {riderRating}</span>
            </div>
            <small className="text-muted d-block text-truncate" style={{ fontSize: 11 }}>
              {riderVehicle}
            </small>
            <small className="text-success fw-bold d-block" style={{ fontSize: 11 }}>
              <i className="bi bi-shield-check me-1"></i> 100% Tips Passed Through
            </small>
          </div>
        </div>

        {/* Action Buttons: Chat & Masked Calling */}
        <div className="col-sm-5 d-flex justify-content-sm-end align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 touch-target shadow-xs"
            onClick={onOpenChat}
          >
            <i className="bi bi-chat-dots-fill"></i>
            <span>Chat</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-success rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 touch-target shadow-xs"
            onClick={() => setShowMaskedCallModal(true)}
          >
            <i className="bi bi-telephone-fill"></i>
            <span>Call Partner</span>
          </button>
        </div>
      </div>

      {/* 4-Digit Secure Delivery OTP Card */}
      {order.status !== 'DELIVERED' && (
        <div className="p-3 bg-light rounded-4 mt-3 border border-light d-flex justify-content-between align-items-center">
          <div>
            <strong className="text-dark small d-block">Doorstep Delivery OTP</strong>
            <small className="text-muted" style={{ fontSize: 11 }}>
              Share this secure code with your captain only upon package handover
            </small>
          </div>
          <span 
            className="badge bg-dark text-white fw-extrabold px-3 py-2 rounded-3 fs-5"
            style={{ letterSpacing: '3px' }}
          >
            {deliveryOtp}
          </span>
        </div>
      )}

      {/* Masked Call Privacy Modal */}
      {showMaskedCallModal && (
        <ModalPortal isOpen={showMaskedCallModal}>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMaskedCallModal(false)}
          >
            <div 
              className="bg-white rounded-4 shadow-2xl p-4 w-100 text-center animate-slide-left"
              style={{ maxWidth: 420 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="masked-call-title"
            >
              <div className="fs-1 mb-2 text-success">📞</div>
              <h5 className="fw-extrabold text-dark mb-1" id="masked-call-title">
                Virtual Proxy Calling
              </h5>
              <p className="text-muted small mb-3">
                Your personal phone number is securely masked with our cloud PBX proxy (+91 80 4748 3333) to safeguard privacy.
              </p>
              <div className="p-3 bg-light rounded-3 mb-4">
                <span className="small text-muted d-block" style={{ fontSize: 11 }}>Dialing Captain via Proxy</span>
                <strong className="fs-5 text-dark">+91 80 4748 3333</strong>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 touch-target"
                  onClick={() => setShowMaskedCallModal(false)}
                >
                  Cancel
                </button>
                <a
                  href="tel:+918047483333"
                  className="btn btn-success rounded-pill px-4 fw-bold touch-target text-white"
                >
                  Dial Now
                </a>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default TrackingRiderCard;
