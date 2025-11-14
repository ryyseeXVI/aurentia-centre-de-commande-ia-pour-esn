// @ts-nocheck
import { NextResponse } from "next/server";
import {
  createResourceRateLimiter,
  generalRateLimiter,
} from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { withUserRateLimit } from "@/utils/with-rate-limit";
import { notifyMemberAdded } from "@/lib/notifications";

type Params = {
  params: Promise<{
    orgId: string;
  }>;
};

/**
 * GET /api/organizations/[id]/members
 *
 * Get all members of an organization
 *
 * Rate limit: 60 requests per minute per user
 */
const getHandler = async (_request: Request, { params }: Params) => {
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

    // Check if user is a member of this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 },
      );
    }

    // Get all members with their profile info
    const { data, error } = await supabase
      .from("user_organizations")
      .select(
        `
        user_id,
        role,
        created_at,
        profiles:user_id (
          id,
          email,
          prenom,
          nom,
          avatar_url
        )
      `,
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 },
      );
    }

    // Format response
    const members =
      data?.map((item: any) => ({
        user_id: item.user_id,
        role: item.role,
        joined_at: item.created_at,
        prenom: item.profiles?.prenom || "",
        nom: item.profiles?.nom || "",
        email: item.profiles?.email || "",
        avatar_url: item.profiles?.avatar_url || null,
      })) || [];

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error in GET /api/organizations/[id]/members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const GET = withUserRateLimit(getHandler, generalRateLimiter, false);

/**
 * POST /api/organizations/[id]/members
 *
 * Add a member to an organization
 *
 * Rate limit: 30 requests per minute per user
 */
const postHandler = async (request: Request, { params }: Params) => {
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

    // Parse request body
    const body = await request.json();
    const { email, role = "CONSULTANT" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate role
    if (!["ADMIN", "ADMIN", "CONSULTANT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, ADMIN, or CONSULTANT" },
        { status: 400 },
      );
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, name, image")
      .eq("email", email)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 },
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", targetUser.id)
      .eq("organization_id", orgId)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 },
      );
    }

    // Add member
    const { data: newMembership, error: addError } = await supabase
      .from("user_organizations")
      .insert({
        user_id: targetUser.id,
        organization_id: orgId,
        role,
      })
      .select()
      .single();

    if (addError) {
      console.error("Error adding member:", addError);
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: "MEMBER_ADDED",
      description: `Added ${targetUser.email} as ${role}`,
      metadata: { targetUserId: targetUser.id, role },
    });

    // Get organization name for notification
    const { data: organization } = await supabase
      .from("organizations")
      .select("nom")
      .eq("id", orgId)
      .single();

    // Send notification for member addition
    await notifyMemberAdded({
      newMemberId: targetUser.id,
      organizationId: orgId,
      organizationName: organization?.nom || "the organization",
      role: role,
      adderId: user.id,
    });

    // Format response
    const member = {
      userId: newMembership.user_id,
      role: newMembership.role,
      joinedAt: newMembership.joined_at,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.first_name,
        lastName: targetUser.last_name,
        name: targetUser.name,
        image: targetUser.image,
      },
    };

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/organizations/[id]/members:", error);
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
