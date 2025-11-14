// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/admin/projects
 * Get all projects (Admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { data: projects, error } = await supabase
      .from("projet")
      .select(`
        *,
        organization:organizations(name),
        client:client(nom),
        chef_projet:profiles!projet_chef_projet_id_fkey(id, nom, prenom, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/projects
 * Create project or bulk operations (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    // Bulk delete operation
    if (body.operation === "bulk_delete") {
      const { project_ids } = body;

      if (!Array.isArray(project_ids) || project_ids.length === 0) {
        return NextResponse.json({ error: "Invalid project_ids" }, { status: 400 });
      }

      const { error } = await supabase
        .from("projet")
        .delete()
        .in("id", project_ids);

      if (error) {
        console.error("Error bulk deleting projects:", error);
        return NextResponse.json({ error: "Failed to delete projects" }, { status: 500 });
      }

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_PROJECTS",
        description: `Deleted ${project_ids.length} projects`,
        metadata: { project_ids },
      });

      return NextResponse.json({ success: true, deleted: project_ids.length });
    }

    // Create new project
    const {
      nom,
      description,
      statut,
      client_id,
      chef_projet_id,
      date_debut,
      date_fin_prevue,
      budget_initial,
      organization_id,
    } = body;

    if (!nom || !organization_id) {
      return NextResponse.json(
        { error: "Missing required fields: nom, organization_id" },
        { status: 400 }
      );
    }

    const { data: newProject, error } = await supabase
      .from("projet")
      .insert({
        nom,
        description,
        statut: statut || "ACTIF",
        client_id,
        chef_projet_id,
        date_debut,
        date_fin_prevue,
        budget_initial,
        organization_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "PROJECT_CREATED",
      description: `Created project: ${newProject.nom}`,
      metadata: { project_id: newProject.id },
    });

    return NextResponse.json({ project: newProject });
  } catch (error) {
    console.error("Error in POST /api/admin/projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
