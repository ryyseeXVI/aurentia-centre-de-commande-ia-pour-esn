// @ts-nocheck
// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/messenger/channels
 * Get all organization channels for a workspace
 * Query params: organizationId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this organization" },
        { status: 403 },
      );
    }

    // Get organization channels
    const { data: channels, error: channelsError } = await supabase
      .from("organization_channels")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (channelsError) {
      console.error("Error fetching channels:", channelsError);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformedChannels =
      channels?.map((channel: any) => ({
        id: (channel as any).id,
        organizationId: (channel as any).organization_id,
        name: (channel as any).name,
        description: (channel as any).description,
        createdBy: channel.created_by,
        createdAt: channel.created_at,
        updatedAt: channel.updated_at,
      })) || [];

    return NextResponse.json({ channels: transformedChannels });
  } catch (error) {
    console.error("Error in GET /api/messenger/channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messenger/channels
 * Create a new organization channel
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

    const body = await request.json();
    const { organizationId, name, description } = body;

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: "Organization ID and name are required" },
        { status: 400 },
      );
    }

    // Verify user is admin or owner of organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership || !["ADMIN", "ADMIN"].includes((membership as any).role)) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only admins and owners can create channels.",
        },
        { status: 403 },
      );
    }

    // Create channel
    const { data: channel, error: createError } = await supabase
      .from("organization_channels")
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating channel:", createError);
      return NextResponse.json(
        { error: "Failed to create channel" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformedChannel = {
      id: (channel as any).id,
      organizationId: (channel as any).organization_id,
      name: (channel as any).name,
      description: (channel as any).description,
      createdBy: channel.created_by,
      createdAt: channel.created_at,
      updatedAt: channel.updated_at,
    };

    return NextResponse.json({ channel: transformedChannel }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/messenger/channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
