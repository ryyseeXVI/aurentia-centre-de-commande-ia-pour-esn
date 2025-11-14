// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/messenger/direct-messages
 * Get direct messages between the authenticated user and another user
 * Query params: recipientId (required), organizationId (required), limit, before
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
    const recipientId = searchParams.get("recipientId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before"); // Message ID for pagination

    if (!recipientId) {
      return NextResponse.json(
        { error: "recipientId is required" },
        { status: 400 },
      );
    }

    // Build query for messages between these two users with sender info (cross-organization)
    let query = supabase
      .from("direct_messages")
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey (
          id,
          prenom,
          nom,
          avatar_url
        )
      `)
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // If pagination cursor provided
    if (before) {
      const { data: beforeMessage } = await supabase
        .from("direct_messages")
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

    // Reverse order (oldest first) and return with sender info (no transformation)
    const reversedMessages = messagesToReturn.reverse();

    return NextResponse.json({
      messages: reversedMessages,
      hasMore,
    });
  } catch (error) {
    console.error("Error in GET /api/messenger/direct-messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messenger/direct-messages
 * Send a new direct message
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

    // Parse request body
    const body = await request.json();
    const { recipientId, content, organizationId } = body;

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: "recipientId and content are required" },
        { status: 400 },
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 },
      );
    }

    // Get sender's organization_id from profile if not provided
    let senderOrgId = organizationId;
    if (!senderOrgId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      senderOrgId = profile?.organization_id || null;
    }

    // Verify recipient exists
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", recipientId)
      .single();

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 },
      );
    }

    // Create message (cross-organization allowed)
    const { data: message, error: createError } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        organization_id: senderOrgId,
      })
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey (
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

    // Return raw message with sender info (no transformation)
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/messenger/direct-messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
