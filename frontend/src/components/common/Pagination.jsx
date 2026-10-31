import React from "react";

export const getPageItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      ...Array.from({ length: 5 }, (_, index) => totalPages - 4 + index),
    ];
  }
  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
};

const Pagination = ({
  currentPage,
  pageSize,
  totalCount,
  itemLabel,
  onPageChange,
  isLoading = false,
}) => {
  if (totalCount < 1) return null;

  const totalPages = Math.ceil(totalCount / pageSize);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstItem = (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalCount);
  const changePage = (page) => {
    if (!isLoading && page >= 1 && page <= totalPages && page !== safePage)
      onPageChange(page);
  };

  return (
    <div className="results-pagination mt-4" aria-busy={isLoading}>
      <p
        className="results-pagination-summary small text-muted mb-0"
        aria-live="polite"
      >
        Showing{" "}
        <strong>
          {firstItem}–{lastItem}
        </strong>{" "}
        of <strong>{totalCount}</strong> {itemLabel} · {pageSize} per page
      </p>
      {isLoading && (
        <span className="visually-hidden" role="status">
          Loading {itemLabel}…
        </span>
      )}
      {totalPages > 1 && (
        <nav aria-label={`${itemLabel} pages`}>
          <ul className="pagination pagination-sm mb-0">
            <li
              className={`page-item${isLoading || safePage === 1 ? " disabled" : ""}`}
            >
              <button
                type="button"
                className="page-link pagination-edge"
                aria-label="First page"
                aria-disabled={isLoading || safePage === 1}
                onClick={() => changePage(1)}
                disabled={!isLoading && safePage === 1}
              >
                <span aria-hidden="true">«</span>
                <span className="pagination-edge-label">First</span>
              </button>
            </li>
            <li
              className={`page-item${isLoading || safePage === 1 ? " disabled" : ""}`}
            >
              <button
                type="button"
                className="page-link pagination-edge"
                aria-label="Previous page"
                aria-disabled={isLoading || safePage === 1}
                onClick={() => changePage(safePage - 1)}
                disabled={!isLoading && safePage === 1}
              >
                <span aria-hidden="true">‹</span>
                <span className="pagination-edge-label">Previous</span>
              </button>
            </li>
            {getPageItems(safePage, totalPages).map((page, index) =>
              page === "ellipsis" ? (
                <li
                  className="page-item pagination-ellipsis"
                  key={`ellipsis-${index}`}
                >
                  <span className="page-link" aria-hidden="true">
                    …
                  </span>
                </li>
              ) : (
                <li
                  className={`page-item${page === safePage ? " active" : ""}`}
                  key={page}
                >
                  <button
                    type="button"
                    className="page-link pagination-number"
                    aria-label={`Page ${page}`}
                    aria-disabled={isLoading}
                    aria-current={page === safePage ? "page" : undefined}
                    onClick={() => changePage(page)}
                  >
                    {page}
                  </button>
                </li>
              ),
            )}
            <li
              className={`page-item${isLoading || safePage === totalPages ? " disabled" : ""}`}
            >
              <button
                type="button"
                className="page-link pagination-edge"
                aria-label="Next page"
                aria-disabled={isLoading || safePage === totalPages}
                onClick={() => changePage(safePage + 1)}
                disabled={!isLoading && safePage === totalPages}
              >
                <span className="pagination-edge-label">Next</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
            <li
              className={`page-item${isLoading || safePage === totalPages ? " disabled" : ""}`}
            >
              <button
                type="button"
                className="page-link pagination-edge"
                aria-label="Last page"
                aria-disabled={isLoading || safePage === totalPages}
                onClick={() => changePage(totalPages)}
                disabled={!isLoading && safePage === totalPages}
              >
                <span className="pagination-edge-label">Last</span>
                <span aria-hidden="true">»</span>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Pagination;
