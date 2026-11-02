import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import api from "../services/api";
import FoodAnalyticsDashboard from "../pages/partner/FoodAnalyticsDashboard";

vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));

const restaurant = { id: 42, name: "Test Kitchen" };

const analyticsData = {
  totalOrders: 2,
  totalRevenue: 1250,
  averageOrderValue: 625,
  isEmpty: false,
  todaysOrders: 1,
  todaysRevenue: 500,
  sevenDayOrders: 2,
  sevenDayRevenue: 1250,
  thirtyDayOrders: 2,
  thirtyDayRevenue: 1250,
  cancelledOrders: 1,
  cancellationRate: 33.3,
  trend: [
    { time: "02 Nov", orders: 1, revenue: 625 },
    { time: "03 Nov", orders: 2, revenue: 1250 },
  ],
  topDishes: [{ name: "Masala Dosa", orders: 3, revenue: 750, image: "dish.jpg" }],
  peakOrders: "2 | 12 PM",
  peakRevenue: "₹1250 | 12 PM",
  statusGauge: {
    completedPct: 50,
    completedCount: 2,
    preparingPct: 25,
    preparingCount: 1,
    pendingPct: 0,
    pendingCount: 0,
    cancelledPct: 25,
    cancelledCount: 1,
  },
  reviewCount: 2,
  avgFoodRating: 4.5,
  avgPackagingRating: 4,
  avgDeliveryRating: 4.5,
};

