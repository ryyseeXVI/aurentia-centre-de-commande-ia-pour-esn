// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2 } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { OrganizationsManagementTable } from "./_components/organizations-management-table";

export default async function AdminOrganizationsPage() {
  const supabase = await createClient();

  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching organizations:", error);
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Organizations"
        description="Manage organizations, their settings, and subscription plans"
        icon={Building2}
        badge={{
          label: `${organizations?.length || 0} organizations`,
          variant: "secondary"
        }}
      />

      <OrganizationsManagementTable initialOrganizations={organizations || []} />
    </AdminPageContainer>
  );
}
