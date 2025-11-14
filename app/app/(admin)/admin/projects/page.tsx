// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { ProjectsManagementTable } from "./_components/projects-management-table";

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: organizations }, { data: clients }, { data: projectManagers }] = await Promise.all([
    supabase.from("projet").select(`
      *,
      organization:organizations(name),
      client:client(nom),
      chef_projet:profiles!projet_chef_projet_id_fkey(id, nom, prenom, email)
    `).order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("client").select("id, nom").order("nom"),
    supabase.from("profiles").select("id, nom, prenom, email").order("nom"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Manage projects across all organizations</p>
      </div>
      <ProjectsManagementTable
        initialProjects={projects || []}
        organizations={organizations || []}
        clients={clients || []}
        projectManagers={projectManagers || []}
      />
    </div>
  );
}
