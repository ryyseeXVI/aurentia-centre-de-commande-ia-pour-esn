import { type NextRequest, NextResponse } from "next/server";
import type { TaskCardDb } from "@/types/tasks";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { taskForUpdate, taskFromDb } from "@/utils/task-transformers";
import { updateTaskSchema } from "@/utils/validators/task-validators";
import { logger } from "@/lib/logger";

/**
 * GET /api/tasks/[taskId]
 * Get a single task by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch task from tache table with related data
    const { data: task, error: taskError } = await supabase
      .from("tache")
      .select(
        `
        *,
        consultant:consultant_responsable_id (
          id,
          nom,
          prenom,
          email
        ),
        projet:projet_id (
          id,
          nom,
          organization_id
        )
      `,
      )
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify user has access to this task's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", task.projet.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this task" },
        { status: 403 },
      );
    }

    // Transform to camelCase
    const transformed = taskFromDb(task as TaskCardDb);

    // Add consultant info if exists
    if (task.consultant) {
      transformed.consultant = {
        id: task.consultant.id,
        nom: task.consultant.nom,
        prenom: task.consultant.prenom,
        email: task.consultant.email,
      };
    }

    return NextResponse.json({ data: transformed });
  } catch (error) {
    logger.error("Error in GET /api/tasks/[taskId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/tasks/[taskId]
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get existing task to verify access
    const { data: existingTask, error: fetchError } = await supabase
      .from("tache")
      .select(
        `
        id,
        nom,
        organization_id,
        projet:projet_id (
          nom
        )
      `,
      )
      .eq("id", taskId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify user has access to this task's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", existingTask.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to update this task" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Transform for database update
    const updateData = taskForUpdate(validatedData);

    // Update task in tache table
    const { data: task, error: updateError } = await supabase
      .from("tache")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating task", updateError, { taskId });
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingTask.organization_id,
      action: "TASK_UPDATED",
      description: `Updated task: ${existingTask.nom} in project: ${existingTask.projet?.nom || "Unknown"}`,
      metadata: { task_id: taskId },
    });

    // Transform response to camelCase
    const transformed = taskFromDb(task as TaskCardDb);

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error("Error in PATCH /api/tasks/[taskId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tasks/[taskId]
 * Delete a task
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get existing task to verify access
    const { data: existingTask, error: fetchError } = await supabase
      .from("tache")
      .select(
        `
        id,
        nom,
        organization_id,
        projet:projet_id (
          nom
        )
      `,
      )
      .eq("id", taskId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify user has access to this task's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", existingTask.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to delete this task" },
        { status: 403 },
      );
    }

    // Delete task from tache table
    const { error: deleteError } = await supabase
      .from("tache")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      logger.error("Error deleting task", deleteError, { taskId });
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingTask.organization_id,
      action: "TASK_DELETED",
      description: `Deleted task: ${existingTask.nom} from project: ${existingTask.projet?.nom || "Unknown"}`,
      metadata: { task_id: taskId },
    });

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error in DELETE /api/tasks/[taskId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
