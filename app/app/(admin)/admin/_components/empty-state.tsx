"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "muted";
}

/**
 * Empty State Component
 *
 * Polished component for displaying empty states across admin pages.
 * Features smooth animations and flexible styling.
 *
 * Features:
 * - Flexible icon and text styling
 * - Optional action button with icon
 * - Smooth transitions and animations
 * - Two visual variants (default/muted)
 * - Card wrapper for visual separation
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No users found"
 *   description="Get started by creating a new user"
 *   actionLabel="Add User"
 *   onAction={() => setShowCreateDialog(true)}
 *   variant="default"
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  const iconBgClass = variant === "muted"
    ? "bg-muted"
    : "bg-primary/10";
  const iconColorClass = variant === "muted"
    ? "text-muted-foreground"
    : "text-primary";

  return (
    <Card className="border-2 border-dashed">
      <div className="text-center py-16 px-6 sm:py-20">
        <div className={`mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full ${iconBgClass} flex items-center justify-center mb-6 transition-transform hover:scale-110`}>
          <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${iconColorClass}`} />
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            size="default"
            className="transition-all hover:scale-105 hover:shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
