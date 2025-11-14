// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createOrgRateLimiter, generalRateLimiter } from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { withUserRateLimit } from "@/utils/with-rate-limit";
import { logger } from "@/lib/logger";

/**
 * GET /api/organizations
 *
 * Retrieves all organizations that the authenticated user is a member of.
 *
 * @description
 * Returns a list of organizations with the user's role in each organization.
 * Organizations are sorted by join date (most recent first). Only organizations
 * where the user has an active membership are returned.
 *
 * @authentication Required - User must be authenticated via Supabase Auth
 * @rateLimit 100 requests per minute per user
 *
 * @returns {Promise<NextResponse>} JSON response with organizations array
 *
 * @example
 * // Successful response (200):
 * {
 *   "organizations": [
 *     {
 *       "id": "uuid",
 *       "name": "Acme Corp",
 *       "slug": "acme-corp",
 *       "description": "Leading tech consultancy",
 *       "image": "https://example.com/logo.png",
 *       "website": "https://acme.com",
 *       "role": "ADMIN",
 *       "joinedAt": "2024-01-15T10:30:00Z",
 *       "createdAt": "2024-01-15T10:30:00Z",
 *       "updatedAt": "2024-01-15T10:30:00Z"
 *     }
 *   ]
 * }
 *
 * @throws {401} Not authenticated - User session is invalid or expired
 * @throws {500} Internal server error - Database query failed
 *
 * @see {@link /docs/api-reference/02-organizations.md#get-apiorganizations}
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

    // Format response - filter out null organizations
    const organizations =
      data
        ?.filter((item: any) => item.organizations && item.organizations.id) // Filter out null/undefined orgs
        .map((item: any) => ({
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
 * Creates a new organization and adds the authenticated user as an ADMIN member.
 *
 * @description
 * Creates a new organization in the system. The slug is auto-generated from the name
 * if not provided. Slug generation includes collision handling (adds random suffix if exists).
 * The authenticated user automatically becomes an ADMIN of the newly created organization.
 *
 * **Slug Generation Rules:**
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Ensures 3-50 character length (enforced by database constraint)
 * - Handles collisions by appending random suffix
 *
 * **Side Effects:**
 * 1. Organization created in `organizations` table
 * 2. User added to `user_organizations` with role ADMIN
 * 3. Activity logged (ORG_CREATED action)
 *
 * @authentication Required - User must be authenticated via Supabase Auth
 * @rateLimit 3 requests per hour per user (strict limit to prevent spam)
 *
 * @param {NextRequest} request - Next.js request object
 * @param {string} request.body.name - Organization name (required, 1-255 chars)
 * @param {string} request.body.slug - URL-safe identifier (optional, auto-generated if not provided)
 * @param {string} request.body.description - Organization description (optional, max 2000 chars)
 * @param {string} request.body.website - Organization website URL (optional)
 *
 * @returns {Promise<NextResponse>} JSON response with created organization
 *
 * @example
 * // Request body:
 * {
 *   "name": "Acme Corporation",
 *   "description": "Leading technology consulting firm",
 *   "website": "https://acme.com"
 * }
 *
 * @example
 * // Successful response (201):
 * {
 *   "organization": {
 *     "id": "uuid",
 *     "name": "Acme Corporation",
 *     "slug": "acme-corporation",
 *     "description": "Leading technology consulting firm",
 *     "image": null,
 *     "website": "https://acme.com",
 *     "role": "ADMIN",
 *     "createdAt": "2024-11-14T17:00:00Z",
 *     "updatedAt": "2024-11-14T17:00:00Z"
 *   }
 * }
 *
 * @throws {400} Bad Request - Name is missing or slug validation failed
 * @throws {401} Not authenticated - User session is invalid or expired
 * @throws {429} Too Many Requests - Rate limit exceeded (3/hour)
 * @throws {500} Internal server error - Database operation failed
 *
 * @see {@link /docs/api-reference/02-organizations.md#post-apiorganizations}
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
    let orgSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    // Ensure slug meets database constraints (3-50 characters)
    if (orgSlug.length < 3) {
      // Pad short slugs with random suffix
      orgSlug = `${orgSlug}-${Math.random().toString(36).substring(2, 5)}`;
    }
    if (orgSlug.length > 50) {
      orgSlug = orgSlug.substring(0, 50);
    }

    // Trim trailing hyphens that might have been added
    orgSlug = orgSlug.replace(/-+$/, '');

    // Final validation
    if (orgSlug.length < 3) {
      // If still too short, use a generated slug
      orgSlug = `org-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .single();

    if (existing) {
      // Add random suffix if slug exists
      orgSlug = `${orgSlug.substring(0, 44)}-${Math.random().toString(36).substring(2, 8)}`;
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
