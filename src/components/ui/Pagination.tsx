"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  resultsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  resultsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + i;
    return currentPage - 3 + i;
  });

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}>
        {totalCount !== undefined && resultsPerPage !== undefined
          ? `Showing ${Math.min((currentPage - 1) * resultsPerPage + 1, totalCount)}–${Math.min(currentPage * resultsPerPage, totalCount)} of ${totalCount}`
          : `Page ${currentPage} of ${totalPages}`}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg transition-colors hover:bg-[#20201f] disabled:opacity-30"
          style={{ color: "#adaaaa" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-medium transition-all",
              page === currentPage ? "" : "hover:bg-[#20201f]"
            )}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              background: page === currentPage ? "#cafd00" : "transparent",
              color: page === currentPage ? "#3a4a00" : "#adaaaa",
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg transition-colors hover:bg-[#20201f] disabled:opacity-30"
          style={{ color: "#adaaaa" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
