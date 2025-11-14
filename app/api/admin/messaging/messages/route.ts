// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    // Get all channel messages
    const { data: channelMessages, error: channelError } = await supabase
      .from("channel_messages")
      .select(`
        *,
        sender:profiles!channel_messages_sender_id_fkey(prenom, nom, email)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    // Get all direct messages
    const { data: directMessages, error: directError } = await supabase
      .from("direct_messages")
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(prenom, nom, email),
        receiver:profiles!direct_messages_receiver_id_fkey(prenom, nom, email)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (channelError || directError) {
      console.error("Error fetching messages:", channelError || directError);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // Combine and tag messages with their type
    const allMessages = [
      ...(channelMessages || []).map(msg => ({ ...msg, message_type: "channel" })),
      ...(directMessages || []).map(msg => ({ ...msg, message_type: "direct" }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ messages: allMessages });
  } catch (error) {
    console.error("Error in GET /api/admin/messaging/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const body = await request.json();

    // Handle bulk delete operation
    if (body.operation === "bulk_delete") {
      const { message_ids, message_type } = body;
      if (!Array.isArray(message_ids) || message_ids.length === 0) {
        return NextResponse.json({ error: "Invalid message_ids" }, { status: 400 });
      }
      if (!message_type || !["channel", "direct"].includes(message_type)) {
        return NextResponse.json({ error: "Invalid message_type" }, { status: 400 });
      }

      const tableName = message_type === "channel" ? "channel_messages" : "direct_messages";
      const { error } = await supabase.from(tableName).delete().in("id", message_ids);
      if (error) return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 });

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_MESSAGES",
        description: `Deleted ${message_ids.length} ${message_type} messages`,
        metadata: { message_ids, message_type },
      });

      return NextResponse.json({ success: true, deleted: message_ids.length });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/admin/messaging/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
