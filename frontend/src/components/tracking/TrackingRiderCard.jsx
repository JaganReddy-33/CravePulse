import React from "react";

export default function TrackingRiderCard({ order, onOpenChat }) {
  if (!order || ["CANCELLED", "REJECTED"].includes(order.status)) return null;

  return (
    <section className="card p-4 mb-4">
      <h2 className="h5">Delivery partner</h2>
      {order.riderId ? (
        <>
          <strong>{order.riderName || "Assigned delivery partner"}</strong>
          {order.riderVehicle && (
            <p className="text-muted">{order.riderVehicle}</p>
          )}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button className="btn btn-outline-primary" onClick={onOpenChat}>
              Message partner
            </button>
            {order.riderPhone && (
              <a
                className="btn btn-outline-success"
                href={`tel:${order.riderPhone}`}
              >
                Call partner
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted">
          A delivery partner has not been assigned yet.
        </p>
      )}
      {order.status !== "DELIVERED" && order.deliveryOtp && (
        <div
          className="bg-light border rounded-3 p-3 mt-3"
          aria-label="Delivery verification PIN"
        >
          <h3 className="h6 fw-bold mb-2">Your delivery PIN</h3>
          <p className="small mb-2">
            Find this on your live order-tracking page. Share it with the rider
            only when your order reaches you.
          </p>
          <strong className="fs-3" style={{ letterSpacing: "0.3em" }}>
            {order.deliveryOtp}
          </strong>
        </div>
      )}
    </section>
  );
}
