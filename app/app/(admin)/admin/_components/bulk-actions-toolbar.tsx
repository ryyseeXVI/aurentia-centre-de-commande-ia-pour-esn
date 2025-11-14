"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trash2, X, CheckCircle2 } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

/**
 * Bulk Actions Toolbar
 *
 * Polished toolbar that appears when items are selected in a data table.
 * Provides actions to perform on multiple items at once with smooth animations.
 *
 * Features:
 * - Smooth slide-in animation
 * - Selection count badge
 * - Clear selection button
 * - Optional delete button
 * - Custom action buttons via children
 * - Responsive layout
 *
 * @example
 * ```tsx
 * {selectedItems.length > 0 && (
 *   <BulkActionsToolbar
 *     selectedCount={selectedItems.length}
 *     onClearSelection={() => setSelectedItems([])}
 *     onDelete={handleBulkDelete}
 *   >
 *     <Button variant="outline" size="sm">
 *       Change Role
 *     </Button>
 *   </BulkActionsToolbar>
 * )}
 * ```
 */
export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onDelete,
  children,
}: BulkActionsToolbarProps) {
  return (
    <Card className="p-4 bg-primary/5 border-2 border-primary/20 animate-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Selection info and clear button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="secondary" className="font-semibold px-3 py-1">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-9 hover:bg-background/80 transition-all"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {children}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-9 transition-all hover:scale-105 hover:shadow-md"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Delete Selected</span>
              <span className="sm:hidden">Delete</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
