import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";

/**
 * GET /api/profile
 *
 * Get the current user's profile
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/profile
 *
 * Update the current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return NextResponse.json(
        { error: firstError || "Validation failed" },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (validatedData.prenom !== undefined) updates.prenom = validatedData.prenom;
    if (validatedData.nom !== undefined) updates.nom = validatedData.nom;
    if (validatedData.phone !== undefined) {
      updates.phone = validatedData.phone === "" ? null : validatedData.phone;
    }
    if (validatedData.avatar_url !== undefined) {
      updates.avatar_url = validatedData.avatar_url === "" ? null : validatedData.avatar_url;
    }

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Log activity
    if (profile.organization_id) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: "PROFILE_UPDATED",
        description: "Updated profile information",
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in PATCH /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
