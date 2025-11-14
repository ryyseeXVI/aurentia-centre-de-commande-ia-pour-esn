import { NextResponse } from "next/server";
import {
  deleteRateLimiter,
  generalRateLimiter,
  updateRateLimiter,
} from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { withUserRateLimit } from "@/utils/with-rate-limit";

type Params = {
  params: Promise<{
    organizationId: string;
  }>;
};

/**
 * GET /api/organizations/[organizationId]
 *
 * Get a specific organization by ID
 *
 * Rate limit: 60 requests per minute per user
 */
const getHandler = async (_request: Request, { params }: Params) => {
  try {
    const { organizationId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is a member of this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 },
      );
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return NextResponse.json(
        { error: "Failed to fetch organization" },
        { status: 500 },
      );
    }

    // Format response
    const organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      image: org.image,
      website: org.website,
      role: membership.role,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error in GET /api/organizations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const GET = withUserRateLimit(getHandler, generalRateLimiter, false);

/**
 * PUT /api/organizations/[organizationId]
 *
 * Update an organization
 *
 * Rate limit: 30 requests per minute per user
 */
const putHandler = async (request: Request, { params }: Params) => {
  try {
    const { organizationId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, description, website } = body;

    // Build update object
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    // If slug is being updated, check if it's already taken
    if (slug) {
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .neq("id", organizationId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 },
        );
      }
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("id", organizationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating organization:", updateError);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: organizationId,
      action: "ORG_UPDATED",
      description: `Updated organization: ${updatedOrg.name}`,
      metadata: { fields: Object.keys(updateData) },
    });

    // Format response
    const organization = {
      id: updatedOrg.id,
      name: updatedOrg.name,
      slug: updatedOrg.slug,
      description: updatedOrg.description,
      image: updatedOrg.image,
      website: updatedOrg.website,
      role: membership.role,
      createdAt: updatedOrg.created_at,
      updatedAt: updatedOrg.updated_at,
    };

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error in PUT /api/organizations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const PUT = withUserRateLimit(putHandler, updateRateLimiter, true);

/**
 * DELETE /api/organizations/[organizationId]
 *
 * Delete an organization
 *
 * Rate limit: 10 requests per minute per user
 */
const deleteHandler = async (_request: Request, { params }: Params) => {
  try {
    const { organizationId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is owner
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only organization owners can delete the organization" },
        { status: 403 },
      );
    }

    // Delete organization (cascade will handle user_organizations and activity_logs)
    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", organizationId);

    if (deleteError) {
      console.error("Error deleting organization:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete organization" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/organizations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const DELETE = withUserRateLimit(deleteHandler, deleteRateLimiter, true);
