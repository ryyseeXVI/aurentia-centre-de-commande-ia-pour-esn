import { cn } from "@/lib/utils";

interface AdminPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Admin Page Container
 *
 * Provides consistent layout structure for all admin pages:
 * - Max width constraint for better readability
 * - Consistent horizontal and vertical padding
 * - Responsive spacing that adapts to screen size
 *
 * @example
 * ```tsx
 * <AdminPageContainer>
 *   <AdminPageHeader title="Users" description="Manage user accounts" />
 *   <UserManagementTable />
 * </AdminPageContainer>
 * ```
 */
export function AdminPageContainer({
  children,
  className,
}: AdminPageContainerProps) {
  return (
    <div
      className={cn(
        // Container constraints
        "w-full mx-auto",
        "max-w-[1600px]", // Prevent content from being too wide on large screens
        // Responsive padding
        "px-4 sm:px-6 lg:px-8", // Horizontal padding
        "py-6 sm:py-8", // Vertical padding
        // Spacing between children
        "space-y-6 sm:space-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}
