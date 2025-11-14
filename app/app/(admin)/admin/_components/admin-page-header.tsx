import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Admin Page Header
 *
 * Consistent header component for all admin pages with:
 * - Title with optional icon
 * - Optional description
 * - Optional badge for status/count
 * - Optional action buttons (right-aligned)
 *
 * @example
 * ```tsx
 * <AdminPageHeader
 *   title="User Management"
 *   description="Manage user accounts, roles, and permissions"
 *   icon={Users}
 *   badge={{ label: "24 active", variant: "secondary" }}
 *   actions={<Button>Add User</Button>}
 * />
 * ```
 */
export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Top row: Title with icon + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant || "secondary"} className="flex-shrink-0">
                  {badge.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
          {description}
        </p>
      )}
    </div>
  );
}
