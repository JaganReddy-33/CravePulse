import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import realtime from "../services/websocket";
import RiderActiveJob from "../pages/rider/RiderActiveJob";

const { realtimeHandlers } = vi.hoisted(() => ({
  realtimeHandlers: new Map(),
}));
const originalNavigator = navigator;

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../services/websocket", () => ({
  default: {
    on: vi.fn((event, callback) => {
      realtimeHandlers.set(event, callback);
      return () => realtimeHandlers.delete(event);
    }),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));
vi.mock("../components/LiveMap", () => ({
  default: () => <div data-testid="live-map" />,
}));
vi.mock("../components/ModalPortal", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("rider active delivery workflow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === "/rider/profile") {
        return Promise.resolve({
          success: true,
          data: { id: 12, online: true, riderName: "Rider", totalDeliveries: 12 },
        });
      }
      if (url === "/rider/active-job") {
        return Promise.resolve({
          success: true,
          data: {
            id: 8,
            orderId: 71,
            orderNumber: "CP-71",
            dispatchStatus: "ACCEPTED",
            pickedUpAt: "2026-10-31T12:00:00Z",
            restaurantName: "Kitchen",
            restaurantAddress: "1 Kitchen Road",
            restaurantLat: 12.9,
            restaurantLng: 77.6,
            customerName: "Priya",
            customerPhone: "555-0101",
            customerAddress: "2 Customer Lane",
            customerLat: 12.91,
            customerLng: 77.61,
            totalEarning: 85,
            items: [{ id: 3, itemName: "Meal", quantity: 1 }],
          },
        });
      }
      if (url === "/rider/offers") {
        return Promise.resolve({ success: true, data: [] });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    api.post.mockImplementation((url, body) => {
      if (body?.status === "ARRIVED_AT_CUSTOMER") {
        return Promise.resolve({ success: true, data: { status: body.status } });
      }
      if (body?.status === "DELIVERED") {
        return Promise.resolve({
          success: false,
          message: "Invalid 4-digit Delivery PIN.",
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });
  });

  it("hydrates the picked-up step, records customer arrival, and displays PIN errors without photo claims", async () => {
    render(<RiderActiveJob />);

    expect(await screen.findByRole("button", { name: "Mark arrival at customer" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Call Priya" }).getAttribute("href")).toBe(
      "tel:5550101",
    );
    expect(screen.queryByText(/Photo Proof|4829|masked proxy|Tamper-Evident/i)).toBeNull();
    expect(screen.getAllByText("2 Customer Lane").length).toBeGreaterThan(0);
    const itemCheck = screen.getByRole("button", { name: "Check Meal, quantity 1" });
    expect(itemCheck.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(itemCheck);
    expect(itemCheck.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Mark arrival at customer" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/rider/orders/71/status", {
        status: "ARRIVED_AT_CUSTOMER",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Verify customer delivery PIN" }),
    );

    const pinInput = screen.getByLabelText("Customer 4-Digit Handover PIN *");
    fireEvent.change(pinInput, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: /Confirm Handover/ }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Invalid 4-digit Delivery PIN.",
    );
    expect(api.post).toHaveBeenCalledWith("/rider/orders/71/status", {
      status: "DELIVERED",
      deliveryOtp: "1234",
    });
  });

  it("subscribes to the rider channel and displays an incoming offer without the empty state", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/rider/profile") {
        return Promise.resolve({ success: true, data: { id: 12, online: true } });
      }
      if (url === "/rider/active-job") {
        return Promise.resolve({ success: true, data: null });
      }
      if (url === "/rider/offers") {
        return Promise.resolve({ success: true, data: [] });
      }
      return Promise.resolve({ success: true, data: {} });
    });

    render(<RiderActiveJob />);

    await waitFor(() => expect(realtime.subscribe).toHaveBeenCalledWith("rider:12"));
    await waitFor(() => expect(realtimeHandlers.has("rider_job_offer")).toBe(true));
    act(() => {
      realtimeHandlers.get("rider_job_offer")({
        dispatchId: 91,
        orderId: 71,
        orderNumber: "CP-71",
        restaurantName: "Kitchen",
        restaurantLat: 12.9,
        restaurantLng: 77.6,
        customerLat: 12.91,
        customerLng: 77.61,
        totalEarning: 85,
      });
    });

    expect(await screen.findByText(/New delivery offer/)).toBeTruthy();
    expect(screen.getByText(/CP-71/)).toBeTruthy();
    expect(screen.queryByText("No active delivery")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Accept delivery" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/rider/91/accept", {}),
    );
  });

  it("sends live location while online with no active delivery", async () => {
    const geolocation = {
      watchPosition: vi.fn((onSuccess) => {
        onSuccess({
          coords: {
            latitude: 12.9716,
            longitude: 77.5946,
            speed: null,
            heading: null,
          },
        });
        return 7;
      }),
      clearWatch: vi.fn(),
    };
    vi.stubGlobal(
      "navigator",
      Object.assign(Object.create(originalNavigator), { geolocation }),
    );
    api.get.mockImplementation((url) => {
      if (url === "/rider/profile") {
        return Promise.resolve({ success: true, data: { id: 12, online: true } });
      }
      if (url === "/rider/active-job") {
        return Promise.resolve({ success: true, data: null });
      }
      if (url === "/rider/offers") {
        return Promise.resolve({ success: true, data: [] });
      }
      return Promise.resolve({ success: true, data: {} });
    });

    render(<RiderActiveJob />);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/rider/telemetry", {
        orderId: null,
        latitude: 12.9716,
        longitude: 77.5946,
        speed: 0,
        heading: 0,
      }),
    );
    expect(geolocation.watchPosition).toHaveBeenCalled();
  });
});
