import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/dashboard/stats
 *
 * Get dashboard statistics for the ESN
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

    // Get user's profile to check permissions
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

    const orgId = profile.organization_id;

    // Fetch total organizations (client companies)
    const { count: totalOrganizations } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true });

    // Fetch total projects
    const { count: totalProjects } = await supabase
      .from("projet")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    // Fetch active projects
    const { count: activeProjects } = await supabase
      .from("projet")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("statut", "ACTIF");

    // Fetch total consultants
    const { count: totalConsultants } = await supabase
      .from("consultant")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("statut", "actif");

    // Fetch hours for this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { data: timeEntries } = await supabase
      .from("temps_passe")
      .select("heures_travaillees")
      .eq("organization_id", orgId)
      .gte("date", firstDayOfMonth);

    const totalHoursThisMonth =
      timeEntries?.reduce((sum: number, entry: any) => sum + (entry.heures_travaillees || 0), 0) || 0;

    // Fetch revenue for this month (from facture table)
    const { data: invoices } = await supabase
      .from("facture")
      .select("montant_ht")
      .eq("organization_id", orgId)
      .gte("date_emission", firstDayOfMonth);

    const revenueThisMonth =
      invoices?.reduce((sum: number, invoice: any) => sum + (invoice.montant_ht || 0), 0) || 0;

    return NextResponse.json({
      totalOrganizations: totalOrganizations || 0,
      totalProjects: totalProjects || 0,
      activeProjects: activeProjects || 0,
      totalConsultants: totalConsultants || 0,
      totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
