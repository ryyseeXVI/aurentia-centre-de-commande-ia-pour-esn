// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { generalRateLimiter, inviteRateLimiter } from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { withUserRateLimit } from "@/utils/with-rate-limit";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/organizations/[id]/invites
 * Get all invitations for an organization
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

    // Check if user is OWNER or ADMIN
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get all invitations
    const { data: invitations, error } = await supabase
      .from("organization_invitations")
      .select(`
        id,
        email,
        role,
        status,
        token,
        expires_at,
        accepted_at,
        created_at,
        inviter:users!inviter_id (
          id,
          email,
          name,
          image
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 },
      );
    }

    // Format response
    const formattedInvitations =
      invitations?.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        token: inv.token,
        expiresAt: inv.expires_at,
        acceptedAt: inv.accepted_at,
        createdAt: inv.created_at,
        inviter: inv.inviter
          ? {
              id: inv.inviter.id,
              email: inv.inviter.email,
              name: inv.inviter.name,
              image: inv.inviter.image,
            }
          : null,
      })) || [];

    return NextResponse.json({ invitations: formattedInvitations });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const GET = withUserRateLimit(getHandler, generalRateLimiter, false);

/**
 * POST /api/organizations/[id]/invites
 * Send invitation to join organization
 *
 * Rate limit: 20 requests per minute per user
 */
const postHandler = async (request: NextRequest, { params }: Params) => {
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

    // Check if user is ADMIN or ADMIN
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = "CONSULTANT" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!["ADMIN", "ADMIN", "CONSULTANT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Only ADMIN can invite as ADMIN or ADMIN
    if ((role === "ADMIN" || role === "ADMIN") && (membership as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners can invite owners or admins" },
        { status: 403 },
      );
    }

    // Check if user already exists and is a member
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      // Check if already a member
      const { data: existingMembership } = await supabase
        .from("user_organizations")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("organization_id", orgId)
        .single();

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 400 },
        );
      }

      // Add existing user to organization directly
      const { error: insertError } = await supabase
        .from("user_organizations")
        .insert({
          user_id: existingUser.id,
          organization_id: orgId,
          role,
        });

      if (insertError) {
        console.error("Error adding member:", insertError);
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
        description: `Added ${email} as ${role}`,
      });

      return NextResponse.json({
        success: true,
        message: "User added to organization",
        type: "direct_add",
      });
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from("organization_invitations")
      .select("id, status")
      .eq("email", email)
      .eq("organization_id", orgId)
      .eq("status", "PENDING")
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 },
      );
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: orgId,
        inviter_id: user.id,
        email,
        role,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 },
      );
    }

    // TODO: Send email with invitation link
    // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`
    // await sendInvitationEmail(email, inviteUrl, orgName)
    console.log(
      `Would send invitation email to ${email} with token ${invitation.token}`,
    );

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      type: "invitation",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

export const POST = withUserRateLimit(postHandler, inviteRateLimiter, true);
