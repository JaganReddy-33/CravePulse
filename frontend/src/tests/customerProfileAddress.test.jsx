import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import CustomerProfile from "../pages/customer/CustomerProfile";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 17, fullName: "Asha", email: "asha@example.test" },
    refreshProfile: vi.fn(),
  }),
}));
vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("customer saved address profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === "/auth/addresses") {
        return Promise.resolve({
          success: true,
          data: [{
            id: 5,
            title: "Home",
            default: true,
            addressLine: "12 Park Road",
            landmark: "Opposite City Library",
            city: "Bengaluru",
            state: "Karnataka",
            postalCode: "560001",
            mapsUrl: "https://www.google.com/maps/@12.9716,77.5946,17z",
          }],
        });
      }
      return Promise.resolve({ success: true, data: { balance: 0 } });
    });
  });

  it("renders every saved field and a safe maps link", async () => {
    render(<CustomerProfile />);

    await waitFor(() => expect(screen.getAllByText("Home")).toHaveLength(1));
    expect(screen.getAllByText("12 Park Road")).toHaveLength(1);
    expect(screen.getAllByText("Landmark: Opposite City Library")).toHaveLength(1);
    expect(screen.getAllByText("Bengaluru, Karnataka, 560001")).toHaveLength(1);
    const mapLinks = screen.getAllByRole("link", { name: /view on google maps/i });
    expect(mapLinks).toHaveLength(1);
    expect(mapLinks.every((link) => link.href.startsWith("https://www.google.com/maps/"))).toBe(true);
    expect(screen.getByRole("button", { name: "Delete Home" })).toBeTruthy();
  });
});
