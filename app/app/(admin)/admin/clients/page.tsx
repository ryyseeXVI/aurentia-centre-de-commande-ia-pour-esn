// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { UserManagementTable } from "../users/_components/user-management-table";

/**
 * Admin Clients Page
 *
 * Shows profiles with CLIENT role
 */
export default async function AdminClientsPage() {
  const supabase = await createClient();

  // Fetch profiles with CLIENT role
  const { data: clients, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "CLIENT")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
  }

  // Fetch all organizations for linking
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Users with CLIENT role
        </p>
      </div>
      <UserManagementTable
        initialUsers={clients || []}
        organizations={organizations || []}
      />
    </div>
  );
}
