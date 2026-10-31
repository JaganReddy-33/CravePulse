import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../services/api";
import realtime from "../../services/websocket";
import { useRealtime } from "../../context/RealtimeContext";
import ModalPortal from "../../components/ModalPortal";

const COLUMNS = [
  { status: "PLACED", title: "New Orders", badge: "bg-danger text-white" },
  { status: "ACCEPTED", title: "Confirmed", badge: "bg-warning text-dark" },
  {
    status: "PREPARING",
    title: "Cooking / In Prep",
    badge: "bg-primary text-white",
  },
  { status: "READY", title: "Packed & Ready", badge: "bg-success text-white" },
];

const PREP_TIME_OPTIONS = [10, 15, 20, 25, 30, 45, 60];
const REJECTION_REASONS = [
  "Kitchen capacity overload / High rush",
  "One or more ordered items are out of stock",
  "Store closing early / Shift handover",
  "Unable to fulfill customer special instructions",
  "Operational or equipment maintenance",
];

const KitchenKanban = () => {
  const { restaurant, refreshRestaurant } = useOutletContext();
  const restId = restaurant?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isThrottled, setIsThrottled] = useState(
    restaurant?.isAutoThrottled || false,
  );
  const [isOpen, setIsOpen] = useState(restaurant?.isOpen ?? true);
  const [now, setNow] = useState(Date.now());
  const [mobileTab, setMobileTab] = useState("PLACED");
  const { playAlertSound } = useRealtime();

  // Modal States
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [selectedPrepTime, setSelectedPrepTime] = useState(20);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Sync open/throttled state when restaurant context updates
  useEffect(() => {
    if (restaurant) {
      setIsThrottled(restaurant.isAutoThrottled);
      setIsOpen(restaurant.isOpen);
    }
  }, [restaurant]);

  // Tick clock every second for live SLA countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      console.warn("Error fetching kitchen orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!restId) return;
    fetchOrders();

    // Subscribe to restaurant channel
    const channel = `restaurant:${restId}`;
    realtime.subscribe(channel);

    const offNewOrder = realtime.on("new_order_placed", (newOrd) => {
      if (Number(newOrd.restaurantId) === Number(restId)) {
        setOrders((prev) => [
          newOrd,
          ...prev.filter((o) => o.id !== newOrd.id),
        ]);
        playAlertSound("bell");
      }
    });

    const offStatus = realtime.on("order_status_updated", (payload) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.orderId ? { ...o, status: payload.status } : o,
        ),
      );
    });

    const offThrottle = realtime.on("kitchen_throttle_updated", (payload) => {
      if (Number(payload.restaurantId) === Number(restId)) {
        setIsThrottled(payload.throttled);
      }
    });

    const offRestStatus = realtime.on(
      "restaurant_status_updated",
      (payload) => {
        if (Number(payload.restaurantId) === Number(restId)) {
          setIsOpen(payload.isOpen);
        }
      },
    );

    // Polling fallback every 20 seconds
    const interval = setInterval(fetchOrders, 20000);

    return () => {
      realtime.unsubscribe(channel);
      offNewOrder();
      offStatus();
      offThrottle();
      offRestStatus();
      clearInterval(interval);
    };
  }, [restId]);

  const handleAdvanceStatus = async (
    orderId,
    nextStatus,
    extraPayload = {},
  ) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${orderId}/status`, {
        status: nextStatus,
        ...extraPayload,
      });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: nextStatus } : o,
          ),
        );
        setAcceptingOrder(null);
        setRejectingOrder(null);
      }
    } catch (e) {
      alert(e.message || "Error updating order status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleThrottle = async () => {
    if (!restId) return;
    try {
      const nextState = !isThrottled;
      const res = await api.post(`/restaurants/${restId}/toggle-throttle`, {
        throttled: nextState,
      });
      if (res.success) {
        setIsThrottled(nextState);
        if (refreshRestaurant) refreshRestaurant();
      }
    } catch (e) {
      console.error("Throttle toggle error", e);
      alert(e.message || "Failed to toggle throttle");
    }
  };

  const handleToggleOpen = async () => {
    if (!restId) return;
    try {
      const nextState = !isOpen;
      const res = await api.post(`/restaurants/${restId}/toggle-open`, {
        isOpen: nextState,
      });
      if (res.success) {
        setIsOpen(nextState);
        if (refreshRestaurant) refreshRestaurant();
      }
    } catch (e) {
      console.error("Open status toggle error", e);
      alert(e.message || "Failed to toggle restaurant status");
    }
  };

  const calculateSlaRemainingSeconds = (createdAtStr) => {
    if (!createdAtStr) return 0;
    const createdTime = new Date(createdAtStr).getTime();
    const elapsedSec = Math.floor((now - createdTime) / 1000);
    const slaTotalSec = 180; // 3 minutes acceptance SLA
    return Math.max(0, slaTotalSec - elapsedSec);
  };

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Header with Kitchen Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-kanban me-2 text-danger"></i>
            Live Kitchen Order Board
          </h4>
          <p className="text-muted small mb-0">
            Real-time ticket dispatch, prep SLA tracking, and status
            transitions.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Store Open/Close Toggle */}
          <button
            className={`btn btn-sm rounded-pill px-3 fw-bold ${isOpen ? "btn-success text-white" : "btn-outline-danger"}`}
            onClick={handleToggleOpen}
          >
            <i
              className={`bi ${isOpen ? "bi-door-open-fill" : "bi-door-closed-fill"} me-1`}
            ></i>
            {isOpen ? "Store Active (Open)" : "Store Paused (Closed)"}
          </button>

          {/* Rush Throttling Toggle */}
          <button
            className={`btn btn-sm rounded-pill px-3 fw-bold ${isThrottled ? "btn-warning text-dark" : "btn-outline-secondary"}`}
            onClick={handleToggleThrottle}
          >
            <i
              className={`bi ${isThrottled ? "bi-hourglass-split" : "bi-speedometer2"} me-1`}
            ></i>
            {isThrottled ? "Rush Throttling ON" : "Normal Capacity"}
          </button>

          <button
            className="btn btn-outline-secondary rounded-pill btn-sm px-3"
            onClick={fetchOrders}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Mobile Single-Column Tab View (< 768px) */}
      <div
        className="d-flex d-md-none gap-2 overflow-auto pb-2 mb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {COLUMNS.map((col) => {
          const count = orders.filter((o) => o.status === col.status).length;
          const isActive = mobileTab === col.status;
          return (
            <button
              key={col.status}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-nowrap d-flex align-items-center gap-2 ${
                isActive
                  ? "btn-primary text-white shadow-sm"
                  : "btn-light text-secondary border"
              }`}
              onClick={() => setMobileTab(col.status)}
            >
              <span>{col.title}</span>
              <span
                className={`badge rounded-pill ${isActive ? "bg-white text-primary" : col.badge}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-muted small mt-2">
            Connecting to kitchen order feed...
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            const isHiddenOnMobile = mobileTab !== col.status;

            return (
              <div
                key={col.status}
                className={`col-12 col-md-6 col-xl-3 ${isHiddenOnMobile ? "d-none d-md-block" : "d-block"}`}
              >
                <div className="card border-0 rounded-4 shadow-sm bg-light h-100 p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">{col.title}</h6>
                    <span className={`badge ${col.badge} rounded-pill`}>
                      {colOrders.length}
                    </span>
                  </div>

                  <div
                    className="d-flex flex-column gap-3"
                    style={{ minHeight: 450 }}
                  >
                    {colOrders.length === 0 ? (
                      <div className="text-center py-5 text-muted small">
                        No tickets in this stage
                      </div>
                    ) : (
                      colOrders.map((ord) => {
                        const slaRemainingSec = calculateSlaRemainingSeconds(
                          ord.createdAt,
                        );
                        const isSlaBreached = slaRemainingSec <= 0;
                        const minutesRemaining = Math.max(
                          0,
                          Math.floor(slaRemainingSec / 60),
                        );
                        const secondsRemaining = Math.max(
                          0,
                          slaRemainingSec % 60,
                        );

                        return (
                          <div
                            key={ord.id}
                            className="card border-0 rounded-3 shadow-sm p-3 bg-white"
                          >
                            {/* SLA countdown badge for PLACED orders */}
                            {ord.status === "PLACED" && (
                              <div
                                className={`p-1 px-2 rounded-2 mb-2 text-center small fw-bold d-flex justify-content-between align-items-center ${isSlaBreached ? "bg-danger text-white" : "bg-warning-subtle text-dark border"}`}
                              >
                                <span>
                                  <i className="bi bi-stopwatch"></i> SLA Timer:
                                </span>
                                <span>
                                  {isSlaBreached
                                    ? "EXPIRED"
                                    : `${minutesRemaining}m ${secondsRemaining}s`}
                                </span>
                              </div>
                            )}

                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <span className="fw-bold text-dark">
                                  {ord.orderNumber}
                                </span>
                                <div
                                  className="text-muted small"
                                  style={{ fontSize: 11 }}
                                >
                                  {ord.customerName ||
                                    `Customer #${ord.customerId}`}
                                </div>
                              </div>
                              <span className="badge bg-light text-dark border fw-bold">
                                ₹{ord.totalAmount}
                              </span>
                            </div>

                            <div className="small text-muted mb-2">
                              {ord.items?.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="d-flex justify-content-between py-1 border-bottom border-light"
                                >
                                  <span>
                                    {it.quantity}x {it.itemName}
                                  </span>
                                  {it.variantName && (
                                    <small className="text-muted">
                                      ({it.variantName})
                                    </small>
                                  )}
                                </div>
                              ))}
                            </div>

                            {ord.specialInstructions && (
                              <div
                                className="p-2 bg-light rounded-2 border small text-muted mb-2"
                                style={{ fontSize: 11 }}
                              >
                                <strong>Note:</strong> {ord.specialInstructions}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-2 pt-2 border-top">
                              {ord.status === "PLACED" && (
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-warning flex-grow-1 rounded-pill fw-bold"
                                    onClick={() => setAcceptingOrder(ord)}
                                  >
                                    Accept ✓
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-pill fw-bold"
                                    onClick={() => setRejectingOrder(ord)}
                                    title="Reject with reason &amp; trigger auto-refund"
                                  >
                                    Reject ✕
                                  </button>
                                </div>
                              )}
                              {ord.status === "ACCEPTED" && (
                                <button
                                  className="btn btn-sm btn-primary w-100 rounded-pill fw-bold"
                                  onClick={() =>
                                    handleAdvanceStatus(ord.id, "PREPARING")
                                  }
                                >
                                  Start Cooking 🔥
                                </button>
                              )}
                              {ord.status === "PREPARING" && (
                                <button
                                  className="btn btn-sm btn-success w-100 rounded-pill fw-bold"
                                  onClick={() =>
                                    handleAdvanceStatus(ord.id, "READY")
                                  }
                                >
                                  Mark Food Ready 🍱
                                </button>
                              )}
                              {ord.status === "READY" && (
                                <div className="text-center small text-muted py-1">
                                  <i className="bi bi-bicycle me-1 text-primary"></i>{" "}
                                  Awaiting Rider Pickup...
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accept Order with Prep Time Modal */}
      {acceptingOrder && (
        <ModalPortal>
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow-lg p-3">
                <div className="modal-header border-0 pb-1">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">
                      Accept Order {acceptingOrder.orderNumber}
                    </h5>
                    <small className="text-muted">
                      Set realistic kitchen preparation time for the customer
                      and dispatch worker.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAcceptingOrder(null)}
                  ></button>
                </div>
                <div className="modal-body py-3">
                  <label className="form-label small fw-bold text-muted">
                    Estimated Prep Time (Minutes):
                  </label>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {PREP_TIME_OPTIONS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={`btn rounded-pill px-3 py-2 fw-bold ${selectedPrepTime === mins ? "btn-warning text-dark" : "btn-outline-secondary"}`}
                        onClick={() => setSelectedPrepTime(mins)}
                      >
                        ⏱️ {mins} mins
                      </button>
                    ))}
                  </div>
                  <p className="small text-muted bg-light p-3 rounded-3 border mb-0">
                    💡 <strong>Smart SLA Notice:</strong> Selecting a realistic
                    prep time ensures the delivery rider arrives precisely when
                    the food is packed, preventing food cooling and delivery
                    delays.
                  </p>
                </div>
                <div className="modal-footer border-0 pt-1">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setAcceptingOrder(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning rounded-pill px-4 fw-bold"
                    disabled={actionLoading}
                    onClick={() =>
                      handleAdvanceStatus(acceptingOrder.id, "ACCEPTED", {
                        prepTimeMinutes: selectedPrepTime,
                      })
                    }
                  >
                    {actionLoading
                      ? "Confirming..."
                      : `Confirm & Accept (${selectedPrepTime}m)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Reject Order with Reason Modal */}
      {rejectingOrder && (
        <ModalPortal>
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow-lg p-3">
                <div className="modal-header border-0 pb-1">
                  <div>
                    <h5 className="modal-title fw-bold text-danger">
                      Reject Order {rejectingOrder.orderNumber}
                    </h5>
                    <small className="text-muted">
                      Rejection will instantly release order hold and initiate
                      an automatic refund to customer wallet/card.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setRejectingOrder(null)}
                  ></button>
                </div>
                <div className="modal-body py-3">
                  <label className="form-label small fw-bold text-muted">
                    Select Reason for Cancellation:
                  </label>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {REJECTION_REASONS.map((r, i) => (
                      <div
                        key={i}
                        className="form-check p-2 rounded-3 border hover-bg-light"
                      >
                        <input
                          className="form-check-input ms-1"
                          type="radio"
                          name="rejectReason"
                          id={`reason_${i}`}
                          checked={selectedReason === r}
                          onChange={() => setSelectedReason(r)}
                        />
                        <label
                          className="form-check-label ms-2 small fw-semibold text-dark cursor-pointer"
                          htmlFor={`reason_${i}`}
                        >
                          {r}
                        </label>
                      </div>
                    ))}
                  </div>

                  <label className="form-label small fw-bold text-muted">
                    Additional Notes (Optional):
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="e.g., Sold out paneer during peak lunch rush"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
                <div className="modal-footer border-0 pt-1">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setRejectingOrder(null)}
                  >
                    Back to Board
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4 fw-bold"
                    disabled={actionLoading}
                    onClick={() => {
                      const finalReason = customReason
                        ? `${selectedReason} - ${customReason}`
                        : selectedReason;
                      handleAdvanceStatus(rejectingOrder.id, "REJECTED", {
                        reason: finalReason,
                      });
                    }}
                  >
                    {actionLoading
                      ? "Rejecting..."
                      : "Confirm Rejection & Refund"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default KitchenKanban;
