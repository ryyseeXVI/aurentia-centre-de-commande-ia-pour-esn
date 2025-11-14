// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/chat/group-messages
 * Get messages for a group chat
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
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 },
      );
    }

    // Verify user is member of group
    const { data: membership } = await supabase
      .from("group_chat_members")
      .select("id")
      .eq("group_chat_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 },
      );
    }

    // Fetch messages
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
      .eq("channel_id", groupId)
      .eq("channel_type", "group")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching group messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Error in GET /api/chat/group-messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/group-messages
 * Send a message to a group chat
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
    const { groupId, content } = body;

    if (!groupId || !content?.trim()) {
      return NextResponse.json(
        { error: "groupId and content are required" },
        { status: 400 },
      );
    }

    // Verify user is member of group
    const { data: membership } = await supabase
      .from("group_chat_members")
      .select("id")
      .eq("group_chat_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 },
      );
    }

    // Get group to get organization_id
    const { data: group } = await supabase
      .from("group_chats")
      .select("organization_id")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Create message
    const { data: message, error } = await supabase
      .from("channel_messages")
      .insert({
        channel_id: groupId,
        channel_type: "group",
        sender_id: user.id,
        content: content.trim(),
        organization_id: (group as any).organization_id,
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
      console.error("Error creating group message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chat/group-messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
