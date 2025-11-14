// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest, context: { params: Promise<{ channelId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { channelId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const channelType = searchParams.get("channel_type");

    if (!channelType || !["organization", "project"].includes(channelType)) {
      return NextResponse.json({ error: "channel_type parameter is required (organization or project)" }, { status: 400 });
    }

    const tableName = channelType === "organization" ? "organization_channels" : "project_channels";

    // Get channel details before deletion for logging
    const { data: channel } = await supabase
      .from(tableName)
      .select("name")
      .eq("id", channelId)
      .single();

    const { error } = await supabase.from(tableName).delete().eq("id", channelId);
    if (error) return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });

    if (channel) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "CHANNEL_DELETED",
        description: `Deleted ${channelType} channel: ${channel.name}`,
        metadata: { channel_id: channelId, channel_type: channelType },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/messaging/channels/[channelId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
