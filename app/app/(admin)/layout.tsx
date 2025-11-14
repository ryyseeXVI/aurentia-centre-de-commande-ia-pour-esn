// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Admin Route Group Layout
 *
 * Server Component that enforces ADMIN-only access to the backoffice.
 * Checks authentication and role on the server before rendering.
 *
 * This layout inherits from the parent /app layout, so it already has:
 * - AppSidebar with navigation
 * - All context providers (Auth, Workspace, Project, Notifications)
 * - Consistent styling and layout
 *
 * @security
 * - Server-side authentication check
 * - Role-based access control (ADMIN only)
 * - Redirects unauthorized users to /app
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check if user is ADMIN
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "ADMIN") {
    // Redirect non-admin users to main app
    redirect("/app");
  }

  // Just pass through children - layout is inherited from parent
  return <>{children}</>;
}
