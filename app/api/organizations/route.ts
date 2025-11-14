import { type NextRequest, NextResponse } from "next/server";
import { createOrgRateLimiter, generalRateLimiter } from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { withUserRateLimit } from "@/utils/with-rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/organizations
 *
 * Get all organizations for the authenticated user
 *
 * Rate limit: 100 requests per minute per user
 */
const getHandler = async (_request: NextRequest) => {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's organizations with their role
    const { data, error } = await supabase
      .from("user_organizations")
      .select(
        `
        role,
        created_at,
        organizations (
          id,
          name,
          slug,
          description,
          logo_url,
          website,
          created_at,
          updated_at
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching organizations", error, { userId: user.id });
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 },
      );
    }

    // Format response
    const organizations =
      data?.map((item: any) => ({
        id: item.organizations.id,
        name: item.organizations.name,
        slug: item.organizations.slug,
        description: item.organizations.description,
        image: item.organizations.logo_url,
        website: item.organizations.website,
        role: item.role,
        joinedAt: item.created_at,
        createdAt: item.organizations.created_at,
        updatedAt: item.organizations.updated_at,
      })) || [];

    return NextResponse.json({ organizations });
  } catch (error) {
    logger.error("Error in GET /api/organizations", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

/**
 * POST /api/organizations
 *
 * Create a new organization
 *
 * Rate limit: 3 requests per hour per user
 */
const postHandler = async (request: NextRequest) => {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, description, website } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    // Generate slug if not provided
    const orgSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 400 },
      );
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug: orgSlug,
        description,
        website,
      })
      .select()
      .single();

    if (orgError) {
      logger.error("Error creating organization", orgError, { name, slug: orgSlug });
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 },
      );
    }

    // Add user as admin (organization creator)
    const { error: memberError } = await supabase
      .from("user_organizations")
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: "ADMIN",
      });

    if (memberError) {
      logger.error("Error adding user to organization", memberError, {
        userId: user.id,
        organizationId: org.id
      });
      // Try to rollback org creation
      await supabase.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { error: "Failed to create organization membership" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: org.id,
      action: "ORG_CREATED",
      description: `Created organization: ${org.name}`,
    });

    // Format response
    const organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      image: org.logo_url,
      website: org.website,
      role: "ADMIN",
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    logger.error("Error in POST /api/organizations", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const GET = withUserRateLimit(getHandler, generalRateLimiter, false);
export const POST = withUserRateLimit(postHandler, createOrgRateLimiter, true);
