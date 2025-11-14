// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * POST /api/messenger/reactions
 * Add or remove an emoji reaction to a message (channel or direct)
 * Toggle behavior: adds if doesn't exist, removes if already exists
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
    const { messageId, messageType, emoji, organizationId } = body;

    if (!messageId || !messageType || !emoji || !organizationId) {
      return NextResponse.json(
        {
          error:
            "messageId, messageType, emoji, and organizationId are required",
        },
        { status: 400 },
      );
    }

    if (!["channel", "direct"].includes(messageType)) {
      return NextResponse.json(
        { error: "messageType must be 'channel' or 'direct'" },
        { status: 400 },
      );
    }

    // Validate emoji (max 10 characters)
    if (emoji.length > 10) {
      return NextResponse.json(
        { error: "Emoji must be 10 characters or less" },
        { status: 400 },
      );
    }

    // Basic emoji validation
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}]+/gu;
    if (!emojiRegex.test(emoji)) {
      return NextResponse.json(
        { error: "Invalid emoji format" },
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

    // Verify message exists and belongs to organization
    if (messageType === "channel") {
      const { data: message } = await supabase
        .from("channel_messages")
        .select("id, organization_id")
        .eq("id", messageId)
        .eq("organization_id", organizationId)
        .single();

      if (!message) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 },
        );
      }
    } else {
      // Direct message
      const { data: message } = await supabase
        .from("direct_messages")
        .select("id, organization_id, sender_id, recipient_id")
        .eq("id", messageId)
        .eq("organization_id", organizationId)
        .single();

      if (!message) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 },
        );
      }

      // Verify user is sender or recipient
      if (message.sender_id !== user.id && message.recipient_id !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Check if reaction already exists (toggle behavior)
    const { data: existingReaction } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("message_type", messageType)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single();

    if (existingReaction) {
      // Remove reaction (toggle off)
      const { error: deleteError } = await supabase
        .from("message_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) {
        console.error("Error removing reaction:", deleteError);
        return NextResponse.json(
          { error: "Failed to remove reaction" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { success: true, action: "removed" },
        { status: 200 },
      );
    }

    // Add new reaction (toggle on)
    const { data: reaction, error: reactionError } = await supabase
      .from("message_reactions")
      .insert({
        message_id: messageId,
        message_type: messageType,
        user_id: user.id,
        emoji,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (reactionError) {
      console.error("Error adding reaction:", reactionError);
      return NextResponse.json(
        { error: "Failed to add reaction" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformedReaction = {
      id: reaction.id,
      messageId: reaction.message_id,
      messageType: reaction.message_type,
      userId: reaction.user_id,
      emoji: reaction.emoji,
      createdAt: reaction.created_at,
      organizationId: reaction.organization_id,
    };

    return NextResponse.json(
      { reaction: transformedReaction, action: "added" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/messenger/reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/messenger/reactions
 * Remove a specific reaction by ID
 */
export async function DELETE(request: NextRequest) {
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
    const { reactionId } = body;

    if (!reactionId) {
      return NextResponse.json(
        { error: "reactionId is required" },
        { status: 400 },
      );
    }

    // Verify reaction exists and belongs to user
    const { data: reaction } = await supabase
      .from("message_reactions")
      .select("id, user_id")
      .eq("id", reactionId)
      .eq("user_id", user.id)
      .single();

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found or access denied" },
        { status: 404 },
      );
    }

    // Delete reaction
    const { error: deleteError } = await supabase
      .from("message_reactions")
      .delete()
      .eq("id", reactionId);

    if (deleteError) {
      console.error("Error deleting reaction:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete reaction" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/messenger/reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
