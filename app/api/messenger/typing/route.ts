// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * POST /api/messenger/typing
 * Update typing indicator status
 * For direct messages, use channelType='direct' and channelId=recipientId
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
    const { channelId, channelType, isTyping, organizationId } = body;

    if (
      !channelId ||
      !channelType ||
      isTyping === undefined ||
      !organizationId
    ) {
      return NextResponse.json(
        {
          error:
            "channelId, channelType, isTyping, and organizationId are required",
        },
        { status: 400 },
      );
    }

    if (!["organization", "project", "direct"].includes(channelType)) {
      return NextResponse.json(
        { error: "channelType must be 'organization', 'project', or 'direct'" },
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

    if (isTyping) {
      // Create or update typing indicator
      // Note: Supabase doesn't support upsert with conflict on multiple columns easily
      // So we'll delete existing and insert new
      await supabase
        .from("typing_indicators")
        .delete()
        .eq("channel_id", channelId)
        .eq("channel_type", channelType)
        .eq("user_id", user.id);

      const { error: insertError } = await supabase
        .from("typing_indicators")
        .insert({
          channel_id: channelId,
          channel_type: channelType,
          user_id: user.id,
          organization_id: organizationId,
        });

      if (insertError) {
        console.error("Error creating typing indicator:", insertError);
        return NextResponse.json(
          { error: "Failed to update typing status" },
          { status: 500 },
        );
      }
    } else {
      // Remove typing indicator
      const { error: deleteError } = await supabase
        .from("typing_indicators")
        .delete()
        .eq("channel_id", channelId)
        .eq("channel_type", channelType)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error removing typing indicator:", deleteError);
        // Don't fail the request, indicator should auto-expire anyway
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/messenger/typing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
