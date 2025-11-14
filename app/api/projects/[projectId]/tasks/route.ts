// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import type { TaskCardDb } from "@/types/tasks";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { taskForInsert, taskFromDb } from "@/utils/task-transformers";
import { createTaskSchema } from "@/utils/validators/task-validators";
import { notifyTaskCreated } from "@/lib/notifications";

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
        ),
        milestone_tasks (
          milestone_id,
          milestones (
            id,
            name,
            status,
            color,
            due_date
          )
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
      if (task.profiles) {
        camelTask.consultant = {
          id: task.profiles.id,
          nom: task.profiles.nom,
          prenom: task.profiles.prenom,
          email: task.profiles.email,
        };
      }

      // Add milestone info if exists
      if (task.milestone_tasks && task.milestone_tasks.length > 0) {
        camelTask.milestones = task.milestone_tasks
          .filter((mt: any) => mt.milestones) // Only include if milestone data exists
          .map((mt: any) => ({
            id: mt.milestones.id,
            name: mt.milestones.name,
            status: mt.milestones.status,
            color: mt.milestones.color,
            dueDate: mt.milestones.due_date,
          }));
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
    const { milestoneId, ...taskFields } = body;

    // Validate with Zod
    const validatedData = createTaskSchema.parse({
      ...taskFields,
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

    // Link task to milestone if provided
    if (milestoneId) {
      const { error: milestoneError } = await supabase
        .from("milestone_tasks")
        .insert({
          milestone_id: milestoneId,
          tache_id: task.id,
          weight: 1, // Default weight
        });

      if (milestoneError) {
        console.error("Error linking task to milestone:", milestoneError);
        // Don't fail the request, just log the error
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: project.organization_id,
      action: "TASK_CREATED",
      description: `Created task: ${task.nom} in project: ${project.nom}${milestoneId ? " (linked to milestone)" : ""}`,
      metadata: { task_id: task.id, projet_id: projectId, milestone_id: milestoneId },
    });

    // Send notification for task creation
    await notifyTaskCreated({
      taskId: task.id,
      taskTitle: task.nom,
      assigneeId: task.profile_responsable_id || undefined,
      creatorId: user.id,
      projectId: projectId,
      organizationId: project.organization_id,
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
