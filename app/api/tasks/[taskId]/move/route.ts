// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { moveTaskSchema } from "@/utils/validators/task-validators";

/**
 * POST /api/tasks/[taskId]/move
 * Move a task to a new column/status and position (for Kanban drag & drop)
 */
export async function POST(
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
      .select("id, nom, organization_id, statut, position")
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
        { error: "Not authorized to move this task" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log("Move task request body:", JSON.stringify(body), "for task:", taskId);

    // Validate with safeParse to get better error messages
    const validation = moveTaskSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", JSON.stringify({
        errors: validation.error.errors,
        body: body,
        taskId: taskId
      }, null, 2));
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.errors,
          receivedData: body
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;
    console.log("Validated data:", JSON.stringify(validatedData));

    // Update task status and position
    const { data: task, error: updateError } = await supabase
      .from("tache")
      .update({
        statut: validatedData.statut,
        position: validatedData.position,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) {
      console.error("Error moving task:", updateError, "Task ID:", taskId, "Data:", {
        statut: validatedData.statut,
        position: validatedData.position,
      });
      return NextResponse.json(
        { error: "Failed to move task", details: updateError.message },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingTask.organization_id,
      action: "TASK_MOVED",
      description: `Moved task: ${existingTask.nom} from ${existingTask.statut} to ${validatedData.statut}`,
      metadata: {
        task_id: taskId,
        old_statut: existingTask.statut,
        new_statut: validatedData.statut,
        old_position: existingTask.position,
        new_position: validatedData.position,
      },
    });

    return NextResponse.json(
      {
        message: "Task moved successfully",
        data: {
          id: task.id,
          statut: task.statut,
          position: task.position,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      console.error("Validation error in /api/tasks/[taskId]/move:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error in POST /api/tasks/[taskId]/move:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    );
  }
}
