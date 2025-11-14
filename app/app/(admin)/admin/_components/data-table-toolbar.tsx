"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
 * Reusable toolbar for admin data tables with search and add functionality.
 *
 * @example
 * ```tsx
 * <DataTableToolbar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   onAdd={() => setShowCreateDialog(true)}
 *   addLabel="Add User"
 *   placeholder="Search users..."
 * />
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
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {children}
      </div>
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
