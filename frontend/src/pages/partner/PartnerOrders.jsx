import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../../services/api";

const PartnerOrders = () => {
  const { restaurant } = useOutletContext();
  const restId = restaurant?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = async () => {
    if (!restId) return;
    try {
      const res = await api.get(`/orders/restaurant/${restId}`);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn("Error fetching partner orders", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restId]);

  const filteredOrders =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.post(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (res.success) {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
      }
    } catch (e) {
      alert(e.message || "Could not update status");
    }
  };

  return (
    <div className="container-fluid py-2">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2 bg-white p-3 rounded-4 shadow-sm border">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Kitchen Orders Ledger</h4>
          <p className="text-muted small mb-0">
            Live audit of customer tickets, prep timers, and completion state
            for {restaurant?.name}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {[
            "ALL",
            "PLACED",
            "ACCEPTED",
            "PREPARING",
            "READY",
            "DELIVERED",
            "CANCELLED",
          ].map((st) => (
            <button
              key={st}
              className={`btn btn-sm rounded-pill px-3 fw-bold ${filter === st ? "btn-danger" : "btn-light border"}`}
              style={filter === st ? { background: "#ff5c35" } : {}}
              onClick={() => setFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-muted small mt-2">Loading orders ledger...</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredOrders.length === 0 ? (
            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border p-4">
              <div className="fs-1 mb-2">📋</div>
              <h5 className="fw-bold text-dark">
                No Orders in Kitchen Pipeline
              </h5>
              <p className="text-muted small mb-0">
                Incoming customer orders from CravePulse will appear here in
                real-time.
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div key={ord.id} className="col-12">
                <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-extrabold text-dark mb-0">
                        {ord.orderNumber}
                      </h6>
                      <span
                        className={`badge ${ord.status === "PLACED" ? "bg-danger" : ord.status === "ACCEPTED" ? "bg-warning text-dark" : ord.status === "PREPARING" ? "bg-primary" : ord.status === "READY" ? "bg-info text-dark" : ord.status === "DELIVERED" ? "bg-success" : "bg-secondary"} rounded-pill px-3`}
                      >
                        {ord.status}
                      </span>
                      <span className="text-muted small">
                        •{" "}
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleString("en-IN")
                          : "Recent"}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <span className="fw-bold fs-6 text-dark">
                        ₹{ord.totalAmount}
                      </span>
                      <span className="badge bg-light text-dark border">
                        {ord.paymentMode}
                      </span>
                    </div>
                  </div>

                  <div className="row g-3 align-items-center">
                    <div className="col-md-6">
                      <div className="small text-muted mb-1">
                        Customer:{" "}
                        <strong className="text-dark">
                          {ord.customerName || `Customer #${ord.customerId}`}
                        </strong>{" "}
                        {ord.customerPhone && `(${ord.customerPhone})`}
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {ord.items?.map((it, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border p-2"
                          >
                            {it.itemName} × {it.quantity} (₹{it.unitPrice})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-6 d-flex flex-wrap justify-content-md-end gap-2">
                      {ord.status === "PLACED" && (
                        <button
                          className="btn btn-warning rounded-pill px-3 btn-sm fw-bold"
                          onClick={() => handleUpdateStatus(ord.id, "ACCEPTED")}
                        >
                          Accept Ticket ✓
                        </button>
                      )}
                      {ord.status === "ACCEPTED" && (
                        <button
                          className="btn btn-primary rounded-pill px-3 btn-sm fw-bold"
                          onClick={() =>
                            handleUpdateStatus(ord.id, "PREPARING")
                          }
                        >
                          Start Prep 🔥
                        </button>
                      )}
                      {ord.status === "PREPARING" && (
                        <button
                          className="btn btn-success rounded-pill px-3 btn-sm fw-bold"
                          onClick={() => handleUpdateStatus(ord.id, "READY")}
                        >
                          Mark Food Ready 🍱
                        </button>
                      )}
                      <Link
                        to={`/orders/${ord.orderNumber || ord.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary rounded-pill px-3 btn-sm fw-semibold"
                      >
                        KOT / Tax Invoice 🖨️
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerOrders;
