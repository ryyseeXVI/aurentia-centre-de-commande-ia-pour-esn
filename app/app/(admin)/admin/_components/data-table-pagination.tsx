"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Data Table Pagination
 *
 * Mobile-responsive pagination component for admin data tables.
 * Adapts layout and controls based on screen size.
 *
 * Features:
 * - Responsive layout (stacked on mobile, inline on desktop)
 * - First/Last page buttons on larger screens
 * - Compact mobile view with essential controls
 * - Smooth transitions between states
 *
 * @example
 * ```tsx
 * <DataTablePagination
 *   currentPage={page}
 *   totalPages={Math.ceil(filteredData.length / pageSize)}
 *   pageSize={pageSize}
 *   totalItems={filteredData.length}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 * />
 * ```
 */
export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Results info - always visible */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {totalItems === 0 ? (
            "No results"
          ) : (
            <>
              Showing <span className="font-medium">{startItem}</span> to{" "}
              <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </>
          )}
        </p>
      </div>

      {/* Controls - responsive layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Rows per page:
          </p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              onPageChange(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="h-9 w-[70px] transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-3">
          {/* Page info */}
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages || 1}</span>
          </p>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            {/* First page button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || totalPages === 0}
              className="hidden sm:inline-flex h-9 w-9 p-0 transition-all hover:scale-105"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalPages === 0}
              className="h-9 w-9 p-0 transition-all hover:scale-105"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Next button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-9 w-9 p-0 transition-all hover:scale-105"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="hidden sm:inline-flex h-9 w-9 p-0 transition-all hover:scale-105"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
