// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { notifyProjectDeleted } from "@/lib/notifications";

/**
 * GET /api/projects/[projectId]
 * Get a single project by ID
 */
export async function GET(
  _request: NextRequest,
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

    // Fetch project from projet table
    const { data: project, error: projectError } = await supabase
      .from("projet")
      .select("*")
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

    return NextResponse.json({ data: transformed });
  } catch (error) {
    logger.error("Error in GET /api/projects/[projectId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/projects/[projectId]
 * Update a project
 */
export async function PATCH(
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

    // Get existing project to verify access
    const { data: existingProject, error: fetchError } = await supabase
      .from("projet")
      .select("organization_id, nom")
      .eq("id", projectId)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user has access to this project's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", existingProject.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to update this project" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update object with snake_case
    const updateData: any = {};
    if (body.nom !== undefined) updateData.nom = body.nom.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim();
    if (body.statut !== undefined) updateData.statut = body.statut;
    if (body.clientId !== undefined) updateData.client_id = body.clientId;
    if (body.chefProjetId !== undefined)
      updateData.chef_projet_id = body.chefProjetId;
    if (body.dateDebut !== undefined) updateData.date_debut = body.dateDebut;
    if (body.dateFinPrevue !== undefined)
      updateData.date_fin_prevue = body.dateFinPrevue;
    if (body.budgetInitial !== undefined)
      updateData.budget_initial = body.budgetInitial;

    // Update project
    const { data: project, error: updateError } = await supabase
      .from("projet")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating project", updateError, { projectId });
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingProject.organization_id,
      action: "PROJECT_UPDATED",
      description: `Updated project: ${existingProject.nom}`,
      metadata: { projet_id: projectId },
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

    return NextResponse.json({ data: transformed });
  } catch (error) {
    logger.error("Error in PATCH /api/projects/[projectId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete a project
 */
export async function DELETE(
  _request: NextRequest,
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

    // Get existing project to verify access and notify on deletion
    const { data: existingProject, error: fetchError } = await supabase
      .from("projet")
      .select("organization_id, nom, chef_projet_id")
      .eq("id", projectId)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get team members assigned to this project
    const { data: affectations } = await supabase
      .from("affectation")
      .select("profile_id")
      .eq("projet_id", projectId);

    const teamMemberIds = affectations?.map((a) => a.profile_id) || [];

    // Verify user has admin access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", existingProject.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to delete this project" },
        { status: 403 },
      );
    }

    // Only ADMIN and OWNER can delete projects
    if (!["ADMIN", "OWNER"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete project" },
        { status: 403 },
      );
    }

    // Delete project (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("projet")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      logger.error("Error deleting project", deleteError, { projectId });
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: existingProject.organization_id,
      action: "PROJECT_DELETED",
      description: `Deleted project: ${existingProject.nom}`,
      metadata: { projet_id: projectId },
    });

    // Send notification for project deletion
    await notifyProjectDeleted({
      projectId: projectId,
      projectName: existingProject.nom,
      projectManagerId: existingProject.chef_projet_id,
      teamMemberIds: teamMemberIds,
      organizationId: existingProject.organization_id,
      deleterId: user.id,
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error in DELETE /api/projects/[projectId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
