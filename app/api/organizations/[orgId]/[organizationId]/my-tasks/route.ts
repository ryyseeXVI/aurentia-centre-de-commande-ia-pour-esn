import { type NextRequest, NextResponse } from "next/server";
import type { TaskCardDb } from "@/types/tasks";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { taskFromDb } from "@/utils/task-transformers";

/**
 * GET /api/organizations/[organizationId]/my-tasks
 * Get all tasks assigned to the current user in this organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const organizationId = resolvedParams.organizationId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this organization" },
        { status: 403 },
      );
    }

    // Get user's consultant profile
    const { data: consultant } = await supabase
      .from("consultant")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    // If user is not a consultant, return empty list
    if (!consultant) {
      return NextResponse.json({ data: [], total: 0 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const _priority = searchParams.get("priority");
    const overdue = searchParams.get("overdue");
    const sortBy = searchParams.get("sortBy") || "date_fin_cible";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build query for tasks assigned to this consultant
    let query = supabase
      .from("tache")
      .select(
        `
        *,
        projet:projet_id (
          id,
          nom,
          statut
        ),
        consultant:consultant_responsable_id (
          id,
          nom,
          prenom,
          email
        )
      `,
        { count: "exact" },
      )
      .eq("consultant_responsable_id", consultant.id)
      .eq("organization_id", organizationId);

    // Apply filters
    if (statut) {
      const statuses = statut.split(",");
      query = query.in("statut", statuses);
    }

    // Filter overdue tasks
    if (overdue === "true") {
      const today = new Date().toISOString().split("T")[0];
      query = query.lt("date_fin_cible", today).neq("statut", "DONE");
    }

    // Apply sorting
    query = query.order(sortBy, {
      ascending: sortOrder === "asc",
      nullsFirst: false,
    });

    const { data: tasks, error: tasksError, count } = await query;

    if (tasksError) {
      console.error("Error fetching my tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformed = (tasks || []).map((task: any) => {
      const camelTask: any = taskFromDb(task as TaskCardDb);

      // Add project info
      if (task.projet) {
        camelTask.projet = {
          id: task.projet.id,
          nom: task.projet.nom,
          statut: task.projet.statut,
        };
      }

      // Add consultant info
      if (task.consultant) {
        camelTask.consultant = {
          id: task.consultant.id,
          nom: task.consultant.nom,
          prenom: task.consultant.prenom,
          email: task.consultant.email,
        };
      }

      // Calculate if overdue
      if (task.date_fin_cible && task.statut !== "DONE") {
        const dueDate = new Date(task.date_fin_cible);
        const today = new Date();
        camelTask.isOverdue = dueDate < today;
      }

      return camelTask;
    });

    return NextResponse.json({
      data: transformed,
      total: count || 0,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/organizations/[organizationId]/my-tasks:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
