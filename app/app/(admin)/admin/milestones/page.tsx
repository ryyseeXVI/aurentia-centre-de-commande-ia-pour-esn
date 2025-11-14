// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Milestones</h1>
        <p className="text-muted-foreground">Manage project milestones and deliverables</p>
      </div>
      <MilestonesManagementTable
        initialMilestones={milestones || []}
        organizations={organizations || []}
        projects={projects || []}
      />
    </div>
  );
}
