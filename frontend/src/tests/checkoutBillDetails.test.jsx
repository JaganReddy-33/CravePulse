import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CheckoutBillDetails from "../components/checkout/CheckoutBillDetails";

const bill = {
  subtotal: 100,
  couponDiscount: 0,
  packagingFee: 15,
  deliveryFee: 35,
  platformFee: 5,
  gstTax: 5.75,
  tipAmount: 0,
  totalAmount: 160.75,
};

describe("checkout quote details", () => {
  it("shows server quote distance and authoritative delivery fee", () => {
    render(
      <CheckoutBillDetails
        billDetails={{ ...bill, distanceKm: 2.4 }}
        riderTip={0}
      />,
    );

    expect(screen.getByText("2.4 km")).toBeTruthy();
    expect(screen.getByText("Items subtotal")).toBeTruthy();
    expect(screen.getByText("Delivery fee")).toBeTruthy();
    expect(screen.getByText("Packaging")).toBeTruthy();
    expect(screen.getByText("Platform fee")).toBeTruthy();
    expect(screen.getByText("GST")).toBeTruthy();
    expect(screen.queryByText(/dine-in menu parity|government tax|delivery partner fee/i)).toBeNull();
    expect(screen.getByText("₹35")).toBeTruthy();
    expect(screen.getByText("₹160.75")).toBeTruthy();
  });

  it("hides distance when the server omits it rather than rendering zero", () => {
    render(
      <CheckoutBillDetails
        billDetails={{ ...bill, distanceKm: null }}
        riderTip={0}
      />,
    );

    expect(screen.queryByText(/delivery distance/i)).toBeNull();
  });
});
