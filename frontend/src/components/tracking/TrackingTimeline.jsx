import React from 'react';

const STAGES = [
  { key: 'PLACED', label: 'Order Placed', icon: 'bi-check2-circle' },
  { key: 'ACCEPTED', label: 'Confirmed', icon: 'bi-check-all' },
  { key: 'PREPARING', label: 'In Kitchen', icon: 'bi-fire' },
  { key: 'READY', label: 'Food Packed', icon: 'bi-box2-heart' },
  { key: 'PICKED_UP', label: 'Out for Delivery', icon: 'bi-bicycle' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'bi-house-check-fill' },
];

/**
 * TrackingTimeline: Accessible status timeline with aria-live updates, ETA countdown, and pulse dots.
 */
const TrackingTimeline = ({ order }) => {
  if (!order) return null;

  const currentIdx = STAGES.findIndex((s) => s.key === order.status);
  const activeIdx = currentIdx !== -1 ? currentIdx : 0;
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div 
      className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4"
      role="region"
      aria-label="Order Delivery Status Timeline"
    >
      {/* Live announcement region for screen readers */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        Order status is currently {order.status}. Estimated delivery time is {order.etaMinMinutes || 20} to {order.etaMaxMinutes || 30} minutes.
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <span className="badge bg-danger-subtle text-danger fw-bold text-uppercase px-2 py-1 small mb-1 d-inline-block">
            {isCancelled ? 'CANCELLED' : order.status === 'DELIVERED' ? 'DELIVERED' : 'LIVE STATUS'}
          </span>
          <h4 className="fw-extrabold text-dark mb-0">
            {isCancelled
              ? 'Order Has Been Cancelled'
              : order.status === 'DELIVERED'
              ? 'Order Successfully Delivered!'
              : `Estimated Delivery: ${order.etaMinMinutes || 20} - ${order.etaMaxMinutes || 30} mins`}
          </h4>
        </div>
        <div className="text-end">
          <small className="text-muted d-block" style={{ fontSize: 11 }}>Order Reference</small>
          <strong className="text-dark small">#{order.orderNumber || order.id}</strong>
        </div>
      </div>

      {/* Progress Stepper */}
      {!isCancelled ? (
        <div className="position-relative py-2">
          {/* Timeline Bar */}
          <div 
            className="progress position-absolute top-50 start-0 w-100 translate-middle-y" 
            style={{ height: 4, zIndex: 1 }}
          >
            <div
              className="progress-bar bg-danger"
              role="progressbar"
              style={{
                width: `${(activeIdx / (STAGES.length - 1)) * 100}%`,
                transition: 'width 0.5s ease',
              }}
              aria-valuenow={(activeIdx / (STAGES.length - 1)) * 100}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>

          {/* Stepper Dots & Labels */}
          <div className="d-flex justify-content-between position-relative" style={{ zIndex: 2 }}>
            {STAGES.map((st, idx) => {
              const isPast = idx < activeIdx;
              const isCurrent = idx === activeIdx;

              return (
                <div key={st.key} className="text-center" style={{ width: 60 }}>
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 transition ${
                      isPast
                        ? 'bg-danger text-white'
                        : isCurrent
                        ? 'bg-danger text-white shadow'
                        : 'bg-light border text-muted'
                    }`}
                    style={{
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      outline: isCurrent ? '4px solid rgba(255, 87, 34, 0.2)' : 'none',
                    }}
                  >
                    <i className={`bi ${st.icon}`}></i>
                  </div>
                  <small
                    className={`d-block ${isCurrent ? 'fw-bold text-dark' : 'text-muted'}`}
                    style={{ fontSize: 10, lineHeight: 1.1 }}
                  >
                    {st.label}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="alert alert-danger rounded-4 p-3 mb-0 small">
          <strong>Cancellation Notice:</strong> {order.cancellationReason || 'Order was cancelled per customer or kitchen request.'}
          <div className="mt-1 text-muted" style={{ fontSize: 11 }}>
            Any paid amount will be automatically refunded to your original payment method within 2-4 business hours.
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingTimeline;
