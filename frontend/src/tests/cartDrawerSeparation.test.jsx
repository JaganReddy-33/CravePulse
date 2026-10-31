import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CustomerLayout from "../pages/customer/CustomerLayout";

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    cart: {
      restaurantName: "Juniper Kitchen",
      items: [
        {
          cartKey: "dish-1",
          name: "Lemon rice",
          platformPrice: 120,
          quantity: 1,
          veg: true,
        },
      ],
    },
    removeItem: vi.fn(),
    addItem: vi.fn(),
    clearCart: vi.fn(),
    totalItemCount: 1,
    couponCode: "SAVE10",
    setCouponCode: vi.fn(),
    couponError: "",
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, Outlet: () => null };
});
vi.mock("../components/Navbar", () => ({
  default: ({ onOpenCart }) => (
    <button type="button" onClick={onOpenCart}>
      Open cart
    </button>
  ),
}));
vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../components/ParticleBackground", () => ({ default: () => null }));
vi.mock("../components/MobileBottomNav", () => ({ default: () => null }));
vi.mock("../components/ModalPortal", () => ({
  default: ({ children }) => children,
}));

describe("cart drawer checkout separation", () => {
  it("keeps coupon and quantity controls but omits quote totals and delivery pricing", () => {
    render(
      <MemoryRouter>
        <CustomerLayout />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }));

    expect(screen.getByText("Lemon rice")).toBeTruthy();
    expect(screen.getByText("SAVE10")).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: /proceed to checkout/i }),
    ).toHaveLength(1);
    expect(screen.queryByText(/item subtotal|coupon discount|to pay/i)).toBeNull();
    expect(
      screen.queryByText(/delivery fee|taxes, packaging|audit bill|distance/i),
    ).toBeNull();
  });
});
