import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import useOrderTracking from "../hooks/useOrderTracking";
import OrderTracking from "../pages/customer/OrderTracking";

vi.mock("../hooks/useOrderTracking", () => ({
  default: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useParams: () => ({ orderNumber: "CP-71" }),
}));

vi.mock("../components/LiveMap", () => ({ default: () => null }));
vi.mock("../components/tracking/TrackingTimeline", () => ({ default: () => null }));
vi.mock("../components/tracking/TrackingRiderCard", () => ({ default: () => null }));
vi.mock("../components/tracking/TrackingCancelModal", () => ({ default: () => null }));
vi.mock("../components/tracking/TrackingChatModal", () => ({ default: () => null }));
vi.mock("../components/tracking/TrackingReviewModal", () => ({ default: () => null }));
vi.mock("../components/ModalPortal", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("order tracking dispute action", () => {
  beforeEach(() => {
    useOrderTracking.mockReturnValue({
      order: {
        id: 71,
        orderNumber: "CP-71",
        totalAmount: 75,
        status: "DELIVERED",
        restaurantName: "Kitchen",
        deliveryAddress: "1 Customer Road",
      },
      loading: false,
      error: null,
      riderCoords: null,
      chatMessages: [],
      cancelOrder: vi.fn(),
      sendChatMessage: vi.fn(),
      submitReview: vi.fn(),
    });
  });

  it("opens the dispute form with the tracked order details", () => {
    render(<OrderTracking />);

    fireEvent.click(screen.getByRole("button", { name: "Raise Issue / Claim Refund" }));

    expect(screen.getByText("Instant Dispute Resolution")).toBeTruthy();
    expect(screen.getByText("CP-71")).toBeTruthy();
    expect(screen.getByPlaceholderText(/Garlic Naan was missing/)).toBeTruthy();
  });
});
