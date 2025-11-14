// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { CheckSquare } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { TasksManagementTable } from "./_components/tasks-management-table";

export default async function AdminTasksPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: organizations }, { data: projects }, { data: milestones }, { data: assignees }] = await Promise.all([
    supabase.from("tache").select(`
      *,
      organization:organizations(name),
      projet:projet!tache_projet_id_fkey(nom),
      milestone:milestone(nom),
      responsable:profiles!tache_profile_responsable_id_fkey(id, nom, prenom, email)
    `).order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("projet").select("id, nom").order("nom"),
    supabase.from("milestone").select("id, nom, projet_id").order("nom"),
    supabase.from("profiles").select("id, nom, prenom, email").order("nom"),
  ]);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Tasks"
        description="Manage tasks, assignments, and priorities across all projects"
        icon={CheckSquare}
        badge={{
          label: `${tasks?.length || 0} tasks`,
          variant: "secondary"
        }}
      />

      <TasksManagementTable
        initialTasks={tasks || []}
        organizations={organizations || []}
        projects={projects || []}
        milestones={milestones || []}
        assignees={assignees || []}
      />
    </AdminPageContainer>
  );
}
