import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/chat/channels
 *
 * Get all organization channels for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's profile to get organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization associated with user" },
        { status: 403 },
      );
    }

    // Fetch organization channels
    const { data: channels, error } = await supabase
      .from("organization_channels")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching channels:", error);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 },
      );
    }

    return NextResponse.json({ channels: channels || [] });
  } catch (error) {
    console.error("Error in GET /api/chat/channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
