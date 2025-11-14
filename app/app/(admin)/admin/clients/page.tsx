// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { UserCheck } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { UserManagementTable } from "../users/_components/user-management-table";

/**
 * Admin Clients Page
 *
 * Shows profiles with CLIENT role
 */
export default async function AdminClientsPage() {
  const supabase = await createClient();

  // Parallel data fetching
  const [{ data: clients, error }, { data: organizations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "CLIENT")
      .order("created_at", { ascending: false }),
    supabase
      .from("organizations")
      .select("id, name")
      .order("name"),
  ]);

  if (error) {
    console.error("Error fetching clients:", error);
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Clients"
        description="Manage client users and their organization access"
        icon={UserCheck}
        badge={{
          label: `${clients?.length || 0} clients`,
          variant: "secondary"
        }}
      />

      <UserManagementTable
        initialUsers={clients || []}
        organizations={organizations || []}
      />
    </AdminPageContainer>
  );
}
