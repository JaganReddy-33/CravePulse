import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import DisputeModal from "../pages/customer/DisputeModal";

vi.mock("../services/api", () => ({
  default: { post: vi.fn() },
}));

vi.mock("../components/ModalPortal", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("customer dispute modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the claim form and submits it for the supplied order", async () => {
    api.post.mockResolvedValue({
      success: true,
      data: {
        id: 8,
        requestedRefundAmount: 50,
        autoRefundApproved: false,
      },
    });

    render(
      <DisputeModal
        show
        onClose={vi.fn()}
        order={{ id: 71, orderNumber: "CP-71", totalAmount: 75 }}
      />,
    );

    expect(screen.getByText("Instant Dispute Resolution")).toBeTruthy();
    fireEvent.change(
      screen.getByPlaceholderText(/Garlic Naan was missing/),
      { target: { value: "One item was missing from my order." } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Submit Dispute Claim/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/disputes", {
        orderId: 71,
        issueType: "MISSING_ITEM",
        description: "One item was missing from my order.",
        photoEvidenceUrl: "",
        requestedRefundAmount: 50,
      }),
    );
    expect(await screen.findByText("Claim Escrowed for Express Ops Review")).toBeTruthy();
  });
});
