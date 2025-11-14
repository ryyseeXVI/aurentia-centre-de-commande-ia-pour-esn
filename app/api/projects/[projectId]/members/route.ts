// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/projects/[projectId]/members
 * Get all members of the organization that owns this project
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

    // Get project to verify access
    const { data: project, error: projectError } = await supabase
      .from("projet")
      .select("id, organization_id")
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

    // Fetch all organization members
    const { data: members, error: membersError } = await supabase
      .from("user_organizations")
      .select(
        `
        user_id,
        role,
        profiles!user_organizations_user_id_fkey (
          id,
          nom,
          prenom,
          email,
          avatar_url
        )
      `,
      )
      .eq("organization_id", project.organization_id);

    if (membersError) {
      logger.error("Error fetching organization members", membersError, {
        projectId,
        organizationId: project.organization_id,
      });
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 },
      );
    }

    // Transform members to expected format
    const users = members
      .filter((m) => m.profiles) // Filter out any members without profile data
      .map((member) => ({
        id: member.profiles.id,
        name: `${member.profiles.prenom} ${member.profiles.nom}`,
        email: member.profiles.email,
        avatarUrl: member.profiles.avatar_url,
        role: member.role,
      }));

    return NextResponse.json({ data: users });
  } catch (error) {
    logger.error("Error in GET /api/projects/[projectId]/members", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
