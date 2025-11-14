// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
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

    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { projectId } = await context.params;
    const body = await request.json();
    const {
      nom,
      description,
      statut,
      client_id,
      chef_projet_id,
      date_debut,
      date_fin_prevue,
      budget_initial,
    } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nom !== undefined) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (statut !== undefined) updateData.statut = statut;
    if (client_id !== undefined) updateData.client_id = client_id;
    if (chef_projet_id !== undefined) updateData.chef_projet_id = chef_projet_id;
    if (date_debut !== undefined) updateData.date_debut = date_debut;
    if (date_fin_prevue !== undefined) updateData.date_fin_prevue = date_fin_prevue;
    if (budget_initial !== undefined) updateData.budget_initial = budget_initial;

    const { data: updatedProject, error } = await supabase
      .from("projet")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "PROJECT_UPDATED",
      description: `Updated project: ${updatedProject.nom}`,
      metadata: { project_id: projectId },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Error in PATCH /api/admin/projects/[projectId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
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

    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { projectId } = await context.params;

    const { error } = await supabase.from("projet").delete().eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "PROJECT_DELETED",
      description: "Deleted project",
      metadata: { project_id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/projects/[projectId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
