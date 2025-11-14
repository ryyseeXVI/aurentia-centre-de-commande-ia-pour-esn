// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ taskId: string }> }) {
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

    const { taskId } = await context.params;
    const body = await request.json();
    const {
      nom,
      description,
      statut,
      priorite,
      date_debut,
      date_fin,
      charge_estimee,
      tags,
      couleur,
      projet_id,
      milestone_id,
      profile_responsable_id,
    } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nom !== undefined) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (statut !== undefined) updateData.statut = statut;
    if (priorite !== undefined) updateData.priorite = priorite;
    if (date_debut !== undefined) updateData.date_debut = date_debut;
    if (date_fin !== undefined) updateData.date_fin = date_fin;
    if (charge_estimee !== undefined) updateData.charge_estimee = charge_estimee;
    if (tags !== undefined) updateData.tags = tags;
    if (couleur !== undefined) updateData.couleur = couleur;
    if (projet_id !== undefined) updateData.projet_id = projet_id;
    if (milestone_id !== undefined) updateData.milestone_id = milestone_id;
    if (profile_responsable_id !== undefined) updateData.profile_responsable_id = profile_responsable_id;

    const { data: updatedTask, error } = await supabase
      .from("tache")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "TASK_UPDATED",
      description: `Updated task: ${updatedTask.nom}`,
      metadata: { task_id: taskId },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error in PATCH /api/admin/tasks/[taskId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ taskId: string }> }) {
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

    const { taskId } = await context.params;

    const { error } = await supabase.from("tache").delete().eq("id", taskId);

    if (error) {
      console.error("Error deleting task:", error);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "TASK_DELETED",
      description: "Deleted task",
      metadata: { task_id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/tasks/[taskId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
