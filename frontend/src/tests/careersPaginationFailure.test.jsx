import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import api from "../services/api";
import CareersPage from "../pages/customer/CareersPage";

vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

const job = (id, title) => ({
  id,
  title,
  department: "Engineering",
  location: "Remote",
  description: "Build useful products.",
});

describe("CareersPage pagination failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores the last successful page after a failed request and retries the attempted page", async () => {
    let pageTwoAttempts = 0;
    api.get.mockImplementation((url, config = {}) => {
      if (url === "/jobs/departments") {
        return Promise.resolve({ success: true, data: ["Engineering"] });
      }

      if (config.params.offset === 0) {
        return Promise.resolve({
          success: true,
          data: [job(1, "First page role")],
          pagination: { totalCount: 25 },
        });
      }

      pageTwoAttempts += 1;
      if (pageTwoAttempts === 1) {
        return Promise.reject(new Error("Network unavailable"));
      }
      return Promise.resolve({
        success: true,
        data: [job(2, "Second page role")],
        pagination: { totalCount: 25 },
      });
    });

    render(
      <MemoryRouter>
        <CareersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("First page role")).toBeTruthy();
    const nextPage = screen.getByRole("button", { name: "Next page" });
    nextPage.focus();
    fireEvent.click(nextPage);

    expect(await screen.findByRole("alert")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Page 1" }).getAttribute("aria-current"))
        .toBe("page"),
    );
    expect(screen.getByText("First page role")).toBeTruthy();
    expect(screen.getByText("Open Positions (25)")).toBeTruthy();
    expect(screen.getByText((_, element) => element?.getAttribute("aria-live") === "polite").textContent)
      .toContain("Showing 1–12 of 25 positions");
    expect(screen.getByRole("button", { name: "Page 1" }).getAttribute("aria-current"))
      .toBe("page");
    expect(screen.getByRole("button", { name: "Page 2" }).getAttribute("aria-current"))
      .toBeNull();
    expect(screen.getByRole("button", { name: "Next page" })).toBe(nextPage);
    expect(document.activeElement).toBe(nextPage);

    const retryButton = screen.getByRole("button", { name: "Retry loading open positions" });
    expect(retryButton.disabled).toBe(false);
    fireEvent.click(retryButton);
    expect(await screen.findByText("Second page role")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.getByText("Open Positions (25)")).toBeTruthy();
    expect(screen.getByText((_, element) => element?.getAttribute("aria-live") === "polite").textContent)
      .toContain("Showing 13–24 of 25 positions");
    expect(screen.getByRole("button", { name: "Page 2" }).getAttribute("aria-current"))
      .toBe("page");
    expect(pageTwoAttempts).toBe(2);
  });
});
