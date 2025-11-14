// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Target } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { MilestonesManagementTable } from "./_components/milestones-management-table";

export default async function AdminMilestonesPage() {
  const supabase = await createClient();

  const [{ data: milestones }, { data: organizations }, { data: projects }] = await Promise.all([
    supabase.from("milestone").select(`
      *,
      organization:organizations(name),
      projet:projet(nom)
    `).order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("projet").select("id, nom").order("nom"),
  ]);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Milestones"
        description="Manage project milestones, deliverables, and completion tracking"
        icon={Target}
        badge={{
          label: `${milestones?.length || 0} milestones`,
          variant: "secondary"
        }}
      />

      <MilestonesManagementTable
        initialMilestones={milestones || []}
        organizations={organizations || []}
        projects={projects || []}
      />
    </AdminPageContainer>
  );
}
