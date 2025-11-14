import { type NextRequest, NextResponse } from "next/server";
import type { TaskCardDb } from "@/types/tasks";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { taskForInsert, taskFromDb } from "@/utils/task-transformers";
import { createTaskSchema } from "@/utils/validators/task-validators";

/**
 * GET /api/projects/[projectId]/tasks
 * List all tasks for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify project exists and get organization_id
    const { data: project, error: projectError } = await supabase
      .from("projet")
      .select("id, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user has access to this project's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", project.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this project" },
        { status: 403 },
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const consultantResponsableId = searchParams.get("consultantResponsableId");
    const livrableId = searchParams.get("livrableId");
    const search = searchParams.get("search");

    // Build query for tasks (tache table)
    let query = supabase
      .from("tache")
      .select(
        `
        *,
        profiles:profile_responsable_id (
          id,
          nom,
          prenom,
          email
        )
      `,
        { count: "exact" },
      )
      .eq("projet_id", projectId);

    // Apply filters
    if (statut) {
      const statuses = statut.split(",");
      query = query.in("statut", statuses);
    }

    if (consultantResponsableId) {
      query = query.eq("profile_responsable_id", consultantResponsableId);
    }

    if (livrableId) {
      query = query.eq("livrable_id", livrableId);
    }

    if (search) {
      query = query.or(`nom.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Order by position (for Kanban board)
    query = query.order("position", { ascending: true });

    const { data: tasks, error: tasksError, count } = await query;

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformed = (tasks || []).map((task: any) => {
      const camelTask = taskFromDb(task as TaskCardDb);

      // Add consultant info if exists
      if (task.consultant) {
        camelTask.consultant = {
          id: task.consultant.id,
          nom: task.consultant.nom,
          prenom: task.consultant.prenom,
          email: task.consultant.email,
        };
      }

      return camelTask;
    });

    return NextResponse.json({
      data: transformed,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/projects/[projectId]/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/tasks
 * Create a new task in a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify project exists and get organization_id
    const { data: project, error: projectError } = await supabase
      .from("projet")
      .select("id, organization_id, nom")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user has access to this project's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", project.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to create tasks in this project" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod
    const validatedData = createTaskSchema.parse({
      ...body,
      projetId: projectId, // Ensure project ID matches route
    });

    // Transform for database insert
    const taskData = taskForInsert(validatedData, project.organization_id);

    // Insert task into tache table
    const { data: task, error: insertError } = await supabase
      .from("tache")
      .insert(taskData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating task:", insertError);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: project.organization_id,
      action: "TASK_CREATED",
      description: `Created task: ${task.nom} in project: ${project.nom}`,
      metadata: { task_id: task.id, projet_id: projectId },
    });

    // Transform response to camelCase
    const transformed = taskFromDb(task as TaskCardDb);

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error in POST /api/projects/[projectId]/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
