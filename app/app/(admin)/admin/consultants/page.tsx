// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Briefcase } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { UserManagementTable } from "../users/_components/user-management-table";

/**
 * Admin Consultants Page
 *
 * Shows profiles with CONSULTANT role
 */
export default async function AdminConsultantsPage() {
  const supabase = await createClient();

  // Parallel data fetching
  const [{ data: consultants, error }, { data: organizations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "CONSULTANT")
      .order("created_at", { ascending: false }),
    supabase
      .from("organizations")
      .select("id, name")
      .order("name"),
  ]);

  if (error) {
    console.error("Error fetching consultants:", error);
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Consultants"
        description="Manage consultants and their organization assignments"
        icon={Briefcase}
        badge={{
          label: `${consultants?.length || 0} consultants`,
          variant: "secondary"
        }}
      />

      <UserManagementTable
        initialUsers={consultants || []}
        organizations={organizations || []}
      />
    </AdminPageContainer>
  );
}
