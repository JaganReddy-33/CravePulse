import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../services/api";
import InvoicePage from "../pages/customer/InvoicePage";

vi.mock("../services/api", () => ({
  default: { get: vi.fn() },
}));

describe("invoice order lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      success: true,
      data: {
        orderNumber: "CP-BLR-2026-005",
        items: [],
        totalAmount: 125,
      },
    });
  });

  const renderInvoice = (path) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/orders/:id/invoice" element={<InvoicePage />} />
        </Routes>
      </MemoryRouter>,
    );

  it("looks up an invoice using an order number when the route contains one", async () => {
    renderInvoice("/orders/CP-BLR-2026-005/invoice");

    expect(await screen.findByRole("heading", { name: "Order receipt" })).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith(
      "/orders/number/CP-BLR-2026-005",
    );
  });

  it("keeps numeric order ID lookup compatible", async () => {
    renderInvoice("/orders/2005/invoice");

    expect(await screen.findByRole("heading", { name: "Order receipt" })).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/orders/2005");
  });
});
