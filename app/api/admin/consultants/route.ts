import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { consultantFromDb } from "@/utils/consultant-transformers";

/**
 * GET /api/admin/consultants
 *
 * Get all consultants (Admin only)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Fetch all consultants (profiles with consultant_details)
    const { data: consultants, error } = await supabase
      .from("profiles")
      .select(`
        *,
        consultant_details (
          date_embauche,
          taux_journalier_cout,
          taux_journalier_vente,
          statut,
          job_title
        ),
        manager:manager_id (
          id,
          nom,
          prenom,
          email
        )
      `)
      .eq("organization_id", profile.organization_id)
      .eq("role", "CONSULTANT")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consultants:", error);
      return NextResponse.json(
        { error: "Failed to fetch consultants" },
        { status: 500 },
      );
    }

    // Transform consultants to camelCase
    const transformed = (consultants || []).map((c: any) => consultantFromDb(c));

    return NextResponse.json({ consultants: transformed });
  } catch (error) {
    console.error("Error in GET /api/admin/consultants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
