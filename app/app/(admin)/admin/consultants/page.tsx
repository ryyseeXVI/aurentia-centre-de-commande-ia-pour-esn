// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { UserManagementTable } from "../users/_components/user-management-table";

/**
 * Admin Consultants Page
 *
 * Shows profiles with CONSULTANT role
 */
export default async function AdminConsultantsPage() {
  const supabase = await createClient();

  // Fetch profiles with CONSULTANT role
  const { data: consultants, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "CONSULTANT")
    .order("created_at", { ascending: false});

  if (error) {
    console.error("Error fetching consultants:", error);
  }

  // Fetch all organizations for linking
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultants</h1>
        <p className="text-muted-foreground">
          Users with CONSULTANT role
        </p>
      </div>
      <UserManagementTable
        initialUsers={consultants || []}
        organizations={organizations || []}
      />
    </div>
  );
}
