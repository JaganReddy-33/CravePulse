import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import RiderActiveJob from "../pages/rider/RiderActiveJob";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../services/websocket", () => ({
  default: { on: () => () => {} },
}));
vi.mock("../components/LiveMap", () => ({
  default: () => <div data-testid="live-map" />,
}));
vi.mock("../components/ModalPortal", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("rider active delivery workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === "/rider/profile") {
        return Promise.resolve({
          success: true,
          data: { online: true, riderName: "Rider", totalDeliveries: 12 },
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
});
