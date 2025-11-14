// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { apiChannelMessageToDbInsert } from "@/utils/transformers/message-transformers";
import { validateCreateChannelMessage } from "@/utils/validators/message-validators";

/**
 * GET /api/messenger/messages
 * Get channel messages with filters
 * Query params: channelId, channelType, limit, before (for pagination)
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
    const channelId = searchParams.get("channelId");
    const channelType = searchParams.get("channelType") as
      | "organization"
      | "project"
      | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before"); // Message ID for pagination

    if (!channelId || !channelType) {
      return NextResponse.json(
        { error: "channelId and channelType are required" },
        { status: 400 },
      );
    }

    if (!["organization", "project"].includes(channelType)) {
      return NextResponse.json(
        { error: "channelType must be 'organization' or 'project'" },
        { status: 400 },
      );
    }

    // Verify user has access to the channel
    if (channelType === "organization") {
      const { data: channel } = await supabase
        .from("organization_channels")
        .select("organization_id")
        .eq("id", channelId)
        .single();

      if (!channel) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 },
        );
      }

      // Check membership
      const { data: membership } = await supabase
        .from("user_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", (channel as any).organization_id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      // Project channel
      const { data: channel } = await supabase
        .from("project_channels")
        .select("organization_id")
        .eq("id", channelId)
        .single();

      if (!channel) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 },
        );
      }

      // Check membership
      const { data: membership } = await supabase
        .from("user_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", (channel as any).organization_id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Build query
    let query = supabase
      .from("channel_messages")
      .select(`
        *,
        sender:profiles!channel_messages_sender_id_fkey (
          id,
          prenom,
          nom,
          avatar_url
        )
      `)
      .eq("channel_id", channelId)
      .eq("channel_type", channelType)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // If pagination cursor provided
    if (before) {
      const { data: beforeMessage } = await supabase
        .from("channel_messages")
        .select("created_at")
        .eq("id", before)
        .single();

      if (beforeMessage) {
        query = query.lt("created_at", beforeMessage.created_at);
      }
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    // Check if there are more messages
    const hasMore = (messages || []).length > limit;
    const messagesToReturn = hasMore
      ? messages?.slice(0, limit)
      : messages || [];

    // Reverse to get oldest first (return raw data to match real-time format)
    const reversedMessages = messagesToReturn.reverse();

    return NextResponse.json({
      messages: reversedMessages,
      hasMore,
    });
  } catch (error) {
    console.error("Error in GET /api/messenger/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messenger/messages
 * Send a new channel message
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
    const validation = validateCreateChannelMessage(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400 },
      );
    }

    const data = validation.data!;

    // Verify user has access to the channel and get organization_id
    let organizationId: string;

    if (data.channelType === "organization") {
      const { data: channel } = await supabase
        .from("organization_channels")
        .select("organization_id")
        .eq("id", data.channelId)
        .single();

      if (!channel) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 },
        );
      }

      organizationId = (channel as any).organization_id;

      // Check membership
      const { data: membership } = await supabase
        .from("user_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      // Project channel
      const { data: channel } = await supabase
        .from("project_channels")
        .select("organization_id")
        .eq("id", data.channelId)
        .single();

      if (!channel) {
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 },
        );
      }

      organizationId = (channel as any).organization_id;

      // Check membership
      const { data: membership } = await supabase
        .from("user_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Transform to database format, using the organizationId from the channel
    const dbInsert = apiChannelMessageToDbInsert(data, user.id, organizationId);

    // Create message
    const { data: newMessage, error: createError } = await supabase
      .from("channel_messages")
      .insert(dbInsert)
      .select(`
        *,
        sender:profiles!channel_messages_sender_id_fkey (
          id,
          prenom,
          nom,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error("Error creating message:", createError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    // Return raw message to match real-time format (includes sender object)
    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/messenger/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
