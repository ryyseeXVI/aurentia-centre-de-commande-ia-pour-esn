// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/chat/messages
 *
 * Get all messages for a channel
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

    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 },
      );
    }

    // Fetch messages with sender information
    const { data: messages, error } = await supabase
      .from("channel_messages")
      .select(
        `
        *,
        sender:profiles!channel_messages_sender_id_fkey (
          id,
          prenom,
          nom,
          avatar_url
        )
      `,
      )
      .eq("channel_id", channelId)
      .eq("channel_type", "organization")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Error in GET /api/chat/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/messages
 *
 * Send a new message to a channel
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
    const { channelId, content } = body;

    if (!channelId || !content?.trim()) {
      return NextResponse.json(
        { error: "channelId and content are required" },
        { status: 400 },
      );
    }

    // Get user's organization
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

    // Create message
    const { data: message, error } = await supabase
      .from("channel_messages")
      .insert({
        channel_id: channelId,
        channel_type: "organization",
        sender_id: user.id,
        content: content.trim(),
        organization_id: (profile as any).organization_id,
      })
      .select(
        `
        *,
        sender:profiles!channel_messages_sender_id_fkey (
          id,
          prenom,
          nom,
          avatar_url
        )
      `,
      )
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chat/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
