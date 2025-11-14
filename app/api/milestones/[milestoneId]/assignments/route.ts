// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import type { AssignUserRequest } from "@/types/milestones";
import {
  transformAssignmentForInsert,
  transformMilestoneAssignment,
  transformMilestoneUser,
} from "@/utils/milestone-transformers";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { notifyMilestoneAssigned } from "@/lib/notifications";

/**
 * POST /api/milestones/[id]/assignments
 * Assign a user to a milestone
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
      .eq("organization_id", (milestone as any).organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to modify this milestone" },
        { status: 403 },
      );
    }

    // Parse request body
    const body: AssignUserRequest = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Validate role if provided
    if (body.role) {
      const validRoles = ["owner", "contributor", "reviewer"];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be: owner, contributor, or reviewer" },
          { status: 400 },
        );
      }
    }

    // Verify user exists and is member of the organization
    const { data: targetUser, error: userError } = await supabase
      .from("user_organizations")
      .select("user_id")
      .eq("user_id", body.userId)
      .eq("organization_id", (milestone as any).organization_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "User not found in this organization" },
        { status: 404 },
      );
    }

    // Transform and insert assignment
    const assignmentData = transformAssignmentForInsert({
      milestoneId,
      userId: body.userId,
      role: body.role,
    });

    const { data: assignment, error: insertError } = await supabase
      .from("milestone_assignments")
      .insert(assignmentData)
      .select(
        `
        *,
        user:profiles(id, email, nom, prenom, avatar_url)
      `,
      )
      .single();

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "User is already assigned to this milestone" },
          { status: 400 },
        );
      }

      console.error("Error assigning user:", insertError);
      return NextResponse.json(
        { error: "Failed to assign user" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (milestone as any).organization_id,
      action: "MILESTONE_USER_ASSIGNED",
      description: `Assigned user to milestone: ${(milestone as any).name}`,
      metadata: { milestone_id: milestoneId, assigned_user_id: body.userId },
    });

    // Send notification for milestone assignment
    await notifyMilestoneAssigned({
      milestoneId: milestoneId,
      milestoneName: (milestone as any).name,
      assigneeId: body.userId,
      role: body.role || "contributor",
      organizationId: (milestone as any).organization_id,
      assignerId: user.id,
    });

    // Transform response
    const transformed = transformMilestoneAssignment(assignment);
    if (assignment.user) {
      transformed.user = transformMilestoneUser(assignment.user);
    }

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/milestones/[id]/assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/milestones/[id]/assignments
 * Remove a user assignment from a milestone
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

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 },
      );
    }

    // Get existing assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("milestone_assignments")
      .select("id, milestone_id")
      .eq("milestone_id", milestoneId)
      .eq("user_id", userId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
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
      .eq("organization_id", (milestone as any).organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to modify this milestone" },
        { status: 403 },
      );
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from("milestone_assignments")
      .delete()
      .eq("id", assignment.id);

    if (deleteError) {
      console.error("Error removing assignment:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove assignment" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (milestone as any).organization_id,
      action: "MILESTONE_USER_UNASSIGNED",
      description: `Removed user assignment from milestone: ${(milestone as any).name}`,
      metadata: { milestone_id: milestoneId, unassigned_user_id: userId },
    });

    return NextResponse.json(
      { message: "Assignment removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/milestones/[id]/assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
