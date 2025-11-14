// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import type { UpdateMilestoneRequest } from "@/types/milestones";
import {
  transformMilestone,
  transformMilestoneForUpdate,
} from "@/utils/milestone-transformers";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { notifyMilestoneCompleted, notifyMilestoneDeleted } from "@/lib/notifications";

/**
 * GET /api/milestones/[id]
 * Get a single milestone by ID with all relations
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

    // Fetch milestone with all relations
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select(
        `
        *,
        created_by_user:profiles!milestones_created_by_fkey(id, email, nom, prenom, avatar_url),
        assignments:milestone_assignments(
          id,
          role,
          created_at,
          user:profiles(id, email, nom, prenom, avatar_url)
        ),
        dependencies:milestone_dependencies!milestone_dependencies_milestone_id_fkey(
          id,
          depends_on_milestone_id,
          dependency_type,
          lag_days,
          created_at,
          depends_on_milestone:milestones!milestone_dependencies_depends_on_milestone_id_fkey(
            id,
            name,
            start_date,
            due_date,
            status,
            priority,
            color
          )
        ),
        dependents:milestone_dependencies!milestone_dependencies_depends_on_milestone_id_fkey(
          id,
          milestone_id,
          dependency_type,
          lag_days,
          created_at,
          milestone:milestones!milestone_dependencies_milestone_id_fkey(
            id,
            name,
            start_date,
            due_date,
            status,
            priority,
            color
          )
        ),
        tasks:milestone_tasks(
          id,
          weight,
          created_at,
          tache:tache(
            id,
            nom,
            description,
            statut,
            date_fin_cible,
            created_at
          )
        )
      `,
      )
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this milestone's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", (milestone as any).organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this milestone" },
        { status: 403 },
      );
    }

    // Get progress data
    const { data: progressData } = await supabase
      .from("milestone_progress_view")
      .select("*")
      .eq("milestone_id", milestoneId)
      .single();

    // Transform response
    const transformed: any = transformMilestone(milestone, progressData);

    // Add created_by user
    if (milestone.created_by_user) {
      transformed.createdByUser = {
        id: milestone.created_by_user.id,
        email: milestone.created_by_user.email,
        nom: milestone.created_by_user.nom,
        prenom: milestone.created_by_user.prenom,
        avatarUrl: milestone.created_by_user.avatar_url,
      };
    }

    // Add assignments
    if (milestone.assignments) {
      transformed.assignments = milestone.assignments.map((a: any) => ({
        id: a.id,
        milestoneId: (milestone as any).id,
        userId: a.user.id,
        role: a.role,
        createdAt: a.created_at,
        user: {
          id: a.user.id,
          email: a.user.email,
          nom: a.user.nom,
          prenom: a.user.prenom,
          avatarUrl: a.user.avatar_url,
        },
      }));
    }

    // Add dependencies with milestone details
    if (milestone.dependencies) {
      transformed.dependencies = milestone.dependencies.map((d: any) => ({
        id: d.id,
        milestoneId: (milestone as any).id,
        dependsOnMilestoneId: d.depends_on_milestone_id,
        dependencyType: d.dependency_type,
        lagDays: d.lag_days,
        createdAt: d.created_at,
        dependsOnMilestone: d.depends_on_milestone
          ? {
              id: (d.depends_on_milestone as any).id,
              name: (d.depends_on_milestone as any).name,
              startDate: d.depends_on_milestone.start_date,
              dueDate: d.depends_on_milestone.due_date,
              status: d.depends_on_milestone.status,
              priority: d.depends_on_milestone.priority,
              color: d.depends_on_milestone.color,
            }
          : undefined,
      }));
    }

    // Add dependents with milestone details
    if (milestone.dependents) {
      transformed.dependents = milestone.dependents.map((d: any) => ({
        id: d.id,
        milestoneId: d.milestone_id,
        dependsOnMilestoneId: (milestone as any).id,
        dependencyType: d.dependency_type,
        lagDays: d.lag_days,
        createdAt: d.created_at,
        milestone: d.milestone
          ? {
              id: (d.milestone as any).id,
              name: (d.milestone as any).name,
              startDate: d.milestone.start_date,
              dueDate: d.milestone.due_date,
              status: d.milestone.status,
              priority: d.milestone.priority,
              color: d.milestone.color,
            }
          : undefined,
      }));
    }

    // Add tasks (linked taches)
    if (milestone.tasks) {
      transformed.tasks = milestone.tasks.map((t: any) => ({
        id: t.id,
        milestoneId: (milestone as any).id,
        tacheId: t.tache.id,
        weight: t.weight,
        createdAt: t.created_at,
        tache: {
          id: t.tache.id,
          nom: t.tache.nom,
          description: t.tache.description,
          statut: t.tache.statut,
          dateFinCible: t.tache.date_fin_cible,
          createdAt: t.tache.created_at,
        },
      }));
    }

    return NextResponse.json({ data: transformed });
  } catch (error) {
    logger.error("Error in GET /api/milestones/[id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/milestones/[id]
 * Update a milestone
 */
