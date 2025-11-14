// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import type { CreateMilestoneRequest } from "@/types/milestones";
import {
  transformMilestone,
  transformMilestoneUser,
} from "@/utils/milestone-transformers";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/projects/[projectId]/milestones
 * Get all milestones for a project with optional filtering
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

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projet")
      .select("id, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe") === "true";
    const startDateFrom = searchParams.get("startDateFrom");
    const startDateTo = searchParams.get("startDateTo");
    const dueDateFrom = searchParams.get("dueDateFrom");
    const dueDateTo = searchParams.get("dueDateTo");

    // Build query for milestones
    let query = supabase
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
        { count: "exact" },
      )
      .eq("projet_id", projectId);

    // Apply filters
    if (status) {
      const statuses = status.split(",");
      query = query.in("status", statuses);
    }

    if (priority) {
      const priorities = priority.split(",");
      query = query.in("priority", priorities);
    }

    if (startDateFrom) {
      query = query.gte("start_date", startDateFrom);
    }

    if (startDateTo) {
      query = query.lte("start_date", startDateTo);
    }

    if (dueDateFrom) {
      query = query.gte("due_date", dueDateFrom);
    }

    if (dueDateTo) {
      query = query.lte("due_date", dueDateTo);
    }

    // Order by start date
    query = query.order("start_date", { ascending: true });

    const { data: milestones, error: milestonesError, count } = await query;

    if (milestonesError) {
      console.error("Error fetching milestones:", milestonesError);
      return NextResponse.json(
        { error: "Failed to fetch milestones" },
        { status: 500 },
      );
    }

    // Get progress data for all milestones
    const milestoneIds = milestones?.map((m: any) => m.id) || [];
    let progressData: Record<string, any> = {};

    if (milestoneIds.length > 0) {
      const { data: progress } = await supabase
        .from("milestone_progress_view")
        .select("*")
        .in("milestone_id", milestoneIds);

      progressData = (progress || []).reduce(
        (acc: any, p: any) => {
          acc[p.milestone_id] = p;
          return acc;
        },
        {} as Record<string, any>,
      );
    }

    // Transform and enrich milestones
    let transformedMilestones = (milestones || []).map((milestone: any) => {
      const transformed = transformMilestone(
        milestone,
        progressData[(milestone as any).id],
      );

      // Add assignments
      if (milestone.assignments) {
        transformed.assignments = milestone.assignments.map((a: any) => ({
          id: a.id,
          milestoneId: (milestone as any).id,
          userId: a.user.id,
          role: a.role,
          createdAt: a.created_at,
          user: transformMilestoneUser(a.user),
        }));
      }

      // Add dependencies (milestones this one depends on)
      if (milestone.dependencies) {
        transformed.dependencies = milestone.dependencies.map((d: any) => ({
          id: d.id,
          milestoneId: (milestone as any).id,
          dependsOnMilestoneId: d.depends_on_milestone_id,
          dependencyType: d.dependency_type,
          lagDays: d.lag_days,
          createdAt: d.created_at,
        }));
      }

      // Add dependents (milestones that depend on this one)
      if (milestone.dependents) {
        transformed.dependents = milestone.dependents.map((d: any) => ({
          id: d.id,
          milestoneId: d.milestone_id,
          dependsOnMilestoneId: (milestone as any).id,
          dependencyType: d.dependency_type,
          lagDays: d.lag_days,
          createdAt: d.created_at,
        }));
      }

      return transformed;
    });

    // Filter by assignedToMe if needed
    if (assignedToMe) {
      transformedMilestones = transformedMilestones.filter((m: any) =>
        m.assignments?.some((a: any) => a.userId === user.id),
      );
    }

    return NextResponse.json({
      data: transformedMilestones,
      total: assignedToMe ? transformedMilestones.length : count || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/projects/[projectId]/milestones:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/milestones
 * Create a new milestone in a project
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
      .select("id, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse request body
    const body: CreateMilestoneRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (body.name.length > 255) {
      return NextResponse.json(
        { error: "Name must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 },
      );
    }

    if (!body.dueDate) {
      return NextResponse.json(
        { error: "Due date is required" },
        { status: 400 },
      );
    }

    // Validate date range
    const startDate = new Date(body.startDate);
    const dueDate = new Date(body.dueDate);

    if (startDate > dueDate) {
      return NextResponse.json(
        { error: "Start date must be before or equal to due date" },
        { status: 400 },
      );
    }

    // Validate color format if provided
    if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return NextResponse.json(
        { error: "Color must be a valid hex code (e.g., #3B82F6)" },
        { status: 400 },
      );
    }

    // Validate progress percentage if manual mode
    if (
      body.progressMode === "manual" &&
      body.progressPercentage !== undefined
    ) {
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

    // Create milestone - need to add project_id
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .insert({
        organization_id: project.organization_id,
        projet_id: projectId,
        name: body.name.trim(),
        description: body.description?.trim(),
        start_date: body.startDate,
        due_date: body.dueDate,
        status: body.status || "not_started",
        priority: body.priority || "medium",
        color: body.color,
        progress_mode: body.progressMode || "auto",
        progress_percentage: body.progressPercentage || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (milestoneError) {
      console.error("Error creating milestone:", milestoneError);
      return NextResponse.json(
        { error: "Failed to create milestone" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: project.organization_id,
      action: "MILESTONE_CREATED",
      description: `Created milestone: ${(milestone as any).name}`,
      metadata: { milestone_id: (milestone as any).id, project_id: projectId },
    });

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
        )
      `,
      )
      .eq("id", (milestone as any).id)
      .single();

    // Get progress data
    const { data: progressData } = await supabase
      .from("milestone_progress_view")
      .select("*")
      .eq("milestone_id", (milestone as any).id)
      .single();

    // Transform response
    const transformed = transformMilestone(completeMilestone, progressData);

    if (completeMilestone.assignments) {
      transformed.assignments = completeMilestone.assignments.map((a: any) => ({
        id: a.id,
        milestoneId: (milestone as any).id,
        userId: a.user.id,
        role: a.role,
        createdAt: a.created_at,
        user: transformMilestoneUser(a.user),
      }));
    }

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/projects/[projectId]/milestones:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
