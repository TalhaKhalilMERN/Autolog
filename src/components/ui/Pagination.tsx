"use client";

import { ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemName = "items",
}: PaginationProps) {
  if (totalCount === 0) return null;

  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalCount);

  // Calculate visible page numbers (up to 5 pages around validCurrentPage)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{startIndex}</span> to{" "}
          <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> {itemName}
        </p>

        {/* Items per page selector */}
        <div className="relative inline-flex items-center">
          <Layers className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
            className="appearance-none rounded-lg border border-border bg-card pl-7 pr-6 py-1.5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                pageNum === validCurrentPage
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
