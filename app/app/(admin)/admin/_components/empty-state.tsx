"use client";

import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty State Component
 *
 * Reusable component for displaying empty states across admin pages.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No users found"
 *   description="Get started by creating a new user"
 *   actionLabel="Add User"
 *   onAction={() => setShowCreateDialog(true)}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-16 w-16 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-chart-1" />
      </div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
