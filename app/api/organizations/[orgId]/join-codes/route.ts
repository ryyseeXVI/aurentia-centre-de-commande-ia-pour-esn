// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import {
  createResourceRateLimiter,
  deleteRateLimiter,
  generalRateLimiter,
} from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { withUserRateLimit } from "@/utils/with-rate-limit";

type Params = {
  params: Promise<{
    orgId: string;
  }>;
};

/**
 * GET /api/organizations/[id]/join-code
 * Get join code for an organization
 *
 * Rate limit: 60 requests per minute per user
 */
const getHandler = async (_request: NextRequest, { params }: Params) => {
  try {
    const { orgId } = await params;
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
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get organization's join code
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, join_code, join_code_enabled")
      .eq("id", orgId)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return NextResponse.json(
        { error: "Failed to fetch join code" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      joinCode: organization.join_code,
      joinCodeEnabled: organization.join_code_enabled,
    });
  } catch (error) {
    console.error("Error in GET /api/organizations/[id]/join-code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const GET = withUserRateLimit(getHandler, generalRateLimiter, false);

/**
 * POST /api/organizations/[id]/join-code
 * Generate or regenerate join code for an organization
 *
 * Rate limit: 30 requests per minute per user
 */
const postHandler = async (_request: NextRequest, { params }: Params) => {
  try {
    const { orgId } = await params;
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
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Generate unique join code
    let joinCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate 8-character code
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      joinCode = "";
      for (let i = 0; i < 8; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("join_code", joinCode)
        .single();

      if (!existing) {
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique join code" },
        { status: 500 },
      );
    }

    // Update organization with new join code
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        join_code: joinCode,
        join_code_enabled: true,
      })
      .eq("id", orgId);

    if (updateError) {
      console.error("Error updating join code:", updateError);
      return NextResponse.json(
        { error: "Failed to update join code" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "JOIN_CODE_GENERATED",
      description: "Generated new join code",
    });

    return NextResponse.json({
      success: true,
      joinCode,
      joinCodeEnabled: true,
    });
  } catch (error) {
    console.error("Error in POST /api/organizations/[id]/join-code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const POST = withUserRateLimit(
  postHandler,
  createResourceRateLimiter,
  true,
);

/**
 * PATCH /api/organizations/[id]/join-code
 * Enable or disable join code for an organization
 *
 * Note: PATCH method not included in rate limiting progress doc, skipping
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { orgId } = await params;
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
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 },
      );
    }

    // Update join code enabled status
    const { error: updateError } = await supabase
      .from("organizations")
      .update({ join_code_enabled: enabled })
      .eq("id", orgId);

    if (updateError) {
      console.error("Error updating join code status:", updateError);
      return NextResponse.json(
        { error: "Failed to update join code status" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: enabled ? "JOIN_CODE_ENABLED" : "JOIN_CODE_DISABLED",
      description: `Join code ${enabled ? "enabled" : "disabled"}`,
    });

    return NextResponse.json({
      success: true,
      joinCodeEnabled: enabled,
    });
  } catch (error) {
    console.error("Error in PATCH /api/organizations/[id]/join-code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/organizations/[id]/join-code
 * Remove join code from an organization
 *
 * Rate limit: 10 requests per minute per user
 */
const deleteHandler = async (_request: NextRequest, { params }: Params) => {
  try {
    const { orgId } = await params;
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
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Remove join code
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        join_code: null,
        join_code_enabled: false,
      })
      .eq("id", orgId);

    if (updateError) {
      console.error("Error removing join code:", updateError);
      return NextResponse.json(
        { error: "Failed to remove join code" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "JOIN_CODE_REMOVED",
      description: "Removed join code",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/organizations/[id]/join-code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const DELETE = withUserRateLimit(deleteHandler, deleteRateLimiter, true);
