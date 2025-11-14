// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/activity
 * Get activity logs for the current user
 * Filters activities to show user-relevant actions across their organizations
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50"),
      100
    );
    const organizationId = searchParams.get("organizationId");

    // Get user's organizations
    const { data: userOrgs } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id);

    const orgIds = userOrgs?.map((uo) => uo.organization_id) || [];

    if (orgIds.length === 0) {
      return NextResponse.json({ data: { activities: [] } });
    }

    // Build query for activity logs
    let query = supabase
      .from("activity_logs")
      .select(
        `
        id,
        user_id,
        organization_id,
        action,
        description,
        resource_type,
        resource_id,
        metadata,
        created_at,
        user:profiles!activity_logs_user_id_fkey (
          id,
          email,
          prenom,
          nom,
          avatar_url
        )
      `
      )
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by specific organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      logger.error("Error fetching activities", activitiesError, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformed = (activities || []).map((activity: any) => ({
      id: activity.id,
      userId: activity.user_id,
      organizationId: activity.organization_id,
      action: activity.action,
      description: activity.description,
      resourceType: activity.resource_type,
      resourceId: activity.resource_id,
      metadata: activity.metadata,
      createdAt: activity.created_at,
      user: activity.user
        ? {
            id: activity.user.id,
            email: activity.user.email,
            prenom: activity.user.prenom,
            nom: activity.user.nom,
            avatarUrl: activity.user.avatar_url,
          }
        : null,
    }));

    return NextResponse.json({
      data: {
        activities: transformed,
      },
    });
  } catch (error) {
    logger.error("Error in GET /api/activity", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
