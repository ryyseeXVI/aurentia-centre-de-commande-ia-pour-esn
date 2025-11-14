// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { notifyProjectCreated, notifyProjectDeleted } from "@/lib/notifications";

/**
 * GET /api/projects
 * List all projects categorized by user relationship
 * Returns: { data: { myProjets, managedProjets, otherProjets } }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId parameter is required" },
        { status: 400 },
      );
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to view projects in this organization" },
        { status: 403 },
      );
    }

    // Get all projects for this organization
    const { data: allProjects, error: projectsError } = await supabase
      .from("projet")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (projectsError) {
      logger.error("Error fetching projects", projectsError, { organizationId, userId: user.id });
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 },
      );
    }

    // Get user's project assignments (affectations)
    const { data: affectations, error: affectationsError } = await supabase
      .from("affectation")
      .select("projet_id")
      .eq("profile_id", user.id)
      .eq("organization_id", organizationId);

    if (affectationsError) {
      logger.error("Error fetching affectations", affectationsError, { organizationId, userId: user.id });
    }

    // Create set of project IDs where user is assigned
    const assignedProjectIds = new Set(affectations?.map(a => a.projet_id) || []);

    // Categorize projects
    const myProjets: any[] = [];
    const managedProjets: any[] = [];
    const otherProjets: any[] = [];

    allProjects?.forEach(project => {
      if (project.chef_projet_id === user.id) {
        // User is the project manager
        myProjets.push(project);
      } else if (assignedProjectIds.has(project.id)) {
        // User is assigned to the project but not the manager
        managedProjets.push(project);
      } else {
        // Other projects in the organization
        otherProjets.push(project);
      }
    });

    return NextResponse.json({
      data: {
        myProjets,
        managedProjets,
        otherProjets,
      },
    });
  } catch (error) {
    logger.error("Error in GET /api/projects", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    if (!body.nom || body.nom.trim().length === 0) {
      return NextResponse.json({ error: "nom is required" }, { status: 400 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", body.organizationId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to create projects in this organization" },
        { status: 403 },
      );
    }

    // Create project in projet table
    const { data: project, error: insertError } = await supabase
      .from("projet")
      .insert({
        organization_id: body.organizationId,
        nom: body.nom.trim(),
        description: body.description?.trim(),
        statut: body.statut || "ACTIF",
        client_id: body.clientId,
        chef_projet_id: body.chefProjetId || user.id,
        date_debut: body.dateDebut,
        date_fin_prevue: body.dateFinPrevue,
        budget_initial: body.budgetInitial,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Error creating project", insertError, { organizationId: body.organizationId, userId: user.id });
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: body.organizationId,
      action: "PROJECT_CREATED",
      description: `Created project: ${project.nom}`,
      metadata: { projet_id: project.id },
    });

    // Send notification for project creation
    await notifyProjectCreated({
      projectId: project.id,
      projectName: project.nom,
      projectManagerId: project.chef_projet_id,
      organizationId: body.organizationId,
      creatorId: user.id,
    });

    // Transform to camelCase
    const transformed = {
      id: project.id,
      organizationId: project.organization_id,
      nom: project.nom,
      description: project.description,
      statut: project.statut,
      clientId: project.client_id,
      chefProjetId: project.chef_projet_id,
      dateDebut: project.date_debut,
      dateFinPrevue: project.date_fin_prevue,
      budgetInitial: project.budget_initial,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    logger.error("Error in POST /api/projects", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
