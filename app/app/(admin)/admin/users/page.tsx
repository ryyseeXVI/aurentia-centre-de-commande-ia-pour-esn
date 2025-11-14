// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserManagementTable } from "./_components/user-management-table";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { Users } from "lucide-react";

/**
 * Admin Users Management Page
 *
 * Server Component that fetches all users and renders the management interface.
 *
 * @security
 * - Protected by admin layout (ADMIN role required)
 * - Fetches all users across organizations
 */
export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Fetch all users and organizations in parallel
  const [
    { data: users, error },
    { data: organizations },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("organizations")
      .select("id, name")
      .order("name"),
  ]);

  if (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="User Management"
        description="Manage user accounts, roles, and permissions across all organizations"
        icon={Users}
        badge={{
          label: `${users?.length || 0} users`,
          variant: "secondary",
        }}
      />

      <UserManagementTable
        initialUsers={users || []}
        organizations={organizations || []}
      />
    </AdminPageContainer>
  );
}
