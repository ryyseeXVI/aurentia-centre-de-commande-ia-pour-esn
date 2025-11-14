// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import type { TaskCardDb } from "@/types/tasks";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { taskForUpdate, taskFromDb } from "@/utils/task-transformers";
import { updateTaskSchema } from "@/utils/validators/task-validators";
import { logger } from "@/lib/logger";
import { notifyTaskReassigned, notifyTaskStatusChanged, notifyTaskDeleted } from "@/lib/notifications";

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
        profiles:profile_responsable_id (
          id,
          nom,
          prenom,
          email
        ),
        projet:projet_id (
          id,
          nom,
          organization_id
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
    if (task.profiles) {
      transformed.consultant = {
        id: task.profiles.id,
        nom: task.profiles.nom,
        prenom: task.profiles.prenom,
        email: task.profiles.email,
      };
    }

    // Add milestone info if exists
    if (task.milestone_tasks && task.milestone_tasks.length > 0) {
      transformed.milestones = task.milestone_tasks
        .filter((mt: any) => mt.milestones) // Only include if milestone data exists
        .map((mt: any) => ({
          id: mt.milestones.id,
          name: mt.milestones.name,
          status: mt.milestones.status,
          color: mt.milestones.color,
          dueDate: mt.milestones.due_date,
        }));
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

    // Get existing task to verify access and track changes
    const { data: existingTask, error: fetchError } = await supabase
      .from("tache")
      .select(
        `
        id,
        nom,
        statut,
        profile_responsable_id,
        projet_id,
        organization_id,
        projet:projet_id (
          nom,
          profile_responsable_id
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
    console.log("PATCH /api/tasks/[taskId] - Request body:", JSON.stringify(body));

    // Use safeParse for better error reporting
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", JSON.stringify(validation.error.errors));
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.errors,
          receivedData: body
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Transform for database update
    const updateData = taskForUpdate(validatedData);
    console.log("Transformed update data for database:", JSON.stringify(updateData));

    // Update task in tache table
    const { data: task, error: updateError } = await supabase
      .from("tache")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating task", updateError, { taskId, updateData });
      console.error("Database update error:", {
        error: updateError,
        taskId,
        updateData,
      });
      return NextResponse.json(
        { error: "Failed to update task", details: updateError.message },
        { status: 500 },
      );
    }

    console.log("Task updated successfully:", task.id);

    // Handle milestone linking if milestoneIds provided
    if (validatedData.milestoneIds !== undefined) {
      // Delete existing milestone links
      await supabase
        .from("milestone_tasks")
        .delete()
        .eq("tache_id", taskId);

      // Insert new milestone links
      if (validatedData.milestoneIds && validatedData.milestoneIds.length > 0) {
        const milestoneLinks = validatedData.milestoneIds.map((milestoneId) => ({
          milestone_id: milestoneId,
          tache_id: taskId,
        }));

        const { error: linkError } = await supabase
          .from("milestone_tasks")
          .insert(milestoneLinks);

        if (linkError) {
          logger.error("Error linking milestones to task", linkError, { taskId, milestoneIds: validatedData.milestoneIds });
        }
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingTask.organization_id,
      action: "TASK_UPDATED",
      description: `Updated task: ${existingTask.nom} in project: ${existingTask.projet?.nom || "Unknown"}`,
      metadata: { task_id: taskId },
    });

    // Send notifications for assignee changes
    const oldAssigneeId = existingTask.profile_responsable_id;
    const newAssigneeId = task.profile_responsable_id;

    if (oldAssigneeId !== newAssigneeId) {
      if (oldAssigneeId && newAssigneeId) {
        // Task was reassigned from one person to another
        await notifyTaskReassigned({
          taskId: task.id,
          taskTitle: task.nom,
          newAssigneeId: newAssigneeId,
          oldAssigneeId: oldAssigneeId,
          projectManagerId: existingTask.projet?.profile_responsable_id || undefined,
          projectId: existingTask.projet_id,
          organizationId: existingTask.organization_id,
          reassignerId: user.id,
        });
      } else if (!oldAssigneeId && newAssigneeId) {
        // Task was assigned for the first time
        await notifyTaskStatusChanged({
          taskId: task.id,
          taskTitle: task.nom,
          oldStatus: existingTask.statut,
          newStatus: task.statut,
          assigneeId: newAssigneeId,
          projectId: existingTask.projet_id,
          organizationId: existingTask.organization_id,
          updaterId: user.id,
        });
      }
    }

    // Send notifications for status changes (separate from assignment)
    if (existingTask.statut !== task.statut && oldAssigneeId === newAssigneeId) {
      await notifyTaskStatusChanged({
        taskId: task.id,
        taskTitle: task.nom,
        oldStatus: existingTask.statut,
        newStatus: task.statut,
        assigneeId: newAssigneeId || undefined,
        projectId: existingTask.projet_id,
        organizationId: existingTask.organization_id,
        updaterId: user.id,
      });
    }

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

    // Get existing task to verify access and notify on deletion
    const { data: existingTask, error: fetchError } = await supabase
      .from("tache")
      .select(
        `
        id,
        nom,
        profile_responsable_id,
        projet_id,
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

    // Send notification for task deletion
    await notifyTaskDeleted({
      taskId: existingTask.id,
      taskTitle: existingTask.nom,
      assigneeId: existingTask.profile_responsable_id || undefined,
      projectId: existingTask.projet_id,
      organizationId: existingTask.organization_id,
      deleterId: user.id,
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
