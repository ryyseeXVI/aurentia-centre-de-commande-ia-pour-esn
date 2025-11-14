// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { dbChannelToApi, type DbOrganizationChannel } from "@/utils/transformers/chat-transformers";
import { createChannelSchema } from "@/lib/validations/chat";
import { logActivity } from "@/lib/api-helpers";

/**
 * GET /api/chat/channels
 * Get all organization channels for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's profile to get organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      return NextResponse.json(
        { error: "No organization associated with user" },
        { status: 403 },
      );
    }

    // Fetch organization channels
    const { data: channels, error } = await supabase
      .from("organization_channels")
      .select("*")
      .eq("organization_id", (profile as any).organization_id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformedChannels = (channels || []).map((ch) =>
      dbChannelToApi(ch as DbOrganizationChannel)
    );

    return NextResponse.json({ channels: transformedChannels });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/channels
 * Create a new organization channel (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createChannelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, description } = validation.data;

    // Get user's profile and check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      return NextResponse.json(
        { error: "No organization associated with user" },
        { status: 403 },
      );
    }

    const organizationId = (profile as any).organization_id;

    // Check if user is admin
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!(membership as any)?.role || !['ADMIN'].includes((membership as any).role)) {
      return NextResponse.json(
        { error: "Only admins can create channels" },
        { status: 403 },
      );
    }

    // Check if channel already exists
    const { data: existing } = await supabase
      .from("organization_channels")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Channel with this name already exists" },
        { status: 409 },
      );
    }

    // Create channel
    const { data: channel, error: createError } = await supabase
      .from("organization_channels")
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: "Failed to create channel" },
        { status: 500 },
      );
    }

    // Log activity
    await logActivity(supabase, "CHANNEL_CREATED", `Created channel #${name}`, {
      organizationId,
      resourceType: "organization_channel",
      resourceId: channel.id,
      metadata: { channelName: name },
    });

    // Transform to camelCase
    const transformedChannel = dbChannelToApi(channel as DbOrganizationChannel);

    return NextResponse.json({ channel: transformedChannel }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
