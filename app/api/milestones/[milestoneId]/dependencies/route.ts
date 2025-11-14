// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import type { AddDependencyRequest } from "@/types/milestones";
import {
  hasCircularDependency,
  transformDependencyForInsert,
  transformMilestoneDependency,
} from "@/utils/milestone-transformers";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * POST /api/milestones/[id]/dependencies
 * Add a dependency to a milestone
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
    const body: AddDependencyRequest = await request.json();

    // Validate required fields
    if (!body.dependsOnMilestoneId) {
      return NextResponse.json(
        { error: "dependsOnMilestoneId is required" },
        { status: 400 },
      );
    }

    if (!body.dependencyType) {
      return NextResponse.json(
        { error: "dependencyType is required" },
        { status: 400 },
      );
    }

    // Validate dependency type
    const validTypes = [
      "finish_to_start",
      "start_to_start",
      "finish_to_finish",
      "start_to_finish",
    ];
    if (!validTypes.includes(body.dependencyType)) {
      return NextResponse.json(
        { error: "Invalid dependency type" },
        { status: 400 },
      );
    }

    // Check for self-dependency
    if (milestoneId === body.dependsOnMilestoneId) {
      return NextResponse.json(
        { error: "A milestone cannot depend on itself" },
        { status: 400 },
      );
    }

    // Verify depends-on milestone exists and is in same organization
    const { data: dependsOnMilestone, error: dependsOnError } = await supabase
      .from("milestones")
      .select("organization_id")
      .eq("id", body.dependsOnMilestoneId)
      .single();

    if (dependsOnError || !dependsOnMilestone) {
      return NextResponse.json(
        { error: "Dependency milestone not found" },
        { status: 404 },
      );
    }

    if (dependsOnMilestone.organization_id !== (milestone as any).organization_id) {
      return NextResponse.json(
        { error: "Dependencies must be within the same organization" },
        { status: 400 },
      );
    }

    // Check for circular dependencies
    const { data: allMilestones } = await supabase
      .from("milestones")
      .select(
        `
        *,
        dependencies:milestone_dependencies!milestone_dependencies_milestone_id_fkey(*)
      `,
      )
      .eq("organization_id", (milestone as any).organization_id);

    // Simulate adding the new dependency
    const simulatedMilestones = allMilestones?.map((m: any) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          dependencies: [
            ...(m.dependencies || []),
            {
              milestone_id: milestoneId,
              depends_on_milestone_id: body.dependsOnMilestoneId,
            },
          ],
        };
      }
      return m;
    });

    if (
      simulatedMilestones &&
      hasCircularDependency(
        simulatedMilestones.map((m: any) => ({
          id: m.id,
          dependencies: m.dependencies?.map((d: any) => ({
            id: d.id,
            milestoneId: d.milestone_id,
            dependsOnMilestoneId: d.depends_on_milestone_id,
            dependencyType: d.dependency_type,
            lagDays: d.lag_days || 0,
            createdAt: d.created_at,
          })),
        })),
        milestoneId,
        body.dependsOnMilestoneId,
      )
    ) {
      return NextResponse.json(
        { error: "This dependency would create a circular reference" },
        { status: 400 },
      );
    }

    // Transform and insert dependency
    const dependencyData = transformDependencyForInsert({
      milestoneId,
      dependsOnMilestoneId: body.dependsOnMilestoneId,
      dependencyType: body.dependencyType,
      lagDays: body.lagDays,
    });

    const { data: dependency, error: insertError } = await supabase
      .from("milestone_dependencies")
      .insert(dependencyData)
      .select()
      .single();

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This dependency already exists" },
          { status: 400 },
        );
      }

      console.error("Error adding dependency:", insertError);
      return NextResponse.json(
        { error: "Failed to add dependency" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (milestone as any).organization_id,
      action: "MILESTONE_DEPENDENCY_ADDED",
      description: `Added dependency to milestone: ${(milestone as any).name}`,
      metadata: { milestone_id: milestoneId, dependency_id: dependency.id },
    });

    // Transform response
    const transformed = transformMilestoneDependency(dependency);

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/milestones/[id]/dependencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/milestones/[id]/dependencies
 * Remove a dependency from a milestone
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

    // Get dependency ID from query params
    const dependencyId = request.nextUrl.searchParams.get("dependencyId");

    if (!dependencyId) {
      return NextResponse.json(
        { error: "dependencyId query parameter is required" },
        { status: 400 },
      );
    }

    // Get existing dependency to verify ownership
    const { data: dependency, error: depError } = await supabase
      .from("milestone_dependencies")
      .select("milestone_id")
      .eq("id", dependencyId)
      .eq("milestone_id", milestoneId)
      .single();

    if (depError || !dependency) {
      return NextResponse.json(
        { error: "Dependency not found" },
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

    // Delete dependency
    const { error: deleteError } = await supabase
      .from("milestone_dependencies")
      .delete()
      .eq("id", dependencyId);

    if (deleteError) {
      console.error("Error deleting dependency:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete dependency" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (milestone as any).organization_id,
      action: "MILESTONE_DEPENDENCY_REMOVED",
      description: `Removed dependency from milestone: ${(milestone as any).name}`,
      metadata: { milestone_id: milestoneId, dependency_id: dependencyId },
    });

    return NextResponse.json(
      { message: "Dependency removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/milestones/[id]/dependencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
