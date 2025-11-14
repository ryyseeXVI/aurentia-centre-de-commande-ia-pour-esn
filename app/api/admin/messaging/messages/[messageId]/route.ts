// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { messageId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const messageType = searchParams.get("message_type");

    if (!messageType || !["channel", "direct"].includes(messageType)) {
      return NextResponse.json({ error: "message_type parameter is required (channel or direct)" }, { status: 400 });
    }

    const tableName = messageType === "channel" ? "channel_messages" : "direct_messages";

    // Get message details before deletion for logging
    const { data: message } = await supabase
      .from(tableName)
      .select("content")
      .eq("id", messageId)
      .single();

    const { error } = await supabase.from(tableName).delete().eq("id", messageId);
    if (error) return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });

    if (message) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "MESSAGE_DELETED",
        description: `Deleted ${messageType} message`,
        metadata: { message_id: messageId, message_type: messageType, content_preview: message.content?.substring(0, 50) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/messaging/messages/[messageId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
