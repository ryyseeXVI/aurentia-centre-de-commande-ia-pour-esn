// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserManagementTable } from "./_components/user-management-table";

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

  // Fetch all users
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
  }

  // Fetch all organizations for linking
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <UserManagementTable
        initialUsers={users || []}
        organizations={organizations || []}
      />
    </div>
  );
}
