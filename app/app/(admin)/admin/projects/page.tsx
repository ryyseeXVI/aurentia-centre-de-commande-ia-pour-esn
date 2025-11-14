// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { FolderKanban } from "lucide-react";
import { AdminPageContainer } from "../_components/admin-page-container";
import { AdminPageHeader } from "../_components/admin-page-header";
import { ProjectsManagementTable } from "./_components/projects-management-table";

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: organizations }, { data: clients }, { data: projectManagers }, { data: healthScores }] = await Promise.all([
    supabase.from("projet").select(`
      *,
      organization:organizations(name),
      client:client(nom),
      chef_projet:profiles!projet_chef_projet_id_fkey(id, nom, prenom, email)
    `).order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("client").select("id, nom").order("nom"),
    supabase.from("profiles").select("id, nom, prenom, email").order("nom"),
    // Fetch latest health scores for each project
    supabase.from("score_sante_projet")
      .select("projet_id, score_global, couleur_risque, date_analyse, raisonnement_ia")
      .order("date_analyse", { ascending: false }),
  ]);

  // Map health scores to projects (get latest score for each project)
  const healthScoresMap = new Map();
  healthScores?.forEach((score: any) => {
    if (!healthScoresMap.has(score.projet_id)) {
      healthScoresMap.set(score.projet_id, score);
    }
  });

  // Enrich projects with health scores
  const projectsWithHealth = projects?.map((project: any) => ({
    ...project,
    healthScore: healthScoresMap.get(project.id) || null,
  })) || [];

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Projects"
        description="Manage projects, assignments, and timelines across all organizations"
        icon={FolderKanban}
        badge={{
          label: `${projectsWithHealth?.length || 0} projects`,
          variant: "secondary"
        }}
      />

      <ProjectsManagementTable
        initialProjects={projectsWithHealth}
        organizations={organizations || []}
        clients={clients || []}
        projectManagers={projectManagers || []}
      />
    </AdminPageContainer>
  );
}