export async function PATCH(
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

    // Get existing milestone to verify access and track status changes
    const { data: existingMilestone, error: fetchError } = await supabase
      .from("milestones")
      .select("organization_id, name, status, project_id")
      .eq("id", milestoneId)
      .single();

    if (fetchError || !existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this milestone's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", existingMilestone.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to update this milestone" },
        { status: 403 },
      );
    }

    // Parse request body
    const body: UpdateMilestoneRequest = await request.json();

    // Validate name if provided
    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 },
        );
      }

      if (body.name.length > 255) {
        return NextResponse.json(
          { error: "Name must be less than 255 characters" },
          { status: 400 },
        );
      }
    }

    // Validate date range if dates are provided
    if (body.startDate || body.dueDate) {
      // Get current dates if not in update
      const { data: currentMilestone } = await supabase
        .from("milestones")
        .select("start_date, due_date")
        .eq("id", milestoneId)
        .single();

      const startDate = new Date(
        body.startDate || currentMilestone?.start_date,
      );
      const dueDate = new Date(body.dueDate || currentMilestone?.due_date);

      if (startDate > dueDate) {
        return NextResponse.json(
          { error: "Start date must be before or equal to due date" },
          { status: 400 },
        );
      }
    }

    // Validate color format if provided
    if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return NextResponse.json(
        { error: "Color must be a valid hex code (e.g., #3B82F6)" },
        { status: 400 },
      );
    }

    // Validate progress percentage if provided
    if (body.progressPercentage !== undefined) {
      if (
        body.progressPercentage < 0 ||
        body.progressPercentage > 100 ||
        !Number.isInteger(body.progressPercentage)
      ) {
        return NextResponse.json(
          { error: "Progress percentage must be an integer between 0 and 100" },
          { status: 400 },
        );
      }
    }

    // Transform update data
    const updateData = transformMilestoneForUpdate({
      name: body.name?.trim(),
      description: body.description?.trim(),
      startDate: body.startDate,
      dueDate: body.dueDate,
      status: body.status,
      priority: body.priority,
      color: body.color,
      progressMode: body.progressMode,
      progressPercentage: body.progressPercentage,
    });

    // Update milestone
    const { data: milestone, error: updateError } = await supabase
      .from("milestones")
      .update(updateData)
      .eq("id", milestoneId)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating milestone", updateError, { milestoneId });
      return NextResponse.json(
        { error: "Failed to update milestone" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingMilestone.organization_id,
      action: "MILESTONE_UPDATED",
      description: `Updated milestone: ${existingMilestone.name}`,
      metadata: { milestone_id: milestoneId },
    });

    // Send notification if milestone was marked as completed
    if (
      existingMilestone.status !== "completed" &&
      milestone.status === "completed"
    ) {
      await notifyMilestoneCompleted({
        milestoneId: milestoneId,
        milestoneName: existingMilestone.name,
        organizationId: existingMilestone.organization_id,
        projectId: existingMilestone.project_id || undefined,
      });
    }

    // Fetch complete milestone with relations
    const { data: completeMilestone } = await supabase
      .from("milestones")
      .select(
        `
        *,
        created_by_user:profiles!milestones_created_by_fkey(id, email, nom, prenom, avatar_url),
        assignments:milestone_assignments(
          id,
          role,
          created_at,
          user:profiles(id, email, nom, prenom, avatar_url)
        ),
        dependencies:milestone_dependencies!milestone_dependencies_milestone_id_fkey(
          id,
          depends_on_milestone_id,
          dependency_type,
          lag_days,
          created_at
        ),
        dependents:milestone_dependencies!milestone_dependencies_depends_on_milestone_id_fkey(
          id,
          milestone_id,
          dependency_type,
          lag_days,
          created_at
        )
      `,
      )
      .eq("id", milestoneId)
      .single();

    // Get progress data
    const { data: progressData } = await supabase
      .from("milestone_progress_view")
      .select("*")
      .eq("milestone_id", milestoneId)
      .single();

    // Transform response
    const transformed: any = transformMilestone(completeMilestone, progressData);

    if (completeMilestone.created_by_user) {
      transformed.createdByUser = {
        id: completeMilestone.created_by_user.id,
        email: completeMilestone.created_by_user.email,
        nom: completeMilestone.created_by_user.nom,
        prenom: completeMilestone.created_by_user.prenom,
        avatarUrl: completeMilestone.created_by_user.avatar_url,
      };
    }

    if (completeMilestone.assignments) {
      transformed.assignments = completeMilestone.assignments.map((a: any) => ({
        id: a.id,
        milestoneId: milestoneId,
        userId: a.user.id,
        role: a.role,
        createdAt: a.created_at,
        user: {
          id: a.user.id,
          email: a.user.email,
          nom: a.user.nom,
          prenom: a.user.prenom,
          avatarUrl: a.user.avatar_url,
        },
      }));
    }

    if (completeMilestone.dependencies) {
      transformed.dependencies = completeMilestone.dependencies.map(
        (d: any) => ({
          id: d.id,
          milestoneId: milestoneId,
          dependsOnMilestoneId: d.depends_on_milestone_id,
          dependencyType: d.dependency_type,
          lagDays: d.lag_days,
          createdAt: d.created_at,
        }),
      );
    }

    if (completeMilestone.dependents) {
      transformed.dependents = completeMilestone.dependents.map((d: any) => ({
        id: d.id,
        milestoneId: d.milestone_id,
        dependsOnMilestoneId: milestoneId,
        dependencyType: d.dependency_type,
        lagDays: d.lag_days,
        createdAt: d.created_at,
      }));
    }

    return NextResponse.json({ data: transformed });
  } catch (error) {
    logger.error("Error in PATCH /api/milestones/[id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/milestones/[id]
 * Delete a milestone
 */
export async function DELETE(
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

    // Get existing milestone to verify access and notify on deletion
    const { data: existingMilestone, error: fetchError } = await supabase
      .from("milestones")
      .select(
        `
        organization_id,
        name,
        project_id,
        assignments:milestone_assignments(user_id)
      `,
      )
      .eq("id", milestoneId)
      .single();

    if (fetchError || !existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this milestone's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", existingMilestone.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to delete this milestone" },
        { status: 403 },
      );
    }

    // Only ADMIN and OWNER can delete milestones
    if (!["ADMIN", "OWNER"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete milestone" },
        { status: 403 },
      );
    }

    // Delete milestone (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("milestones")
      .delete()
      .eq("id", milestoneId);

    if (deleteError) {
      logger.error("Error deleting milestone", deleteError, { milestoneId });
      return NextResponse.json(
        { error: "Failed to delete milestone" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingMilestone.organization_id,
      action: "MILESTONE_DELETED",
      description: `Deleted milestone: ${existingMilestone.name}`,
      metadata: { milestone_id: milestoneId },
    });

    // Send notification for milestone deletion
    const assignedUserIds =
      existingMilestone.assignments?.map((a: any) => a.user_id) || [];
    await notifyMilestoneDeleted({
      milestoneId: milestoneId,
      milestoneName: existingMilestone.name,
      assignedUserIds: assignedUserIds,
      projectId: existingMilestone.project_id || undefined,
      organizationId: existingMilestone.organization_id,
      deleterId: user.id,
    });

    return NextResponse.json(
      { message: "Milestone deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error in DELETE /api/milestones/[id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
