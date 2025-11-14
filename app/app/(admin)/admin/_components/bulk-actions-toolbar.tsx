"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

/**
 * Bulk Actions Toolbar
 *
 * Appears when items are selected in a data table.
 * Provides actions to perform on multiple items at once.
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
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {selectedCount} selected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        )}
      </div>
    </div>
  );
}
