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
    const organizationId = searchParams.get("organizationId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before"); // Message ID for pagination

    if (!recipientId || !organizationId) {
      return NextResponse.json(
        { error: "recipientId and organizationId are required" },
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build query for messages between these two users
    let query = supabase
      .from("direct_messages")
      .select("*")
      .eq("organization_id", organizationId)
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

    // Transform to camelCase and reverse order (oldest first)
    const transformedMessages = messagesToReturn.reverse().map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      content: msg.content,
      readAt: msg.read_at,
      editedAt: msg.edited_at,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      organizationId: msg.organization_id,
    }));

    return NextResponse.json({
      messages: transformedMessages,
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

    if (!recipientId || !content || !organizationId) {
      return NextResponse.json(
        { error: "recipientId, content, and organizationId are required" },
        { status: 400 },
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify recipient is also member of organization
    const { data: recipientMembership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", recipientId)
      .eq("organization_id", organizationId)
      .single();

    if (!recipientMembership) {
      return NextResponse.json(
        { error: "Recipient is not a member of this organization" },
        { status: 400 },
      );
    }

    // Create message
    const { data: message, error: createError } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        organization_id: organizationId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating message:", createError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformedMessage = {
      id: message.id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      content: message.content,
      readAt: message.read_at,
      editedAt: message.edited_at,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      organizationId: message.organization_id,
    };

    return NextResponse.json({ message: transformedMessage }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/messenger/direct-messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
