"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, X } from "lucide-react";

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  placeholder?: string;
  children?: React.ReactNode;
}

/**
 * Data Table Toolbar
 *
 * Polished toolbar for admin data tables with search and add functionality.
 * Includes smooth transitions, responsive layout, and clear visual hierarchy.
 *
 * Features:
 * - Responsive layout (stacks on mobile, inline on desktop)
 * - Search with clear button
 * - Optional add button
 * - Smooth transitions and hover states
 * - Card wrapper for visual separation
 *
 * @example
 * ```tsx
 * <DataTableToolbar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   onAdd={() => setShowCreateDialog(true)}
 *   addLabel="Add User"
 *   placeholder="Search users..."
 * >
 *   <FilterDropdown ... />
 * </DataTableToolbar>
 * ```
 */
export function DataTableToolbar({
  searchValue,
  onSearchChange,
  onAdd,
  addLabel = "Add New",
  placeholder = "Search...",
  children,
}: DataTableToolbarProps) {
  return (
    <Card className="p-4 border-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Search and filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
            <Input
              type="search"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-9 h-10 transition-all focus:ring-2 focus:ring-primary/20"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all"
                onClick={() => onSearchChange("")}
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Additional filters/children */}
          {children && (
            <div className="flex items-center gap-2 flex-wrap">
              {children}
            </div>
          )}
        </div>

        {/* Right side: Add button */}
        {onAdd && (
          <Button
            onClick={onAdd}
            className="transition-all hover:scale-105 hover:shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{addLabel}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
