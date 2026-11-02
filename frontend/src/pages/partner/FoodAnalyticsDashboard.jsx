import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../../services/api";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7days", label: "Last 7 Days" },
  { key: "30days", label: "Last 30 Days" },
  { key: "allTime", label: "All Time" },
];

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatCurrency = (value, maximumFractionDigits = 0, minimumFractionDigits = 0) => {
  const number = toFiniteNumber(value);
  return number === null
    ? "—"
    : `₹${number.toLocaleString("en-IN", {
        maximumFractionDigits,
        minimumFractionDigits,
      })}`;
};

const formatCount = (value) => {
  const number = toFiniteNumber(value);
  return number === null ? "—" : number.toLocaleString("en-IN");
};

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const FoodAnalyticsDashboard = () => {
  const { restaurant } = useOutletContext();
  const restId = restaurant?.id;

  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [ledgerOrders, setLedgerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [ledgerError, setLedgerError] = useState("");
  const [downloadToast, setDownloadToast] = useState("");

  const fetchLedgerOrders = async () => {
    if (!restId) {
      setLedgerLoading(false);
      setLedgerError("Restaurant details are unavailable.");
      return;
    }

    setLedgerLoading(true);
    setLedgerError("");
    try {
      const response = await api.get(`/orders/restaurant/${restId}`);
      if (!response?.success || !Array.isArray(response.data)) {
        setLedgerOrders([]);
        setLedgerError("Order ledger data could not be loaded.");
        return;
      }

      const mapped = response.data.map((order) => {
        const createdAt = order.createdAt ? new Date(order.createdAt) : null;
        const items = Array.isArray(order.items)
          ? order.items
              .map((item) => (item.itemName ? `${item.itemName} x${item.quantity}` : null))
              .filter(Boolean)
              .join(", ")
          : "";

        return {
          id: order.orderNumber || (order.id != null ? String(order.id) : "—"),
          customer: order.customerName || "—",
          items: items || "—",
          amount: toFiniteNumber(order.totalAmount),
          platformFee: toFiniteNumber(order.platformFee),
          status: order.status || "—",
          time:
            createdAt && !Number.isNaN(createdAt.getTime())
              ? createdAt.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
        };
      });
      setLedgerOrders(mapped);
    } catch (error) {
      console.warn("Order ledger query error", error);
      setLedgerOrders([]);
      setLedgerError("Order ledger data could not be loaded.");
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchAnalytics = async (includeLedger = false) => {
    if (!restId) {
      setLoading(false);
      setLedgerLoading(false);
      setAnalyticsError("Restaurant details are unavailable.");
      setLedgerError("Restaurant details are unavailable.");
      return;
    }

    try {
      setLoading(true);
      setAnalytics(null);
      setAnalyticsError("");
      const results = await Promise.allSettled([
        api.get(`/restaurants/${restId}/analytics`),
        ...(includeLedger ? [fetchLedgerOrders()] : []),
      ]);
      const analyticsResult = results[0];

      if (
        analyticsResult.status === "fulfilled" &&
        analyticsResult.value?.success &&
        analyticsResult.value.data
      ) {
        setAnalytics(analyticsResult.value.data);
      } else {
        setAnalytics(null);
        setAnalyticsError("Analytics data could not be loaded. Please try again.");
      }
    } catch (e) {
      console.warn("Analytics query error", e);
      setAnalyticsError("Analytics data could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
  }, [restId]);

  const getActiveSummary = () => {
    const makeSummary = (revenue, orders, averageOrderValue) => {
      const totalRevenue = toFiniteNumber(revenue);
      const totalOrders = toFiniteNumber(orders);
      const reportedAverage = toFiniteNumber(averageOrderValue);

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue:
          reportedAverage ??
          (totalRevenue !== null && totalOrders !== null && totalOrders > 0
            ? totalRevenue / totalOrders
            : totalRevenue !== null && totalOrders === 0
              ? 0
              : null),
      };
    };

    switch (selectedPeriod) {
      case "today":
        return makeSummary(analytics?.todaysRevenue, analytics?.todaysOrders);
      case "7days":
        return makeSummary(analytics?.sevenDayRevenue, analytics?.sevenDayOrders);
      case "30days":
        return makeSummary(analytics?.thirtyDayRevenue, analytics?.thirtyDayOrders);
      case "allTime":
      default:
        return makeSummary(
          analytics?.totalRevenue,
          analytics?.totalOrders,
          analytics?.averageOrderValue,
        );
    }
  };

  const activeSummary = getActiveSummary();
  const cancelledOrders = toFiniteNumber(analytics?.cancelledOrders);
  const nonCancelledOrders = toFiniteNumber(analytics?.totalOrders);
  const totalSubmittedOrders =
    cancelledOrders !== null && nonCancelledOrders !== null
      ? cancelledOrders + nonCancelledOrders
      : null;
  const cancellationRate = toFiniteNumber(analytics?.cancellationRate);
  const peakOrderParts = String(analytics?.peakOrders || "")
    .split("|")
    .map((part) => part.trim());
  const peakOrderCount = peakOrderParts[0] || null;
  const peakHourLabel = peakOrderParts[1] || null;
  const reviewCount = toFiniteNumber(analytics?.reviewCount);
  const ratings = [
    { label: "Food", value: analytics?.avgFoodRating },
    { label: "Packaging", value: analytics?.avgPackagingRating },
    { label: "Delivery", value: analytics?.avgDeliveryRating },
  ];
  const topDishes = Array.isArray(analytics?.topDishes) ? analytics.topDishes : [];
  const dailyTrend = Array.isArray(analytics?.trend) ? analytics.trend : [];
  const statusGauge = analytics?.statusGauge || {};
  const statusEntries = [
    ["Completed", statusGauge.completedCount],
    ["Preparing", statusGauge.preparingCount],
    ["Pending", statusGauge.pendingCount],
    ["Cancelled", statusGauge.cancelledCount],
  ].filter(([, count]) => toFiniteNumber(count) !== null);
  const isEmptyState =
    analytics && (analytics.isEmpty === true || toFiniteNumber(analytics.totalOrders) === 0);

  const handleDownloadReport = () => {
    const periodLabel = PERIODS.find((p) => p.key === selectedPeriod)?.label || selectedPeriod;
    const rows = [
      ["CRAVEPULSE RESTAURANT PARTNER FINANCIAL REPORT"],
      ["Restaurant Name:", restaurant?.name || "Not provided"],
      ["FSSAI License:", restaurant?.fssaiLicense || "Not provided"],
      ["GSTIN:", restaurant?.gstNumber || "Not provided"],
      ["Selected Summary Period:", periodLabel],
      ["Generated At:", new Date().toLocaleString()],
      [],
      [
        "LEDGER ROW SCOPE:",
        "Orders API default returns up to 50 orders; not filtered by the selected summary period. CSV includes fetched rows only.",
      ],
      ["LEDGER ROWS"],
      [
        "Order ID",
        "Timestamp",
        "Customer Name",
        "Items Ordered",
        "Order Status",
        "Order Total (INR)",
        "Platform Fee (INR)",
        "Net Kitchen Payout (INR) — not provided by the orders API",
      ],
    ];

    ledgerOrders.forEach((item) => {
      rows.push([
        item.id,
        item.time,
        item.customer,
        item.items,
        item.status,
        item.amount === null ? "" : item.amount.toFixed(2),
        item.platformFee === null ? "" : item.platformFee.toFixed(2),
        "",
      ]);
    });

    rows.push([]);
    rows.push([`SELECTED-PERIOD SUMMARY — ${periodLabel.toUpperCase()}`]);
    rows.push(["Non-cancelled Order Revenue (INR):", activeSummary.totalRevenue ?? ""]);
    rows.push(["Non-cancelled Orders:", activeSummary.totalOrders ?? ""]);
    rows.push(["Average Order Value:", activeSummary.averageOrderValue ?? ""]);
    rows.push([]);
    rows.push(["ALL-TIME CANCELLATION METRICS"]);
    rows.push(["Cancellation Rate:", cancellationRate === null ? "" : `${cancellationRate}%`]);
    rows.push(["Cancelled Orders:", cancelledOrders ?? ""]);
    rows.push(["All Submitted Orders:", totalSubmittedOrders ?? ""]);

    const csvContent = rows.map((row) => row.map(csvValue).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cravepulse_analytics_${restaurant?.slug || "partner"}_${selectedPeriod}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`✓ Analytics report (${periodLabel}) downloaded successfully!`);
    setTimeout(() => setDownloadToast(""), 4500);
  };

  return (
    <div>
      {downloadToast && (
        <div className="alert alert-success rounded-4 shadow-sm border-0 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <span className="fw-bold">{downloadToast}</span>
        </div>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 bg-white p-3 rounded-4 shadow-sm border">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-extrabold mb-0 text-dark">Live Kitchen Analytics & Insights</h4>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              SQL Telemetry
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Real performance calculated directly from MySQL transactions for{" "}
            <strong className="text-dark">{restaurant?.name}</strong>.
          </p>
        </div>

        <div
          className="d-flex flex-wrap align-items-center gap-2"
          style={{ alignSelf: "stretch", flex: "1 1 0%", minWidth: 0 }}
        >
          <div className="d-flex flex-column gap-2 flex-grow-1" style={{ minWidth: 0 }}>
            <div
              data-testid="period-scrollport"
              style={{ width: "100%", minWidth: 0, overflowX: "auto" }}
            >
              <div
                className="btn-group bg-light p-1 rounded-pill border flex-nowrap"
                role="group"
                style={{ width: "max-content" }}
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${selectedPeriod === p.key ? "btn-danger text-white" : "btn-light text-secondary"}`}
                    style={{
                      ...(selectedPeriod === p.key ? { background: "#ff5c35" } : {}),
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minHeight: 38,
                    }}
                    onClick={() => setSelectedPeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-muted small w-100" role="note">
              Period applies to revenue, non-cancelled orders, and average order value only.
            </span>
          </div>
          <button
            className="btn btn-outline-secondary rounded-pill btn-sm px-3 fw-bold"
            onClick={handleDownloadReport}
            disabled={ledgerOrders.length === 0}
            title="Export CSV Statement"
          >
            <i className="bi bi-download me-1"></i> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-muted small mt-2">Computing live SQL analytics metrics...</p>
        </div>
      ) : analyticsError ? (
        <div
          className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2"
          role="alert"
        >
          <span>{analyticsError}</span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => fetchAnalytics()}
            disabled={loading}
          >
            Retry analytics
          </button>
        </div>
      ) : isEmptyState ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-white mb-4">
          <div className="fs-1 mb-2">📊</div>
          <h5 className="fw-bold text-dark">No Order Transactions Recorded Yet</h5>
          <p className="text-muted small mb-3" style={{ maxWidth: 500, margin: "0 auto" }}>
            Live SQL analytics, daily revenue trends, peak ordering hours, and dish popularity
            rankings will populate automatically once customer orders are placed and processed by
            the kitchen.
          </p>
          <div>
            <Link
              to="/partner/menu"
              className="btn btn-danger btn-sm rounded-pill px-4"
              style={{ background: "#ff5c35" }}
            >
              Check Menu & Availability
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-danger-subtle text-danger p-1 rounded-2 me-1">₹</span>{" "}
                    Gross Revenue
                  </span>
                  <span className="badge bg-light text-muted border small">SQL</span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">
                  {formatCurrency(activeSummary.totalRevenue)}
                </h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Revenue recorded on non-cancelled orders
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-primary-subtle text-primary p-1 rounded-2 me-1">
                      📦
                    </span>{" "}
                    Non-cancelled Orders
                  </span>
                  <span className="badge bg-success-subtle text-success small">Active</span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">
                  {formatCount(activeSummary.totalOrders)}
                </h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Orders excluding cancellations
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-warning-subtle text-warning p-1 rounded-2 me-1">
                      💳
                    </span>{" "}
                    Avg Order Value
                  </span>
                  <span className="badge bg-light text-muted border small">AOV</span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">
                  {formatCurrency(activeSummary.averageOrderValue)}
                </h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Average order value for this period
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-muted small fw-semibold">
                    <span className="badge bg-danger-subtle text-danger p-1 rounded-2 me-1">✕</span>{" "}
                    All-Time Cancellation Rate
                  </span>
                  <span
                    className={`badge ${cancellationRate === null ? "bg-light text-secondary" : cancellationRate > 5 ? "bg-danger text-white" : "bg-success-subtle text-success"} small`}
                  >
                    {cancellationRate === null ? "—" : `${cancellationRate}%`}
                  </span>
                </div>
                <h3 className="fw-extrabold mb-1 text-dark">
                  {formatCount(cancelledOrders)}{" "}
                  <small className="fs-6 text-muted font-monospace">cancelled</small>
                </h3>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  All-time: {formatCount(totalSubmittedOrders)} tickets submitted
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Revenue by Day — Last 7 Days</h6>
                    <small className="text-muted">
                      Revenue bars; daily order counts appear below each bar.
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3 small">
                    <span className="d-flex align-items-center gap-1 text-danger small">
                      <span className="badge bg-danger p-1 rounded-circle"></span> Revenue
                    </span>
                  </div>
                </div>
                <small className="text-muted d-block mb-1">
                  Bars compare relative revenue; the tallest day sets the scale.
                </small>

                {dailyTrend.length === 0 ? (
                  <div className="text-center py-5 text-muted small">
                    No 7-day trend data available yet
                  </div>
                ) : (
                  <div
                    className="d-flex justify-content-between align-items-end pt-4"
                    style={{ height: 220 }}
                  >
                    {dailyTrend.map((day, idx) => {
                      const revenue = toFiniteNumber(day.revenue);
                      const maxRev = Math.max(
                        ...dailyTrend.map((trendDay) => toFiniteNumber(trendDay.revenue) ?? 0),
                        0,
                      );
                      const barHeight =
                        revenue !== null && revenue > 0 && maxRev > 0
                          ? Math.max(4, (revenue / maxRev) * 130)
                          : 0;
                      const dayLabel = day.time || day.date || "—";
                      return (
                        <div
                          key={`${dayLabel}-${idx}`}
                          className="d-flex flex-column align-items-center justify-content-end flex-grow-1 h-100"
                        >
                          <small className="fw-bold text-dark mb-1" style={{ fontSize: 10 }}>
                            {formatCurrency(revenue)}
                          </small>
                          <div
                            className="w-50 d-flex align-items-end"
                            style={{
                              height: 130,
                              borderBottom: "1px solid #adb5bd",
                            }}
                          >
                            <div
                              data-testid="revenue-bar"
                              className="w-100 rounded-top"
                              style={{
                                height: `${barHeight}px`,
                                background: "linear-gradient(180deg, #ff5c35 0%, #ff8364 100%)",
                              }}
                              title={`${dayLabel}: ${formatCurrency(revenue)} (${formatCount(day.orders)} orders)`}
                            />
                          </div>
                          <span
                            className="badge bg-light text-muted border mt-2"
                            style={{ fontSize: 9 }}
                          >
                            {formatCount(day.orders)} ord
                          </span>
                          <small className="text-muted mt-1" style={{ fontSize: 10 }}>
                            {dayLabel}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-warning text-dark p-2 rounded-2">💡</span>
                  <h6 className="fw-bold mb-0 text-dark">Operational Insights</h6>
                </div>
                <small className="text-muted d-block mb-2">
                  Peak hour and review metrics are all-time.
                </small>

                <div className="list-group list-group-flush small">
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Peak Ordering Window:</span>
                    <strong className="text-danger">{peakHourLabel || "—"}</strong>
                  </div>
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Peak Volume:</span>
                    <strong className="text-dark">
                      {peakOrderCount ? `${peakOrderCount} orders` : "—"}
                    </strong>
                  </div>
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Food Rating:</span>
                    <strong className="text-success">
                      {reviewCount > 0 && toFiniteNumber(ratings[0].value) !== null
                        ? `⭐ ${toFiniteNumber(ratings[0].value).toFixed(1)} / 5.0`
                        : "—"}
                    </strong>
                  </div>
                  <div className="py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">Total Customer Reviews:</span>
                    <strong className="text-dark">{formatCount(reviewCount)}</strong>
                  </div>
                </div>

                {/* Rating Dimensions Breakdown if available */}
                {reviewCount > 0 &&
                  ratings.some((rating) => toFiniteNumber(rating.value) !== null) && (
                    <div className="mt-3 p-3 bg-light rounded-3 border">
                      <div className="fw-bold small text-dark mb-2">Customer Ratings</div>
                      {ratings
                        .filter((rating) => toFiniteNumber(rating.value) !== null)
                        .map((rating) => (
                          <div
                            key={rating.label}
                            className="d-flex justify-content-between small text-muted mb-1"
                          >
                            <span>{rating.label}:</span>
                            <strong>⭐ {toFiniteNumber(rating.value).toFixed(1)}</strong>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Top 5 Popular Dishes</h6>
                    <small className="text-muted">All-time ranking by units sold</small>
                  </div>
                  <span className="badge bg-light text-muted border small">Ranked by Volume</span>
                </div>

                {topDishes.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No dish sales recorded yet
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>#</th>
                          <th>Dish Name</th>
                          <th className="text-end">Units Sold</th>
                          <th className="text-end">Total Gross Sales</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {topDishes.map((dish, i) => (
                          <tr key={i}>
                            <td className="fw-bold text-muted">{i + 1}</td>
                            <td className="fw-semibold text-dark">{dish.name || "—"}</td>
                            <td className="text-end font-monospace">{formatCount(dish.orders)}</td>
                            <td className="text-end fw-bold text-dark">
                              {formatCurrency(dish.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <h6 className="fw-bold mb-1 text-dark">Order Status Distribution</h6>
                <small className="text-muted mb-3 d-block">All-time order stage lifecycle</small>

                <div className="d-flex flex-column gap-2">
                  {statusEntries.length === 0 ? (
                    <div className="text-center py-3 text-muted small">
                      No order status breakdown available
                    </div>
                  ) : (
                    statusEntries.map(([status, count]) => (
                      <div
                        key={status}
                        className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light border"
                      >
                        <span className="small fw-semibold text-secondary">{status}</span>
                        <span className="badge bg-white text-dark border font-monospace">
                          {formatCount(count)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
        <div className="d-flex flex-column align-items-start gap-2 mb-3">
          <span className="badge bg-light text-muted border small">
            {ledgerLoading ? "Loading…" : `${ledgerOrders.length} Fetched orders`}
          </span>
          <div className="w-100">
            <h6 className="fw-bold mb-0 text-dark">Order Ledger</h6>
            <small className="text-muted">
              Orders API default returns up to 50 orders; not filtered by the selected summary
              period. Table shows the first 15 and CSV exports fetched rows only. Net payout is not
              included in that response.
            </small>
          </div>
        </div>

        {ledgerLoading ? (
          <div className="text-center py-4 text-muted small" role="status" aria-live="polite">
            <span className="spinner-border spinner-border-sm text-danger me-2" />
            Loading order ledger…
          </div>
        ) : ledgerError ? (
          <div className="alert alert-warning mb-0" role="alert">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>{ledgerError}</span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={fetchLedgerOrders}
                disabled={ledgerLoading}
              >
                Retry ledger
              </button>
            </div>
          </div>
        ) : ledgerOrders.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No order ledger entries recorded yet
          </div>
        ) : (
          <div className="table-responsive" style={{ minWidth: 0 }}>
            <table className="table table-hover align-middle mb-0" style={{ minWidth: 940 }}>
              <thead className="table-light small">
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Order #</th>
                  <th style={{ whiteSpace: "nowrap" }}>Date & Time</th>
                  <th style={{ whiteSpace: "nowrap" }}>Customer</th>
                  <th style={{ whiteSpace: "nowrap" }}>Items</th>
                  <th style={{ whiteSpace: "nowrap" }}>Status</th>
                  <th className="text-end" style={{ whiteSpace: "nowrap" }}>
                    Order Total (₹)
                  </th>
                  <th className="text-end" style={{ whiteSpace: "nowrap" }}>
                    Platform Fee (₹)
                  </th>
                  <th className="text-end" style={{ whiteSpace: "nowrap" }}>
                    Net Payout
                  </th>
                </tr>
              </thead>
              <tbody className="small">
                {ledgerOrders.slice(0, 15).map((ord, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-dark">{ord.id}</td>
                    <td className="text-muted">{ord.time}</td>
                    <td>{ord.customer}</td>
                    <td className="text-truncate" style={{ maxWidth: 220 }}>
                      {ord.items}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill small ${ord.status === "DELIVERED" ? "bg-success" : ord.status === "CANCELLED" ? "bg-danger" : "bg-warning text-dark"}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="text-end fw-semibold">{formatCurrency(ord.amount, 2, 2)}</td>
                    <td className="text-end text-muted">{formatCurrency(ord.platformFee, 2, 2)}</td>
                    <td className="text-end fw-bold text-success">
                      <span title="Not provided by the orders API">—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodAnalyticsDashboard;
