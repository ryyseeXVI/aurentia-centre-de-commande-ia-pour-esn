// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/profiles/all
 * Get all user profiles on the platform (for cross-organization messaging)
 * Excludes the current user
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

    // Get all profiles except current user
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, prenom, nom, avatar_url, role, organization_id")
      .neq("id", user.id)
      .in("role", ["CONSULTANT", "MANAGER", "ADMIN"])
      .order("prenom", { ascending: true });

    if (error) {
      console.error("Error fetching profiles:", error);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 },
      );
    }

    // Format response
    const users = profiles?.map((profile: any) => ({
      user_id: profile.id,
      prenom: profile.prenom || "",
      nom: profile.nom || "",
      email: profile.email || "",
      avatar_url: profile.avatar_url || null,
      role: profile.role,
      organization_id: profile.organization_id,
    })) || [];

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in GET /api/profiles/all:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
