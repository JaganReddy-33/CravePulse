import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../services/api";
import CustomerHome from "../pages/customer/CustomerHome";
import RestaurantDetail from "../pages/customer/RestaurantDetail";
import DishCard from "../components/restaurant/DishCard";
import { CartProvider } from "../context/CartContext";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock("../services/preferences", () => ({
  getPreference: () => null,
}));
vi.mock("../components/common/ScrollCarousel", () => ({
  default: ({ children, sectionHeader }) => (
    <section>
      {sectionHeader}
      {children}
    </section>
  ),
}));

describe("customer restaurant card data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === "/catalog/categories") {
        return Promise.resolve({ success: true, data: [] });
      }
      if (url === "/restaurants") {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 27,
              name: "Juniper Kitchen",
              cuisineTypes: "South Indian · Regional",
              totalReviews: 0,
              rating: 5,
              prepTimeMin: 24,
              costForTwo: 560,
              distanceKm: 2.4,
              deliveryFee: 0,
              isOpen: true,
              bannerImage: "",
            },
          ],
          pagination: { totalCount: 1 },
        });
      }
      return Promise.resolve({ success: true, data: [] });
    });
  });

  it("uses the restaurant record for a responsive card without inventing ratings, deals, or location", async () => {
    render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>,
    );

    const restaurantLink = await screen.findByRole("link", {
      name: "View Juniper Kitchen menu",
    });
    expect(restaurantLink.getAttribute("href")).toBe(
      "/restaurant/27?source=collection",
    );
    expect(screen.getByText("No reviews yet")).toBeTruthy();
    expect(screen.getByText("Prep 24 min")).toBeTruthy();
    expect(screen.getByText("₹560 for two")).toBeTruthy();
    expect(screen.getByText("Free delivery")).toBeTruthy();
    expect(screen.queryByText("0% Markup Parity")).toBeNull();
    expect(screen.queryByText(/standard apps/i)).toBeNull();
    expect(screen.queryByText(/Indiranagar|Bangalore/i)).toBeNull();
    expect(
      screen.getByRole("img", {
        name: "Juniper Kitchen: restaurant image unavailable",
      }),
    ).toBeTruthy();
  });

  it("does not substitute a default restaurant ID for an invalid route", async () => {
    render(
      <MemoryRouter initialEntries={["/restaurant/not-a-number"]}>
        <Routes>
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Restaurant Not Found");
    await waitFor(() => expect(api.get).not.toHaveBeenCalled());
  });

  it("shows a menu item's database price without inventing comparison pricing", () => {
    render(
      <CartProvider>
        <DishCard
          dish={{
            id: 4,
            restaurantId: 27,
            name: "Lemon rice",
            platformPrice: 120,
            dineInPrice: 120,
            description: "Rice with lemon and curry leaves.",
          }}
          restaurantName="Juniper Kitchen"
        />
      </CartProvider>,
    );

    expect(screen.getByText("₹120")).toBeTruthy();
    expect(screen.queryByText(/standard apps|markup parity/i)).toBeNull();
    expect(
      screen.getByRole("img", { name: "Lemon rice: image unavailable" }),
    ).toBeTruthy();
  });
});
