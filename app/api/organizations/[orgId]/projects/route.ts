import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/organizations/[orgId]/projects
 * List all projects in an organization
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const orgId = resolvedParams.orgId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this organization" },
        { status: 403 },
      );
    }

    // Fetch projects from projet table
    const { data: projects, error } = await supabase
      .from("projet")
      .select(`
        *,
        client:client_id (
          id,
          nom
        ),
        chef_projet:chef_projet_id (
          id,
          nom,
          prenom,
          email
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformed = (projects || []).map((p: any) => ({
      id: p.id,
      orgId: p.organization_id,
      nom: p.nom,
      description: p.description,
      clientId: p.client_id,
      chefProjetId: p.chef_projet_id,
      dateDebut: p.date_debut,
      dateFinPrevue: p.date_fin_prevue,
      statut: p.statut,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      // Nested relations
      client: p.client
        ? {
            id: p.client.id,
            nom: p.client.nom,
          }
        : null,
      chefProjet: p.chef_projet
        ? {
            id: p.chef_projet.id,
            nom: p.chef_projet.nom,
            prenom: p.chef_projet.prenom,
            email: p.chef_projet.email,
          }
        : null,
    }));

    return NextResponse.json({
      data: transformed,
      total: transformed.length,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/organizations/[orgId]/projects:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/organizations/[orgId]/projects
 * Create a new project in an organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const orgId = resolvedParams.orgId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has admin/owner access
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Not authorized to create projects" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Insert project into projet table
    const { data: project, error: insertError } = await supabase
      .from("projet")
      .insert({
        organization_id: orgId,
        nom: body.nom,
        description: body.description || null,
        client_id: body.clientId || null,
        chef_projet_id: body.chefProjetId || null,
        date_debut: body.dateDebut || null,
        date_fin_prevue: body.dateFinPrevue || null,
        statut: body.statut || "EN_COURS",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating project:", insertError);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "PROJECT_CREATED",
      description: `Created project: ${project.nom}`,
      metadata: { project_id: project.id },
    });

    // Transform to camelCase
    const transformed = {
      id: project.id,
      orgId: project.organization_id,
      nom: project.nom,
      description: project.description,
      clientId: project.client_id,
      chefProjetId: project.chef_projet_id,
      dateDebut: project.date_debut,
      dateFinPrevue: project.date_fin_prevue,
      statut: project.statut,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    console.error(
      "Error in POST /api/organizations/[orgId]/projects:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
