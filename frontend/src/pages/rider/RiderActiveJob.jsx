import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import realtime from "../../services/websocket";
import LiveMap from "../../components/LiveMap";
import ModalPortal from "../../components/ModalPortal";
import { getGoogleMapsNavigationUrl } from "../../utils/googleMaps";

const RiderActiveJob = () => {
  const [profile, setProfile] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [dispatchError, setDispatchError] = useState("");
  const [activeJobOffer, setActiveJobOffer] = useState(null);
  const [riderProfileId, setRiderProfileId] = useState(null);
  const offersRequestRef = useRef(0);
  const offerEventRevisionRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [milestoneUpdating, setMilestoneUpdating] = useState(false);
  const activeOrderIdRef = useRef(null);

  // Workflow state machine: 'ACCEPTED' | 'AT_KITCHEN' | 'PICKED_UP' | 'AT_DOORSTEP' | 'DELIVERED'
  const [currentStep, setCurrentStep] = useState("ACCEPTED");

  // Kitchen wait time meter state
  const [waitingAtKitchen, setWaitingAtKitchen] = useState(false);
  const [waitTimerMinutes, setWaitTimerMinutes] = useState(0);
  const [claimedWaitPay, setClaimedWaitPay] = useState(0);

  // Bag item verification checklist
  const [verifiedItems, setVerifiedItems] = useState({});

  // Handover modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [deliveryComplete, setDeliveryComplete] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("PUNCTURE_OR_BREAKDOWN");

  // Fetch the authenticated rider?s current dispatch
  const fetchActiveJob = async () => {
    try {
      const pRes = await api.get("/rider/profile");
      if (pRes.success) {
        setProfile(pRes.data);
        setRiderProfileId(pRes.data?.id ?? null);
        setIsOnline(Boolean(pRes.data?.online ?? pRes.data?.isOnline));
      }

      const jobRes = await api
        .get("/rider/active-job")
        .catch(() => api.get("/rider/orders/active"));
      if (jobRes && jobRes.success && jobRes.data) {
        const job = {
          ...jobRes.data,
          deliveryAddress:
            jobRes.data.customerAddress ?? jobRes.data.deliveryAddress,
          deliveryLat: jobRes.data.customerLat ?? jobRes.data.deliveryLat,
          deliveryLng: jobRes.data.customerLng ?? jobRes.data.deliveryLng,
        };
        const arrivedAtKitchen = Boolean(job.arrivedAtRestaurantAt);
        const pickedUp = Boolean(job.pickedUpAt);
        const arrivedAtCustomer = Boolean(job.arrivedAtCustomerAt);
        setActiveJob(job);
        setCurrentStep(
          arrivedAtCustomer
            ? "AT_DOORSTEP"
            : pickedUp
              ? "PICKED_UP"
              : arrivedAtKitchen
                ? "AT_KITCHEN"
                : "ACCEPTED",
        );
        if (activeOrderIdRef.current !== job.orderId) {
          const recordedWait = Number(job.waitTimeMinutes) || 0;
          const arrivalTime = Date.parse(job.arrivedAtRestaurantAt);
          const elapsedSinceArrival =
            arrivedAtKitchen && !pickedUp && Number.isFinite(arrivalTime)
              ? Math.max(0, Math.floor((Date.now() - arrivalTime) / 60000))
              : 0;
          setWaitingAtKitchen(
            arrivedAtKitchen && !pickedUp && !job.waitCompensationClaimed,
          );
          setWaitTimerMinutes(Math.max(recordedWait, elapsedSinceArrival));
          setClaimedWaitPay(Number(job.waitTimePay) || 0);
          activeOrderIdRef.current = job.orderId;
        }
      } else {
        setActiveJob(null);
        setCurrentStep("ACCEPTED");
        activeOrderIdRef.current = null;
      }
    } catch (e) {
      setActiveJob(null);
      setDispatchError(e.message || "Unable to load your active delivery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJob();
  }, []);

  useEffect(() => {
    if (!riderProfileId) return undefined;

    const channel = `rider:${riderProfileId}`;
    realtime.subscribe(channel);
    const loadOffers = async () => {
      const requestId = ++offersRequestRef.current;
      const eventRevision = offerEventRevisionRef.current;
      try {
        const res = await api.get("/rider/offers");
        if (requestId === offersRequestRef.current && res.success) {
          if (res.data?.length) {
            setActiveJobOffer(res.data[0]);
          } else if (eventRevision === offerEventRevisionRef.current) {
            setActiveJobOffer(null);
          }
        }
      } catch (err) {
        if (requestId === offersRequestRef.current) {
          setDispatchError(err.message);
        }
      }
    };
    const onJobOffer = (offer) => {
      if (offer && (offer.dispatchId != null || offer.id != null)) {
        offerEventRevisionRef.current += 1;
        setActiveJobOffer({
          ...offer,
          id: offer.id ?? offer.dispatchId,
        });
      }
    };
    const onOfferTimeout = (offer) => {
      setActiveJobOffer((current) =>
        current?.id === offer?.dispatchId ? null : current,
      );
      loadOffers();
    };
    const onConnectionStatus = (status) => {
      if (status?.status === "connected") {
        loadOffers();
        fetchActiveJob();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadOffers();
        fetchActiveJob();
      }
    };

    const off = realtime.on("rider_job_offer", onJobOffer);
    const offTimeout = realtime.on("rider_offer_timed_out", onOfferTimeout);
    const offConnection = realtime.on("connection_status", onConnectionStatus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    loadOffers();
    const timer = setInterval(() => {
      loadOffers();
      fetchActiveJob();
    }, 10000);
    return () => {
      off();
      offTimeout();
      offConnection();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      realtime.unsubscribe(channel);
      clearInterval(timer);
    };
  }, [riderProfileId]);

  // Wait time counter
  useEffect(() => {
    let interval;
    if (waitingAtKitchen) {
      interval = setInterval(() => {
        setWaitTimerMinutes((prev) => prev + 1);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [waitingAtKitchen]);

  // Keep the rider's dispatch location fresh while on duty, before an offer arrives.
  useEffect(() => {
    if (!isOnline && !activeJob) return undefined;
    const geolocation = navigator.geolocation;
    if (!geolocation) {
      setGpsError("Enable device location to receive nearby delivery offers.");
      return undefined;
    }

    const watch = geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setGpsCoords([latitude, longitude]);
        setGpsError("");
        api
          .post("/rider/telemetry", {
            orderId: activeJob?.orderId ?? null,
            latitude,
            longitude,
            speed: speed == null ? 0 : speed * 3.6,
            heading: heading || 0,
          })
          .catch((err) => setGpsError(err.message || "Location update failed."));
      },
      (error) => {
        setGpsError(
          error.code === error.PERMISSION_DENIED
            ? "Allow location access to receive nearby delivery offers."
            : "Unable to get your current location. Check your device GPS.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => geolocation.clearWatch(watch);
  }, [isOnline, activeJob?.orderId]);

  const toggleItemVerified = (itemId) => {
    setVerifiedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const allItemsVerified =
    activeJob?.items?.length > 0 &&
    activeJob.items.every((i) => verifiedItems[i.id]);
  const deliveryNavigationUrl = getGoogleMapsNavigationUrl(
    activeJob?.customerMapsUrl,
    activeJob?.deliveryLat,
    activeJob?.deliveryLng,
  );
  const restaurantNavigationUrl = getGoogleMapsNavigationUrl(
    activeJob?.restaurantMapsUrl,
    activeJob?.restaurantLat,
    activeJob?.restaurantLng,
  );
  const customerPhone = activeJob?.customerPhone
    ? String(activeJob.customerPhone).replace(/[^\d+]/g, "")
    : "";
  const hasCustomerPhone = customerPhone.replace(/\D/g, "").length >= 7;

  const closeDeliveryModal = () => {
    if (deliveryComplete) return;
    setShowDeliveryModal(false);
    setDeliveryOtp("");
    setDeliveryError("");
  };

  const handleArriveAtKitchen = async () => {
    if (!activeJob) return;
    setDispatchError("");
    setMilestoneUpdating(true);
    try {
      const response = await api.post(
        `/rider/orders/${activeJob.orderId}/status`,
        { status: "ARRIVED_AT_RESTAURANT" },
      );
      if (!response.success) {
        throw new Error(
          response.message || "Could not record kitchen arrival.",
        );
      }
      setWaitingAtKitchen(true);
      setWaitTimerMinutes(0);
      setCurrentStep("AT_KITCHEN");
    } catch (e) {
      setDispatchError(e.message || "Could not record kitchen arrival.");
    } finally {
      setMilestoneUpdating(false);
    }
  };

  const handleClaimWaitCompensation = async () => {
    if (activeJob) {
      try {
        const res = await api.post(
          `/rider/orders/${activeJob.orderId}/wait-compensation`,
        );
        if (
          res.success &&
          res.data &&
          res.data.compensationCredited !== undefined
        ) {
          setClaimedWaitPay(parseFloat(res.data.compensationCredited));
        } else {
          setDispatchError("Wait compensation was not credited. Please retry.");
          return;
        }
      } catch (e) {
        setDispatchError(
          e.message || "Wait compensation was not credited. Please retry.",
        );
        return;
      }
      setWaitingAtKitchen(false);
    } else {
      setWaitingAtKitchen(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeJob) return;
    setDispatchError("");
    setMilestoneUpdating(true);
    try {
      const response = await api.post(
        `/rider/orders/${activeJob.orderId}/status`,
        { status: "PICKED_UP" },
      );
      if (!response.success) {
        throw new Error(response.message || "Could not record pickup.");
      }
      setCurrentStep("PICKED_UP");
    } catch (e) {
      setDispatchError(e.message || "Could not record pickup.");
    } finally {
      setMilestoneUpdating(false);
    }
  };

  const handleArriveAtCustomer = async () => {
    if (!activeJob) return;
    setDispatchError("");
    setMilestoneUpdating(true);
    try {
      const response = await api.post(
        `/rider/orders/${activeJob.orderId}/status`,
        { status: "ARRIVED_AT_CUSTOMER" },
      );
      if (!response.success) {
        throw new Error(
          response.message || "Could not record customer arrival.",
        );
      }
      setCurrentStep("AT_DOORSTEP");
    } catch (e) {
      setDispatchError(e.message || "Could not record customer arrival.");
    } finally {
      setMilestoneUpdating(false);
    }
  };

  const handleConfirmFinalDelivery = async () => {
    if (!/^\d{4}$/.test(deliveryOtp)) {
      setDeliveryError(
        "Enter the customer's 4-digit delivery PIN to continue.",
      );
      return;
    }
    if (currentStep !== "AT_DOORSTEP") {
      setDeliveryError(
        "Record your arrival at the customer's address before handover.",
      );
      return;
    }
    setDeliveryError("");
    setDispatchError("");
    try {
      const res = await api.post(`/rider/orders/${activeJob.orderId}/status`, {
        status: "DELIVERED",
        deliveryOtp,
      });
      if (res.success) {
        setDeliveryComplete(true);
        setTimeout(() => {
          setShowDeliveryModal(false);
          setDeliveryOtp("");
          setActiveJob(null);
        }, 2200);
      } else {
        setDeliveryError(res.message || "Delivery confirmation failed.");
      }
    } catch (e) {
      setDeliveryError(
        e.message || "Invalid delivery PIN or error completing delivery.",
      );
    }
  };

  const handleToggleOnline = async () => {
    setDispatchError("");
    try {
      const next = !isOnline;
      const response = await api.post("/rider/profile/status", {
        online: next,
      });
      if (!response.success) {
        throw new Error(response.message || "Unable to update online status.");
      }
      setIsOnline(next);
    } catch (e) {
      setDispatchError(e.message || "Unable to update online status.");
    }
  };

  return (
    <div className="rider-cockpit-container position-relative">
      {loading && (
        <div
          className="d-flex align-items-center gap-2 text-light py-4"
          role="status"
        >
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          ></span>
          Loading your active delivery…
        </div>
      )}
      {dispatchError && (
        <div className="alert alert-danger" role="alert">
          {dispatchError}
        </div>
      )}
      {!activeJob && activeJobOffer && (
        <div className="card p-4 mb-4">
          <h2 className="h5">New delivery offer</h2>
          <p>
            {activeJobOffer.orderNumber || `Order ${activeJobOffer.orderId}`} ·
            Earning: {Number(activeJobOffer.totalEarning || 0).toFixed(2)} INR
          </p>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-success"
              onClick={async () => {
                try {
                  await api.post(`/rider/${activeJobOffer.id}/accept`, {});
                  setActiveJobOffer(null);
                  await fetchActiveJob();
                } catch (err) {
                  setDispatchError(err.message);
                }
              }}
            >
              Accept delivery
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={async () => {
                try {
                  await api.post(`/rider/${activeJobOffer.id}/reject`, {});
                  setActiveJobOffer(null);
                } catch (err) {
                  setDispatchError(err.message);
                }
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}
      {activeJob ? (
        <div className="row g-3 g-xl-4 align-items-start">
          {/* ====================================================================
              LEFT COLUMN: MISSION CONTROL, TIMELINE & ITEM CHECKLIST
              ==================================================================== */}
          <div className="col-12 col-xl-7">
            {/* Mission Hero Banner */}
            <div
              className="p-3 p-md-4 rounded-4 shadow-xl mb-3 position-relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)",
                border: "1.5px solid rgba(0, 230, 118, 0.25)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              {/* Top Meta Header */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span
                      className="badge rounded-pill fw-extrabold text-dark px-3 py-1.5"
                      style={{
                        background: "#00e676",
                        fontSize: 10,
                        letterSpacing: 0.5,
                      }}
                    >
                      LIVE RUN IN PROGRESS
                    </span>
                    <span className="font-monospace small text-secondary">
                      {activeJob.orderNumber}
                    </span>
                  </div>
                  <h4 className="fw-extrabold text-white mb-0">
                    Delivery Run Dispatch
                  </h4>
                </div>

                <div className="text-end">
                  <span
                    className="display-6 fw-extrabold lh-1 d-block mb-1"
                    style={{ color: "#00e676", fontSize: "2rem" }}
                  >
                    ₹{Number(activeJob.totalEarning || 0).toFixed(2)}
                  </span>
                  <div
                    className="badge bg-dark border border-secondary border-opacity-50 text-secondary"
                    style={{ fontSize: 9 }}
                  >
                    BASE ₹{activeJob.basePay} + DIST ₹{activeJob.distancePay} +
                    100% TIP ₹{activeJob.tipAmount}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 01: Kitchen Pickup Elevated Container */}
            <div
              className={`p-3 p-md-4 rounded-4 mb-3 transition shadow-lg ${
                currentStep === "ACCEPTED" || currentStep === "AT_KITCHEN"
                  ? "cockpit-step-active"
                  : "cockpit-step-completed"
              }`}
              style={{
                background: "rgba(15, 23, 42, 0.82)",
                backdropFilter: "blur(16px)",
                border:
                  currentStep === "ACCEPTED" || currentStep === "AT_KITCHEN"
                    ? "2px solid #00e676"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow:
                  currentStep === "ACCEPTED" || currentStep === "AT_KITCHEN"
                    ? "0 0 25px rgba(0, 230, 118, 0.15)"
                    : "none",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: 32,
                      height: 32,
                      background:
                        currentStep === "PICKED_UP" ? "#00e676" : "#1e293b",
                      color:
                        currentStep === "PICKED_UP" ? "#080c14" : "#ffffff",
                      fontSize: 13,
                    }}
                  >
                    {currentStep === "PICKED_UP" ? "✓" : "01"}
                  </div>
                  <div>
                    <span
                      className="small fw-extrabold text-uppercase tracking-wider"
                      style={{ color: "#00e676", fontSize: 11 }}
                    >
                      STEP 01 • KITCHEN PICKUP
                    </span>
                    <h5 className="fw-bold text-white mb-0">
                      {activeJob.restaurantName}
                    </h5>
                  </div>
                </div>
              </div>

              <p className="text-secondary small mb-3 d-flex align-items-center gap-1.5">
                <i className="bi bi-geo-alt-fill text-warning"></i>
                <span>{activeJob.restaurantAddress}</span>
              </p>

              {/* 48px Glove-Friendly Navigation Button */}
              {restaurantNavigationUrl ? (
                <a
                  href={restaurantNavigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn w-100 rounded-pill fw-bold text-dark d-flex align-items-center justify-content-center gap-2 mb-3 shadow-md transition hover-lift"
                  style={{
                    minHeight: 50,
                    background: "#00e676",
                    fontSize: 15,
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0, 230, 118, 0.35)",
                  }}
                >
                  <i className="bi bi-geo-fill fs-5"></i>
                  <span>Open Kitchen in Google Maps ↗</span>
                </a>
              ) : (
                <div className="alert alert-warning small mb-3" role="status">
                  Kitchen map coordinates are unavailable for navigation.
                </div>
              )}

              {/* Modern Wait-Time Compensation Meter Widget */}
              <div
                className="p-3 rounded-4 mb-3"
                style={{
                  background: "rgba(8, 12, 20, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-5">⏱️</span>
                    <div>
                      <strong className="text-white small d-block">
                        Kitchen Wait Meter
                      </strong>
                      <small
                        className="text-secondary"
                        style={{ fontSize: 10 }}
                      >
                        Server-verified after 8 minutes; ₹2/min, up to ₹100
                      </small>
                    </div>
                  </div>
                  <span
                    className="badge rounded-pill fw-extrabold px-3 py-1.5"
                    style={{
                      background:
                        waitTimerMinutes > 8
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(255, 255, 255, 0.1)",
                      color: waitTimerMinutes > 8 ? "#ff5252" : "#00e676",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      fontSize: 12,
                    }}
                  >
                    {waitTimerMinutes} Mins Elapsed
                  </span>
                </div>

                {currentStep === "ACCEPTED" ? (
                  <button
                    type="button"
                    className="btn btn-outline-light w-100 rounded-pill fw-bold py-2.5 small transition"
                    style={{
                      minHeight: 46,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    }}
                    onClick={handleArriveAtKitchen}
                    disabled={milestoneUpdating}
                  >
                    {milestoneUpdating
                      ? "Recording arrival…"
                      : "Mark arrival at kitchen"}
                  </button>
                ) : currentStep === "AT_KITCHEN" && waitingAtKitchen ? (
                  <button
                    type="button"
                    className="btn btn-warning w-100 rounded-pill fw-bold py-2.5 text-dark shadow-sm"
                    style={{ minHeight: 46 }}
                    onClick={handleClaimWaitCompensation}
                  >
                    Claim kitchen wait compensation
                  </button>
                ) : currentStep === "AT_KITCHEN" ? (
                  <p className="small text-secondary mb-0" role="status">
                    Kitchen arrival recorded.
                  </p>
                ) : (
                  <p className="small text-secondary mb-0" role="status">
                    Kitchen pickup completed.
                  </p>
                )}

                {claimedWaitPay > 0 && (
                  <div className="text-success small fw-bold text-center mt-2">
                    ✓ ₹{claimedWaitPay} credited directly into your wallet
                    balance!
                  </div>
                )}
              </div>

              {/* Large Touch-Target Bag Item Verification Checklist */}
              <div className="pt-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span
                    className="small fw-extrabold text-light text-uppercase tracking-wider"
                    style={{ fontSize: 11 }}
                  >
                    Order item check
                  </span>
                  <span
                    className="badge rounded-pill fw-bold px-2.5 py-1"
                    style={{
                      background: allItemsVerified
                        ? "#00e676"
                        : "rgba(255, 255, 255, 0.12)",
                      color: allItemsVerified ? "#080c14" : "#94a3b8",
                      fontSize: 10,
                    }}
                  >
                    {Object.values(verifiedItems).filter(Boolean).length} /{" "}
                    {activeJob.items?.length} Verified
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 mb-3">
                  {activeJob.items?.map((item) => {
                    const isChecked = !!verifiedItems[item.id];
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleItemVerified(item.id)}
                        aria-pressed={isChecked}
                        aria-label={`${isChecked ? "Uncheck" : "Check"} ${item.itemName}, quantity ${item.quantity}`}
                        className="p-3 rounded-3 d-flex align-items-center justify-content-between transition cursor-pointer"
                        style={{
                          width: "100%",
                          color: "inherit",
                          textAlign: "left",
                          minHeight: 54,
                          background: isChecked
                            ? "rgba(0, 230, 118, 0.12)"
                            : "rgba(10, 15, 26, 0.85)",
                          border: isChecked
                            ? "1.5px solid #00e676"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: isChecked
                            ? "0 0 16px rgba(0, 230, 118, 0.12)"
                            : "none",
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center transition flex-shrink-0"
                            style={{
                              width: 28,
                              height: 28,
                              background: isChecked ? "#00e676" : "transparent",
                              border: isChecked
                                ? "none"
                                : "2px solid rgba(255, 255, 255, 0.35)",
                              color: isChecked ? "#080c14" : "transparent",
                            }}
                          >
                            <i className="bi bi-check-lg fw-extrabold fs-6"></i>
                          </div>
                          <div>
                            <div
                              className={`fw-bold small ${isChecked ? "text-white" : "text-light"}`}
                            >
                              {item.itemName}
                            </div>
                          </div>
                        </div>

                        <span
                          className="badge rounded-pill fw-bold px-2.5 py-1"
                          style={{
                            background: isChecked
                              ? "#00e676"
                              : "rgba(255, 255, 255, 0.1)",
                            color: isChecked ? "#080c14" : "#ffffff",
                            fontSize: 11,
                          }}
                        >
                          x{item.quantity}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-light w-100 rounded-pill fw-bold py-3 small d-flex align-items-center justify-content-center gap-2 transition"
                  style={{
                    minHeight: 48,
                    borderColor: "rgba(255, 255, 255, 0.25)",
                  }}
                  onClick={handleConfirmPickup}
                  disabled={
                    milestoneUpdating ||
                    currentStep !== "AT_KITCHEN" ||
                    currentStep === "PICKED_UP" ||
                    currentStep === "AT_DOORSTEP" ||
                    !allItemsVerified
                  }
                >
                  <i className="bi bi-box-seam text-success fs-5"></i>
                  <span>
                    {milestoneUpdating
                      ? "Recording pickup…"
                      : currentStep === "PICKED_UP" ||
                          currentStep === "AT_DOORSTEP"
                        ? "Pickup confirmed"
                        : allItemsVerified
                          ? "Confirm items picked up"
                          : "Verify every item to confirm pickup"}
                  </span>
                </button>
              </div>
            </div>

            {/* Step 02: Customer Doorstep Elevated Container */}
            <div
              className={`p-3 p-md-4 rounded-4 shadow-lg transition ${
                currentStep === "PICKED_UP" || currentStep === "AT_DOORSTEP"
                  ? "cockpit-step-active"
                  : "cockpit-step-pending"
              }`}
              style={{
                background: "rgba(15, 23, 42, 0.82)",
                backdropFilter: "blur(16px)",
                border:
                  currentStep === "PICKED_UP" || currentStep === "AT_DOORSTEP"
                    ? "2px solid #38bdf8"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow:
                  currentStep === "PICKED_UP" || currentStep === "AT_DOORSTEP"
                    ? "0 0 25px rgba(56, 189, 248, 0.2)"
                    : "none",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{
                      width: 32,
                      height: 32,
                      background:
                        currentStep === "AT_DOORSTEP"
                          ? "#00e676"
                          : currentStep === "PICKED_UP"
                            ? "#0284c7"
                            : "#1e293b",
                      fontSize: 13,
                    }}
                  >
                    {currentStep === "AT_DOORSTEP" ? "✓" : "02"}
                  </div>
                  <div>
                    <span
                      className="small fw-extrabold text-uppercase tracking-wider text-info"
                      style={{ fontSize: 11 }}
                    >
                      STEP 02 • DOORSTEP DELIVERY
                    </span>
                    <h5 className="fw-bold text-white mb-0">
                      {activeJob.customerName}
                    </h5>
                  </div>
                </div>

                {hasCustomerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    className="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center p-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    }}
                    aria-label={`Call ${activeJob.customerName}`}
                  >
                    <i
                      className="bi bi-telephone-fill text-info fs-6"
                      aria-hidden="true"
                    ></i>
                  </a>
                )}
              </div>

              <p className="text-secondary small mb-2 d-flex align-items-center gap-1.5">
                <i className="bi bi-geo-alt-fill text-info"></i>
                <span>{activeJob.deliveryAddress}</span>
              </p>

              {activeJob.deliveryInstructions && (
                <div
                  className="p-3 rounded-3 mb-3 small"
                  style={{
                    background: "rgba(14, 165, 233, 0.1)",
                    border: "1px solid rgba(14, 165, 233, 0.25)",
                    color: "#bae6fd",
                  }}
                >
                  <i className="bi bi-bell-fill me-1 text-info"></i>
                  <strong>Doorbell / Drop Note:</strong>{" "}
                  {activeJob.deliveryInstructions}
                </div>
              )}

              {/* 48px Glove-Friendly Navigation Button */}
              {deliveryNavigationUrl ? (
                <a
                  href={deliveryNavigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn w-100 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2 mb-3 shadow-md transition hover-lift"
                  style={{
                    minHeight: 50,
                    background: "#0284c7",
                    fontSize: 15,
                    border: "none",
                    boxShadow: "0 4px 16px rgba(2, 132, 199, 0.35)",
                  }}
                >
                  <i className="bi bi-compass-fill fs-5"></i>
                  <span>Navigate to Customer Doorstep ↗</span>
                </a>
              ) : (
                <div className="alert alert-warning small mb-3" role="status">
                  Customer map coordinates are unavailable for navigation.
                </div>
              )}

              {currentStep === "PICKED_UP" ? (
                <button
                  type="button"
                  className="btn w-100 rounded-pill fw-bold text-dark shadow d-flex align-items-center justify-content-center gap-2 transition"
                  style={{
                    minHeight: 52,
                    background: "#7dd3fc",
                    fontSize: 16,
                    border: "none",
                  }}
                  onClick={handleArriveAtCustomer}
                  disabled={milestoneUpdating}
                >
                  <i className="bi bi-geo-alt-fill fs-5" aria-hidden="true"></i>
                  <span>
                    {milestoneUpdating
                      ? "Recording arrival…"
                      : "Mark arrival at customer"}
                  </span>
                </button>
              ) : currentStep === "AT_DOORSTEP" ? (
                <button
                  type="button"
                  className="btn w-100 rounded-pill fw-extrabold text-dark shadow d-flex align-items-center justify-content-center gap-2 transition"
                  style={{
                    minHeight: 54,
                    background: "#00e676",
                    fontSize: 16,
                    border: "none",
                    boxShadow: "0 0 25px rgba(0, 230, 118, 0.32)",
                  }}
                  onClick={() => {
                    setDeliveryError("");
                    setShowDeliveryModal(true);
                  }}
                >
                  <i className="bi bi-shield-check fs-4" aria-hidden="true"></i>
                  <span>Verify customer delivery PIN</span>
                </button>
              ) : (
                <p className="small text-secondary mb-0" role="status">
                  Customer arrival can be recorded after pickup.
                </p>
              )}
            </div>
          </div>

          {/* ====================================================================
              RIGHT COLUMN: HIGH-IMPACT SATELLITE RADAR MAP & TURN HUD
              ==================================================================== */}
          <div className="col-12 col-xl-5">
            {/* Live Interactive Navigation Map Container */}
            <div
              className="card border-0 rounded-4 shadow-2xl overflow-hidden mb-3 text-white position-relative"
              style={{
                background: "#090d16",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              {/* Route details come from this dispatch; navigation guidance opens in Maps. */}
              <div
                className="position-absolute d-flex align-items-center justify-content-between p-3 rounded-4 shadow-2xl"
                style={{
                  top: 14,
                  left: 14,
                  right: 14,
                  zIndex: 1000,
                  background: "rgba(15, 23, 42, 0.94)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-dark fw-extrabold flex-shrink-0"
                    style={{
                      width: 42,
                      height: 42,
                      background: "#00e676",
                      fontSize: 20,
                    }}
                  >
                    <i className="bi bi-arrow-up-right"></i>
                  </div>
                  <div>
                    <strong
                      className="d-block text-white small"
                      style={{ fontSize: 13 }}
                    >
                      {currentStep === "PICKED_UP" ||
                      currentStep === "AT_DOORSTEP"
                        ? "Customer delivery"
                        : "Kitchen pickup"}
                    </strong>
                    <small className="text-secondary" style={{ fontSize: 10 }}>
                      {currentStep === "PICKED_UP" ||
                      currentStep === "AT_DOORSTEP"
                        ? activeJob.deliveryAddress ||
                          "Customer address unavailable"
                        : activeJob.restaurantAddress ||
                          "Kitchen address unavailable"}
                    </small>
                  </div>
                </div>

                <div className="text-end ps-2 flex-shrink-0">
                  <small className="text-secondary">Open Maps</small>
                </div>
              </div>

              {/* Dark-Matter Leaflet Map */}
              <div style={{ height: 420, width: "100%", position: "relative" }}>
                <LiveMap
                  restaurantCoords={[
                    activeJob.restaurantLat,
                    activeJob.restaurantLng,
                  ]}
                  deliveryCoords={[
                    activeJob.deliveryLat,
                    activeJob.deliveryLng,
                  ]}
                  riderCoords={gpsCoords}
                  riderName={profile?.riderName || ""}
                  darkMode={true}
                  height="420px"
                  interactive={true}
                />
              </div>

              {/* Map Footer Telemetry Bar */}
              <div
                className="p-3 d-flex align-items-center justify-content-between border-top border-dark"
                style={{ background: "rgba(10, 15, 26, 0.96)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="spinner-grow spinner-grow-sm text-success"
                    style={{ width: 7, height: 7 }}
                  ></span>
                  <small
                    className="text-light fw-bold"
                    style={{ fontSize: 11 }}
                  >
                    {gpsCoords
                      ? `GPS position: ${gpsCoords[0].toFixed(5)}, ${gpsCoords[1].toFixed(5)}`
                      : "Waiting for device GPS permission"}
                  </small>
                </div>
                <span
                  className={`badge rounded-pill ${gpsCoords ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"} small`}
                >
                  {gpsCoords ? "GPS active" : "GPS unavailable"}
                </span>
              </div>
            </div>

            {/* Captain Shift Performance Radar Card */}
            <div
              className="p-3 p-md-4 rounded-4 shadow-xl text-white"
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <h6 className="fw-extrabold small text-secondary text-uppercase mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-graph-up text-success"></i>
                <span>Rider profile</span>
              </h6>

              <div className="row g-2 text-center small mb-3">
                <div className="col-6">
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "#0a0f1d",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      className="text-secondary d-block"
                      style={{ fontSize: 9 }}
                    >
                      COMPLETED DELIVERIES
                    </span>
                    <strong className="fs-5 text-white">
                      {profile?.totalDeliveries ?? "—"}
                    </strong>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "#0a0f1d",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      className="text-secondary d-block"
                      style={{ fontSize: 9 }}
                    >
                      RIDER RATING
                    </span>
                    <strong className="fs-5 text-success">
                      {profile?.rating != null && Number(profile.rating) > 0
                        ? `${Number(profile.rating).toFixed(1)} ★`
                        : "Not rated"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !loading && !activeJobOffer ? (
        /* Standby Radar State */
        <div
          className="p-5 rounded-4 shadow-2xl text-center text-white mx-auto my-5"
          style={{
            maxWidth: 580,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(0, 230, 118, 0.3)",
          }}
        >
          <div className="fs-1 mb-3">📡</div>
          <h3 className="fw-extrabold text-white mb-2">No active delivery</h3>
          <p className="text-secondary small mb-4">
            {isOnline
              ? gpsError || (gpsCoords
                ? "Your live location is active. Searching for nearby delivery offers."
                : "Starting live location and waiting for nearby delivery offers.")
              : "Go online when you're ready to receive delivery offers."}
          </p>
          {isOnline && gpsCoords && !gpsError && (
            <span className="badge rounded-pill bg-success-subtle text-success">
              Live location connected
            </span>
          )}
        </div>
      ) : null}

      {/* ====================================================================
          DELIVERY HANDOVER VERIFICATION MODAL
          ==================================================================== */}
      {showDeliveryModal && (
        <ModalPortal isOpen={showDeliveryModal}>
          <div
            className="cravepulse-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deliveryComplete)
                closeDeliveryModal();
            }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 480 }}>
              <div
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{
                  background: "#0f172a",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                }}
              >
                {deliveryComplete ? (
                  <div className="text-center py-4">
                    <div className="fs-1 mb-2">🎉</div>
                    <h3 className="fw-extrabold text-success mb-1">
                      Handover Verified!
                    </h3>
                    <p className="text-secondary small mb-3">
                      ₹{Number(activeJob?.totalEarning || 0).toFixed(2)} has
                      been deposited into your CravePulse Captain Wallet.
                    </p>
                    <span className="badge rounded-pill bg-success text-dark px-3 py-1.5 fw-bold">
                      Payout Credited ✓
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-4">📦</span>
                        <h5 className="fw-bold mb-0 text-white">
                          Customer Handover Verification
                        </h5>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Close delivery PIN dialog"
                        onClick={closeDeliveryModal}
                      ></button>
                    </div>

                    <p className="text-secondary small mb-3">
                      Ask customer{" "}
                      <strong className="text-white">
                        {activeJob?.customerName}
                      </strong>{" "}
                      for their 4-digit Delivery PIN to complete run.
                    </p>

                    {/* 4-Digit OTP PIN Input */}
                    <div className="mb-3">
                      <label
                        htmlFor="delivery-pin"
                        className="form-label small fw-bold text-light"
                      >
                        Customer 4-Digit Handover PIN *
                      </label>
                      <input
                        id="delivery-pin"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{4}"
                        maxLength="4"
                        className="form-control text-center fw-extrabold rounded-3 font-monospace shadow-none"
                        style={{
                          fontSize: 32,
                          letterSpacing: 12,
                          background: "#080c14",
                          color: "#00e676",
                          border: "2px solid #00e676",
                          minHeight: 56,
                        }}
                        placeholder="••••"
                        value={deliveryOtp}
                        onChange={(e) => {
                          setDeliveryOtp(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          );
                          setDeliveryError("");
                        }}
                        aria-describedby="delivery-pin-help"
                      />
                      <small
                        id="delivery-pin-help"
                        className="text-secondary d-block mt-1 text-center"
                        style={{ fontSize: 11 }}
                      >
                        Enter the PIN provided by the customer.
                      </small>
                    </div>

                    {deliveryError && (
                      <div className="alert alert-danger" role="alert">
                        {deliveryError}
                      </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4"
                        style={{ minHeight: 46 }}
                        onClick={closeDeliveryModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-success rounded-pill px-4 fw-extrabold text-dark shadow transition hover-lift"
                        style={{
                          minHeight: 46,
                          background: "#00e676",
                          border: "none",
                        }}
                        onClick={handleConfirmFinalDelivery}
                        disabled={deliveryOtp.length !== 4}
                      >
                        Confirm Handover & Payout →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <div
        className="position-fixed bottom-0 end-0 p-4 d-flex align-items-center gap-3"
        style={{ zIndex: 1030 }}
      >
        <div
          className="px-3 py-2 rounded-pill shadow-lg d-none d-sm-flex align-items-center gap-2 fw-extrabold text-white"
          style={{
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(12px)",
            border: isOnline
              ? "1px solid rgba(0, 230, 118, 0.4)"
              : "1px solid rgba(220, 53, 69, 0.4)",
            fontSize: 12,
            letterSpacing: 0.5,
          }}
        >
          <span
            className={`spinner-grow spinner-grow-sm ${isOnline ? "text-success" : "text-danger"}`}
            style={{ width: 8, height: 8 }}
          ></span>
          <span>{isOnline ? "ON DUTY" : "OFF DUTY"}</span>
        </div>

        <button
          onClick={handleToggleOnline}
          className="btn rounded-circle position-relative d-flex align-items-center justify-content-center shadow-2xl transition hover-lift"
          style={{
            width: 64,
            height: 64,
            background: isOnline
              ? "linear-gradient(135deg, #00e676 0%, #00b0ff 100%)"
              : "linear-gradient(135deg, #dc3545 0%, #7f1d1d 100%)",
            boxShadow: isOnline
              ? "0 0 25px rgba(0, 230, 118, 0.5)"
              : "0 0 25px rgba(220, 53, 69, 0.5)",
            border: "3px solid rgba(255, 255, 255, 0.2)",
          }}
          title={isOnline ? "Tap to Go Offline" : "Tap to Go Online"}
        >
          {isOnline && (
            <span
              className="position-absolute rounded-circle animate-ping"
              style={{
                inset: -4,
                border: "2px solid #00e676",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            ></span>
          )}

          <i
            className={`bi ${isOnline ? "bi-broadcast" : "bi-power"} text-dark fs-3 fw-bold`}
          ></i>
        </button>
      </div>
    </div>
  );
};

export default RiderActiveJob;
