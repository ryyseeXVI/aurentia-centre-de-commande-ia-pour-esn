// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/admin/tasks
 * Get all tasks (Admin only)
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

    const { data: tasks, error } = await supabase
      .from("tache")
      .select(`
        *,
        organization:organizations(name),
        projet:projet!tache_projet_id_fkey(nom),
        milestone:milestone(nom),
        responsable:profiles!tache_profile_responsable_id_fkey(id, nom, prenom, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tasks
 * Create task or bulk operations (Admin only)
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
      const { task_ids } = body;

      if (!Array.isArray(task_ids) || task_ids.length === 0) {
        return NextResponse.json({ error: "Invalid task_ids" }, { status: 400 });
      }

      const { error } = await supabase
        .from("tache")
        .delete()
        .in("id", task_ids);

      if (error) {
        console.error("Error bulk deleting tasks:", error);
        return NextResponse.json({ error: "Failed to delete tasks" }, { status: 500 });
      }

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_TASKS",
        description: `Deleted ${task_ids.length} tasks`,
        metadata: { task_ids },
      });

      return NextResponse.json({ success: true, deleted: task_ids.length });
    }

    // Bulk assign operation
    if (body.operation === "bulk_assign") {
      const { task_ids, profile_responsable_id } = body;

      if (!Array.isArray(task_ids) || task_ids.length === 0) {
        return NextResponse.json({ error: "Invalid task_ids" }, { status: 400 });
      }

      const { error } = await supabase
        .from("tache")
        .update({ profile_responsable_id })
        .in("id", task_ids);

      if (error) {
        console.error("Error bulk assigning tasks:", error);
        return NextResponse.json({ error: "Failed to assign tasks" }, { status: 500 });
      }

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_ASSIGN_TASKS",
        description: `Assigned ${task_ids.length} tasks`,
        metadata: { task_ids, profile_responsable_id },
      });

      return NextResponse.json({ success: true, assigned: task_ids.length });
    }

    // Create new task
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
      organization_id,
    } = body;

    if (!nom || !organization_id) {
      return NextResponse.json(
        { error: "Missing required fields: nom, organization_id" },
        { status: 400 }
      );
    }

    const { data: newTask, error } = await supabase
      .from("tache")
      .insert({
        nom,
        description,
        statut: statut || "A_FAIRE",
        priorite: priorite || "MOYENNE",
        date_debut,
        date_fin,
        charge_estimee,
        tags: tags || [],
        couleur,
        projet_id,
        milestone_id,
        profile_responsable_id,
        organization_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "TASK_CREATED",
      description: `Created task: ${newTask.nom}`,
      metadata: { task_id: newTask.id },
    });

    return NextResponse.json({ task: newTask });
  } catch (error) {
    console.error("Error in POST /api/admin/tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
