import { type NextRequest, NextResponse } from "next/server";
import type { LinkTasksRequest } from "@/types/milestones";
import { transformMilestoneTask } from "@/utils/milestone-transformers";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * POST /api/milestones/[id]/tasks
 * Link tasks (taches) to a milestone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const milestoneId = resolvedParams.milestoneId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get existing milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select("organization_id, name")
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", milestone.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to modify this milestone" },
        { status: 403 },
      );
    }

    // Parse request body
    const body: any = await request.json();

    // Validate required fields (accept both taskCardIds and tacheIds for compatibility)
    const taskIds = body.taskCardIds || body.tacheIds;

    if (!taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "tacheIds array is required" },
        { status: 400 },
      );
    }

    if (taskIds.length === 0) {
      return NextResponse.json(
        { error: "At least one task ID is required" },
        { status: 400 },
      );
    }

    // Validate weights if provided
    if (body.weights) {
      if (!Array.isArray(body.weights)) {
        return NextResponse.json(
          { error: "weights must be an array" },
          { status: 400 },
        );
      }

      if (body.weights.length !== taskIds.length) {
        return NextResponse.json(
          { error: "weights array must match taskIds array length" },
          { status: 400 },
        );
      }

      if (body.weights.some((w) => w < 1 || !Number.isInteger(w))) {
        return NextResponse.json(
          { error: "All weights must be positive integers" },
          { status: 400 },
        );
      }
    }

    // Verify all tasks exist and belong to same organization
    const { data: tasks, error: tasksError } = await supabase
      .from("tache")
      .select("id, organization_id")
      .in("id", taskIds);

    if (tasksError || !tasks || tasks.length !== taskIds.length) {
      return NextResponse.json(
        { error: "One or more tasks not found" },
        { status: 404 },
      );
    }

    // Verify all tasks belong to the same organization
    const invalidTasks = tasks.filter(
      (t: any) => t.organization_id !== milestone.organization_id,
    );
    if (invalidTasks.length > 0) {
      return NextResponse.json(
        { error: "All tasks must belong to the same organization" },
        { status: 400 },
      );
    }

    // Prepare task links with weights
    const taskLinks = taskIds.map((tacheId, index) => {
      const weight = body.weights ? body.weights[index] : 1;
      return {
        milestone_id: milestoneId,
        tache_id: tacheId,
        weight: weight,
      };
    });

    // Insert task links (using upsert for idempotency)
    const { data: insertedLinks, error: insertError } = await supabase
      .from("milestone_tasks")
      .upsert(taskLinks, {
        onConflict: "milestone_id,tache_id",
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) {
      console.error("Error linking tasks:", insertError);
      return NextResponse.json(
        { error: "Failed to link tasks" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: milestone.organization_id,
      action: "MILESTONE_TASKS_LINKED",
      description: `Linked ${insertedLinks?.length || 0} tasks to milestone: ${milestone.name}`,
      metadata: {
        milestone_id: milestoneId,
        task_count: insertedLinks?.length || 0,
      },
    });

    // Transform response
    const transformed = (insertedLinks || []).map(transformMilestoneTask);

    return NextResponse.json(
      {
        data: {
          linked: transformed.length,
          tasks: transformed,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/milestones/[id]/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/milestones/[id]/tasks
 * Get all tasks linked to a milestone
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const milestoneId = resolvedParams.milestoneId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get milestone to verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select("organization_id")
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", milestone.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to view this milestone" },
        { status: 403 },
      );
    }

    // Get linked tasks with task details
    const { data: taskLinks, error: linksError } = await supabase
      .from("milestone_tasks")
      .select(`
        id,
        milestone_id,
        tache_id,
        weight,
        created_at,
        tache:tache_id (
          id,
          nom,
          statut,
          projet_id,
          organization_id
        )
      `)
      .eq("milestone_id", milestoneId);

    if (linksError) {
      console.error("Error fetching milestone tasks:", linksError);
      return NextResponse.json(
        { error: "Failed to fetch milestone tasks" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformed = (taskLinks || []).map((link: any) => ({
      id: link.id,
      milestoneId: link.milestone_id,
      tacheId: link.tache_id,
      weight: link.weight,
      createdAt: link.created_at,
      tache: link.tache
        ? {
            id: link.tache.id,
            nom: link.tache.nom,
            statut: link.tache.statut,
            projetId: link.tache.projet_id,
            organizationId: link.tache.organization_id,
          }
        : null,
    }));

    return NextResponse.json({ data: transformed }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/milestones/[id]/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/milestones/[id]/tasks
 * Unlink a task from a milestone
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const milestoneId = resolvedParams.milestoneId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get task ID from query params (support both names)
    const tacheId =
      request.nextUrl.searchParams.get("tacheId") ||
      request.nextUrl.searchParams.get("taskCardId");

    if (!tacheId) {
      return NextResponse.json(
        { error: "tacheId query parameter is required" },
        { status: 400 },
      );
    }

    // Get existing milestone task link
    const { data: taskLink, error: linkError } = await supabase
      .from("milestone_tasks")
      .select("id, milestone_id")
      .eq("milestone_id", milestoneId)
      .eq("tache_id", tacheId)
      .single();

    if (linkError || !taskLink) {
      return NextResponse.json(
        { error: "Task link not found" },
        { status: 404 },
      );
    }

    // Get milestone to verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select("organization_id, name")
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", milestone.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to modify this milestone" },
        { status: 403 },
      );
    }

    // Delete task link
    const { error: deleteError } = await supabase
      .from("milestone_tasks")
      .delete()
      .eq("id", taskLink.id);

    if (deleteError) {
      console.error("Error unlinking task:", deleteError);
      return NextResponse.json(
        { error: "Failed to unlink task" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: milestone.organization_id,
      action: "MILESTONE_TASK_UNLINKED",
      description: `Unlinked task from milestone: ${milestone.name}`,
      metadata: { milestone_id: milestoneId, tache_id: tacheId },
    });

    return NextResponse.json(
      { message: "Task unlinked successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/milestones/[id]/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
