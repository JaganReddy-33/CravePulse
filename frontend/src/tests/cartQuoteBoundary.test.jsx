import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "../context/CartContext";
import api from "../services/api";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

function CartQuoteControls() {
  const {
    addItem,
    setDeliveryCoordinates,
    setCheckoutQuoteEnabled,
  } = useCart();
  return (
    <div>
      <button
        onClick={() =>
          addItem({
            restaurantId: 7,
            restaurantName: "Juniper Kitchen",
            item: { id: 12, name: "Dosa", platformPrice: 80 },
          })
        }
      >
        Add item
      </button>
      <button
        onClick={() =>
          setDeliveryCoordinates({ latitude: 12.97, longitude: 77.59 })
        }
      >
        Set previous address
      </button>
      <button onClick={() => setCheckoutQuoteEnabled(true)}>
        Enter checkout
      </button>
    </div>
  );
}

describe("address quote boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({
      success: true,
      data: {
        subtotal: 80,
        couponDiscount: 0,
        packagingFee: 15,
        deliveryFee: 35,
        platformFee: 5,
        gstTax: 4.75,
        tipAmount: 0,
        totalAmount: 139.75,
        distanceKm: 2.4,
      },
    });
  });

  it("does not request a location quote for drawer/cart changes outside checkout", async () => {
    render(
      <CartProvider>
        <CartQuoteControls />
      </CartProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Set previous address" }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.post).not.toHaveBeenCalledWith(
      "/cart/calculate",
      expect.anything(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Enter checkout" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/cart/calculate",
        expect.objectContaining({
          restaurantId: 7,
          userLat: 12.97,
          userLng: 77.59,
        }),
      ),
    );
  });
});