const ordersData = [
  {
    id: 11,
    orderNumber: "CP-11",
    customerName: "Asha",
    items: [{ itemName: "Masala Dosa", quantity: 2 }],
    totalAmount: 500,
    platformFee: 5,
    status: "DELIVERED",
    createdAt: "2020-01-03T08:30:00Z",
  },
];

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Outlet context={{ restaurant }} />}>
          <Route index element={<FoodAnalyticsDashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("Food analytics dashboard API data", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) =>
      Promise.resolve(
        path.endsWith("/analytics")
          ? { success: true, data: analyticsData }
          : { success: true, data: ordersData },
      ),
    );
  });

  it("renders the backend analytics and order response fields", async () => {
    renderDashboard();

    await screen.findByText("Masala Dosa");
    expect(api.get).toHaveBeenCalledWith("/restaurants/42/analytics");
    expect(api.get).toHaveBeenCalledWith("/orders/restaurant/42");
    expect(screen.getAllByText("₹1,250").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹625").length).toBeGreaterThan(0);
    expect(screen.getByText("33.3%")).toBeTruthy();
    expect(screen.getByText("12 PM")).toBeTruthy();
    expect(
      screen.getByText(
        /Period applies to revenue, non-cancelled orders, and average order value only/i,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/all-time: 3 tickets submitted/i)).toBeTruthy();
    expect(screen.getByText("Revenue by Day — Last 7 Days")).toBeTruthy();
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.queryByText("Orders", { selector: "span" })).toBeNull();
    expect(screen.getAllByTestId("revenue-bar").map((bar) => bar.style.height)).toEqual([
      "65px",
      "130px",
    ]);
    const periodScrollport = screen.getByTestId("period-scrollport");
    const periodGroup = within(periodScrollport).getByRole("group");
    expect(periodScrollport.style.width).toBe("100%");
    expect(periodScrollport.style.minWidth).toBe("0px");
    expect(periodScrollport.style.overflowX).toBe("auto");
    expect(periodGroup.style.width).toBe("max-content");
    expect(periodGroup.classList.contains("flex-nowrap")).toBe(true);
    expect(within(periodGroup).getByRole("button", { name: "All Time" })).toBeTruthy();
    expect(
      screen
        .getByText(/Period applies to revenue, non-cancelled orders, and average order value only/i)
        .closest("[role='note']").parentElement,
    ).not.toBe(periodScrollport);
    expect(
      within(periodGroup)
        .getAllByRole("button")
        .every(
          (button) => button.style.whiteSpace === "nowrap" && button.style.minHeight === "38px",
        ),
    ).toBe(true);
    expect(screen.getByText(/Bars compare relative revenue/i)).toBeTruthy();
    expect(screen.getAllByTestId("revenue-bar")[0].parentElement.style.borderBottom).toContain(
      "solid",
    );
    expect(screen.getByText(/Peak hour and review metrics are all-time/i)).toBeTruthy();
    expect(screen.getByText(/All-time ranking by units sold/i)).toBeTruthy();
    expect(screen.getByText(/not filtered by the selected summary period/i)).toBeTruthy();

    const dishRow = screen.getByText("Masala Dosa").closest("tr");
    expect(within(dishRow).getByText("3")).toBeTruthy();
    expect(within(dishRow).getByText("₹750")).toBeTruthy();

    const orderRow = screen.getByText("CP-11").closest("tr");
    expect(within(orderRow).getByText("₹500.00")).toBeTruthy();
    expect(within(orderRow).getByText("₹5.00")).toBeTruthy();
    expect(orderRow.querySelector("td:last-child").textContent).toBe("—");
    const ledgerTable = orderRow.closest("table");
    expect(ledgerTable.style.minWidth).toBe("940px");
    expect(
      within(ledgerTable)
        .getAllByRole("columnheader")
        .every((heading) => heading.style.whiteSpace === "nowrap"),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    await waitFor(() => {
      expect(screen.getAllByText("₹500").length).toBeGreaterThan(0);
    });

    vi.spyOn(globalThis, "Blob");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:analytics-test"),
    });
    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));
    await screen.findByText(/Analytics report \(Today\) downloaded/);
    const csv = globalThis.Blob.mock.calls[0][0][0];
    expect(csv).toContain('"Selected Summary Period:","Today"');
    expect(csv).toContain(
      '"LEDGER ROW SCOPE:","Orders API default returns up to 50 orders; not filtered by the selected summary period. CSV includes fetched rows only."',
    );
    expect(csv).toContain('"LEDGER ROWS"');
    expect(csv).toContain('"CP-11"');
    expect(csv).toContain('"SELECTED-PERIOD SUMMARY — TODAY"');
    expect(csv).toContain('"ALL-TIME CANCELLATION METRICS"');
  });

  it("shows a real zero-order empty state without fabricated metrics", async () => {
    api.get.mockImplementation((path) =>
      Promise.resolve({
        success: true,
        data: path.endsWith("/analytics")
          ? {
              totalOrders: 0,
              totalRevenue: 0,
              averageOrderValue: 0,
              isEmpty: true,
              todaysOrders: 0,
              todaysRevenue: 0,
              sevenDayOrders: 0,
              sevenDayRevenue: 0,
              thirtyDayOrders: 0,
              thirtyDayRevenue: 0,
              cancelledOrders: 0,
              cancellationRate: 0,
              trend: [],
              topDishes: [],
              peakOrders: "0 | --",
              statusGauge: {
                completedPct: 0,
                completedCount: 0,
                preparingPct: 0,
                preparingCount: 0,
                pendingPct: 0,
                pendingCount: 0,
                cancelledPct: 0,
                cancelledCount: 0,
              },
              reviewCount: 0,
              avgFoodRating: 0,
              avgPackagingRating: 0,
              avgDeliveryRating: 0,
            }
          : [],
      }),
    );

    renderDashboard();

    expect(
      await screen.findByRole("heading", {
        name: "No Order Transactions Recorded Yet",
      }),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain("₹NaN");
    expect(document.body.textContent).not.toContain("12:00 PM - 2:00 PM");
  });

  it("retries analytics after a load error without showing stale summaries", async () => {
    let resolveRetry;
    let analyticsCalls = 0;
    api.get.mockImplementation((path) => {
      if (!path.endsWith("/analytics")) {
        return Promise.resolve({ success: true, data: ordersData });
      }

      analyticsCalls += 1;
      if (analyticsCalls === 1) {
        return Promise.reject(new Error("Service unavailable"));
      }
      return new Promise((resolve) => {
        resolveRetry = resolve;
      });
    });

    renderDashboard();

    await screen.findByText("Analytics data could not be loaded. Please try again.");
    expect(
      screen.queryByRole("heading", {
        name: "No Order Transactions Recorded Yet",
      }),
    ).toBeNull();
    expect(screen.queryByText("₹1,250")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Retry analytics" }));
    expect(await screen.findByText("Computing live SQL analytics metrics...")).toBeTruthy();
    expect(screen.queryByText("₹1,250")).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(3);

    resolveRetry({ success: true, data: analyticsData });
    expect(await screen.findByText("Masala Dosa")).toBeTruthy();
    expect(screen.getAllByText("₹1,250").length).toBeGreaterThan(0);
  });

  it("shows a ledger loading state and retries a failed ledger request", async () => {
    let resolveOrders;
    api.get.mockImplementation((path) =>
      path.endsWith("/analytics")
        ? Promise.resolve({ success: true, data: analyticsData })
        : new Promise((resolve) => {
            resolveOrders = resolve;
          }),
    );

    renderDashboard();

    expect(await screen.findByText("Loading order ledger…")).toBeTruthy();
    expect(screen.queryByText("No order ledger entries recorded yet")).toBeNull();
    resolveOrders({ success: false, data: null });
    await screen.findByText("Order ledger data could not be loaded.");
    expect(screen.getByRole("button", { name: "Retry ledger" })).toBeTruthy();

    api.get.mockImplementation((path) =>
      path.endsWith("/analytics")
        ? Promise.resolve({ success: true, data: analyticsData })
        : Promise.resolve({ success: true, data: ordersData }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry ledger" }));
    await screen.findByText("CP-11");
    expect(screen.queryByText("Order ledger data could not be loaded.")).toBeNull();
  });
});
