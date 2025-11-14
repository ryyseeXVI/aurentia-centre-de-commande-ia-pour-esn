// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    // Get all organization channels
    const { data: orgChannels, error: orgError } = await supabase
      .from("organization_channels")
      .select(`
        *,
        organization:organizations(name),
        created_by_user:profiles!organization_channels_created_by_fkey(prenom, nom, email)
      `)
      .order("created_at", { ascending: false });

    // Get all project channels
    const { data: projectChannels, error: projectError } = await supabase
      .from("project_channels")
      .select(`
        *,
        project:projet(nom),
        created_by_user:profiles!project_channels_created_by_fkey(prenom, nom, email)
      `)
      .order("created_at", { ascending: false });

    if (orgError || projectError) {
      console.error("Error fetching channels:", orgError || projectError);
      return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }

    // Combine and tag channels with their type
    const allChannels = [
      ...(orgChannels || []).map(ch => ({ ...ch, channel_type: "organization" })),
      ...(projectChannels || []).map(ch => ({ ...ch, channel_type: "project" }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ channels: allChannels });
  } catch (error) {
    console.error("Error in GET /api/admin/messaging/channels:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const body = await request.json();

    // Handle bulk delete operation
    if (body.operation === "bulk_delete") {
      const { channel_ids, channel_type } = body;
      if (!Array.isArray(channel_ids) || channel_ids.length === 0) {
        return NextResponse.json({ error: "Invalid channel_ids" }, { status: 400 });
      }
      if (!channel_type || !["organization", "project"].includes(channel_type)) {
        return NextResponse.json({ error: "Invalid channel_type" }, { status: 400 });
      }

      const tableName = channel_type === "organization" ? "organization_channels" : "project_channels";
      const { error } = await supabase.from(tableName).delete().in("id", channel_ids);
      if (error) return NextResponse.json({ error: "Failed to delete channels" }, { status: 500 });

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_CHANNELS",
        description: `Deleted ${channel_ids.length} ${channel_type} channels`,
        metadata: { channel_ids, channel_type },
      });

      return NextResponse.json({ success: true, deleted: channel_ids.length });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/admin/messaging/channels:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
