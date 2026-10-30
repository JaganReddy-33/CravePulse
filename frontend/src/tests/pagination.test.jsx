import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Pagination, { getPageItems } from "../components/common/Pagination";

describe("Pagination", () => {
  it("builds a compact page window with ellipses", () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(8, 20)).toEqual([1, "ellipsis", 7, 8, 9, "ellipsis", 20]);
  });

  it("reports the item range, marks the active page, and navigates", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        pageSize={20}
        totalCount={83}
        itemLabel="restaurants"
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText((_, element) => element?.getAttribute("aria-live") === "polite").textContent)
      .toContain("Showing 21–40 of 83 restaurants");
    expect(screen.getByRole("button", { name: "Page 2" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables navigation at both boundaries", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        pageSize={12}
        totalCount={24}
        itemLabel="positions"
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("button", { name: "First page" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Previous page" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("keeps focused controls mounted and prevents repeat paging while loading", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination
        currentPage={1}
        pageSize={10}
        totalCount={30}
        itemLabel="restaurants"
        onPageChange={onPageChange}
      />,
    );

    const nextPage = screen.getByRole("button", { name: "Next page" });
    nextPage.focus();
    fireEvent.click(nextPage);
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(
      <Pagination
        currentPage={2}
        pageSize={10}
        totalCount={30}
        itemLabel="restaurants"
        onPageChange={onPageChange}
        isLoading
      />,
    );

    const loadingNextPage = screen.getByRole("button", { name: "Next page" });
    expect(loadingNextPage.isConnected).toBe(true);
    expect(document.activeElement).toBe(loadingNextPage);
    expect(loadingNextPage.getAttribute("aria-disabled")).toBe("true");
    expect(document.querySelector(".results-pagination").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("Loading restaurants");
    fireEvent.click(loadingNextPage);
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });
});
