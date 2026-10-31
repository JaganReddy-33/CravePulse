import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import LiveMap from "../../components/LiveMap";
import DisputeModal from "./DisputeModal";
import TrackingTimeline from "../../components/tracking/TrackingTimeline";
import TrackingRiderCard from "../../components/tracking/TrackingRiderCard";
import TrackingCancelModal from "../../components/tracking/TrackingCancelModal";
import TrackingChatModal from "../../components/tracking/TrackingChatModal";
import TrackingReviewModal from "../../components/tracking/TrackingReviewModal";
import LoadingState from "../../components/states/LoadingState";
import ErrorState from "../../components/states/ErrorState";
import useOrderTracking from "../../hooks/useOrderTracking";

/**
 * OrderTracking: Focused order tracking view with live GPS captain radar, status timeline,
 * masked communication, and cancellation workflows.
 */
const OrderTracking = () => {
  const { orderNumber } = useParams();
  const {
    order,
    loading,
    error,
    riderCoords,
    chatMessages,
    cancelOrder,
    sendChatMessage,
    submitReview,
  } = useOrderTracking(orderNumber);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatTarget, setChatTarget] = useState("RIDER");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const handleConfirmCancel = async (reason) => {
    setCancelling(true);
    const cancelled = await cancelOrder(reason);
    setCancelling(false);
    if (cancelled) setShowCancelModal(false);
  };

  if (loading && !order) {
    return (
      <div className="container py-5 customer-content-container">
        <LoadingState message="Connecting to live dispatch radar & GPS satellites..." />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container py-5 customer-content-container">
        <ErrorState
          title="Order Not Found"
          message={`We couldn't locate order reference #${orderNumber}. Please check your order history.`}
        />
      </div>
    );
  }

  if (!order) return <div className="container py-5">Order unavailable.</div>;
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const canCancelOrder = ["PLACED", "ACCEPTED"].includes(order.status);

  return (
    <div
      className="container py-4 customer-content-container"
      style={{ maxWidth: 1040 }}
    >
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {/* 1. Accessible Status Timeline */}
      <TrackingTimeline order={order} />

      <div className="row g-4">
        {/* Left Column: Live GPS Map Radar & Delivery Captain Card */}
        <div className="col-lg-7">
          {/* Live Map Radar */}
          {!isCancelled && (
            <div className="card border-0 rounded-4 shadow-sm p-3 bg-white mb-4 overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <span className="small fw-bold text-dark d-flex align-items-center gap-1">
                  <span
                    className="spinner-grow spinner-grow-sm text-danger"
                    role="status"
                  ></span>
                  Live Dispatch Radar
                </span>
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                  GPS High Precision Locked
                </span>
              </div>
              <div
                style={{ height: 320, borderRadius: 16, overflow: "hidden" }}
              >
                <LiveMap
                  restaurantCoords={
                    order.restaurantLat != null && order.restaurantLng != null
                      ? [order.restaurantLat, order.restaurantLng]
                      : null
                  }
                  deliveryCoords={
                    order.deliveryLat != null && order.deliveryLng != null
                      ? [order.deliveryLat, order.deliveryLng]
                      : null
                  }
                  riderCoords={riderCoords}
                  status={order.status}
                />
              </div>
            </div>
          )}

          {/* Assigned Delivery Captain Card */}
          <TrackingRiderCard
            order={order}
            onOpenChat={() => setShowChatModal(true)}
          />
        </div>

        {/* Right Column: Order Details, Delivery Address & Actions */}
        <div className="col-lg-5">
          {/* Delivery Address & Kitchen Info */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <h6 className="fw-bold text-dark mb-3">Order Details</h6>
            <div className="d-flex flex-column gap-3 small">
              <div>
                <span className="text-muted d-block" style={{ fontSize: 11 }}>
                  Restaurant Partner
                </span>
                <strong className="text-dark">{order.restaurantName}</strong>
              </div>
              <div>
                <span className="text-muted d-block" style={{ fontSize: 11 }}>
                  Delivery Address
                </span>
                <p className="text-dark mb-0">{order.deliveryAddress}</p>
              </div>
              <div>
                <span className="text-muted d-block" style={{ fontSize: 11 }}>
                  Payment Details
                </span>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-dark fw-semibold">
                    {order.paymentMode || "Online Payment"}
                  </span>
                  <strong className="text-danger fs-6">
                    ₹{order.totalAmount}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Action Buttons */}
          <div className="d-flex flex-column gap-2 mb-4">
            {/* Post-Delivery Review Button */}
            {isDelivered && (
              <button
                type="button"
                className="btn btn-primary rounded-pill py-2 fw-bold touch-target shadow hover-lift text-white"
                style={{
                  background: "var(--c-primary)",
                  borderColor: "var(--c-primary)",
                }}
                onClick={() => setShowReviewModal(true)}
              >
                ★ Rate Your Meal Experience
              </button>
            )}

            {/* Dispute & Escrow Claim Button */}
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill py-2 fw-semibold touch-target"
              onClick={() => setShowDisputeModal(true)}
            >
              Raise Issue / Claim Refund
            </button>

            {/* Cancel Order Button */}
            {canCancelOrder && (
              <button
                type="button"
                className="btn btn-link text-danger text-decoration-none small touch-target"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Order
              </button>
            )}
            {!isDelivered && !isCancelled && !canCancelOrder && (
              <p className="small text-muted text-center mb-0">
                Cancellation is unavailable after the kitchen starts preparing
                your order.
              </p>
            )}

            {/* Tax Invoice Link */}
            <Link
              to={`/orders/${order.orderNumber || order.id}/invoice`}
              className="btn btn-link text-muted text-decoration-none small touch-target text-center"
            >
              <i className="bi bi-file-earmark-text me-1"></i> Download Tax
              Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <TrackingCancelModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={handleConfirmCancel}
        cancelling={cancelling}
        orderStatus={order.status}
      />

      {/* In-App Chat Modal */}
      <TrackingChatModal
        show={showChatModal}
        onClose={() => setShowChatModal(false)}
        chatTarget={chatTarget}
        setChatTarget={setChatTarget}
        chatMessages={chatMessages}
        onSendMessage={sendChatMessage}
        order={order}
      />

      {/* Post-Delivery Review Modal */}
      <TrackingReviewModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmitReview={submitReview}
        restaurantName={order.restaurantName}
      />

      {/* Dispute Resolution Modal */}
      <DisputeModal
        show={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        order={order}
      />
    </div>
  );
};

export default OrderTracking;
