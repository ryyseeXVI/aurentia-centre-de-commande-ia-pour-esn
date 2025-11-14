// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage client organizations and their settings
        </p>
      </div>

      <OrganizationsManagementTable initialOrganizations={organizations || []} />
    </div>
  );
}
