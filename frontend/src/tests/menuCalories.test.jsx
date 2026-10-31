import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MenuManagement from "../pages/partner/MenuManagement";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useOutletContext: () => ({ restaurant: { id: 7 } }),
  };
});
vi.mock("../components/ModalPortal", () => ({
  default: ({ children }) => children,
}));

const category = { id: 3, name: "Mains" };
const existingItem = {
  id: 21,
  restaurantId: 7,
  categoryId: 3,
  name: "Masala dosa",
  description: "Crisp rice crepe",
  platformPrice: 120,
  dineInPrice: 120,
  imageUrl: "",
  isVeg: true,
  isAvailable: true,
  prepTimeMinutes: 15,
  calorieCount: 350,
};

describe("partner menu calorie contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      success: true,
      data: { categories: [category], items: [existingItem] },
    });
    api.post.mockResolvedValue({ success: true, data: {} });
  });

  it("sends calorieCount on create and edit requests", async () => {
    const { unmount } = render(<MenuManagement />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /add new dish/i }));
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Special Hyderabadi Dum Biryani"),
      { target: { value: "Lemon rice" } },
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. 299"), {
      target: { value: "140" },
    });
    const createCalories = screen.getByText("Calories (kcal)").nextElementSibling;
    fireEvent.change(createCalories, { target: { value: "425" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Add Dish to Catalog" }),
    );

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/menu/item",
        expect.objectContaining({
          calorieCount: 425,
          imageUrl: null,
          prepTimeMinutes: null,
        }),
      ),
    );
    expect(api.post.mock.calls[0][1]).not.toHaveProperty("calories");
    unmount();

    render(<MenuManagement />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle("Edit Dish & Pricing"));
    const editCalories = screen.getByText("Calories (kcal)").nextElementSibling;
    fireEvent.change(editCalories, { target: { value: "" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Modifications" }),
    );

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/menu/item/21/update",
        expect.objectContaining({ calorieCount: null }),
      ),
    );
    expect(api.post.mock.calls.at(-1)[1]).not.toHaveProperty("calories");
  });

  it("does not invent a calorie count, image, or prep time when optional fields are blank", async () => {
    render(<MenuManagement />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /add new dish/i }));
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Special Hyderabadi Dum Biryani"),
      { target: { value: "Plain rice" } },
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. 299"), {
      target: { value: "80" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add Dish to Catalog" }),
    );

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/menu/item",
      expect.objectContaining({
        calorieCount: null,
        imageUrl: null,
        prepTimeMinutes: null,
      }),
    ));
  });
});
