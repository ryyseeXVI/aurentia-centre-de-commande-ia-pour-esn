// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/organizations/[orgId]/analytics
 *
 * Get comprehensive analytics and stats for an organization
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { orgId } = await context.params;

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to view this organization" },
        { status: 403 },
      );
    }

    // Fetch organization details
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get project stats
    const { data: projects } = await supabase
      .from("projet")
      .select("id, statut, date_debut, date_fin_prevue")
      .eq("organization_id", orgId);

    const projectStats = {
      total: projects?.length || 0,
      active: projects?.filter((p) => p.statut === "ACTIF").length || 0,
      paused: projects?.filter((p) => p.statut === "EN_PAUSE").length || 0,
      completed: projects?.filter((p) => p.statut === "TERMINE").length || 0,
      cancelled: projects?.filter((p) => p.statut === "ANNULE").length || 0,
    };

    // Get consultants count (unique consultants assigned to projects)
    const { data: affectations } = await supabase
      .from("affectation")
      .select("profile_id")
      .eq("organization_id", orgId);

    const uniqueConsultants = new Set(
      affectations?.map((a) => a.profile_id) || [],
    );
    const consultantsCount = uniqueConsultants.size;

    // Get tasks stats
    const { data: tasks } = await supabase
      .from("tache")
      .select("id, statut")
      .eq("organization_id", orgId);

    const taskStats = {
      total: tasks?.length || 0,
      todo: tasks?.filter((t) => t.statut === "TODO").length || 0,
      inProgress: tasks?.filter((t) => t.statut === "IN_PROGRESS").length || 0,
      review: tasks?.filter((t) => t.statut === "REVIEW").length || 0,
      done: tasks?.filter((t) => t.statut === "DONE").length || 0,
      blocked: tasks?.filter((t) => t.statut === "BLOCKED").length || 0,
    };

    // Get hours logged this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: timeEntries } = await supabase
      .from("temps_passe")
      .select("heures_travaillees")
      .eq("organization_id", orgId)
      .gte("date", startOfMonth.toISOString().split("T")[0])
      .lte("date", endOfMonth.toISOString().split("T")[0]);

    const hoursThisMonth = timeEntries?.reduce((sum, entry) => {
      return sum + (parseFloat(entry.heures_travaillees as string) || 0);
    }, 0) || 0;

    // Get total hours (all time)
    const { data: allTimeEntries } = await supabase
      .from("temps_passe")
      .select("heures_travaillees")
      .eq("organization_id", orgId);

    const totalHours = allTimeEntries?.reduce((sum, entry) => {
      return sum + (parseFloat(entry.heures_travaillees as string) || 0);
    }, 0) || 0;

    // Get budget overview
    const { data: budgets } = await supabase
      .from("budget_projet")
      .select("montant_total_vente, cout_estime_total")
      .eq("organization_id", orgId);

    const budgetStats = {
      totalRevenue: budgets?.reduce((sum, b) => sum + (parseFloat(b.montant_total_vente as string) || 0), 0) || 0,
      totalCost: budgets?.reduce((sum, b) => sum + (parseFloat(b.cout_estime_total as string) || 0), 0) || 0,
    };

    budgetStats.margin = budgetStats.totalRevenue - budgetStats.totalCost;
    budgetStats.marginPercentage = budgetStats.totalRevenue > 0
      ? ((budgetStats.margin / budgetStats.totalRevenue) * 100)
      : 0;

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("activity_logs")
      .select(`
        id,
        action,
        description,
        created_at,
        user_id,
        profiles (nom, prenom, avatar_url)
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get team members count
    const { data: members } = await supabase
      .from("user_organizations")
      .select("user_id, role")
      .eq("organization_id", orgId);

    const teamStats = {
      total: members?.length || 0,
      admins: members?.filter((m) => m.role === "ADMIN" || m.role === "OWNER").length || 0,
      managers: members?.filter((m) => m.role === "MANAGER").length || 0,
      members: members?.filter((m) => m.role === "MEMBER" || m.role === "CONSULTANT").length || 0,
    };

    // Get open incidents count
    const { count: incidentsCount } = await supabase
      .from("incident")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .neq("statut", "RESOLU");

    return NextResponse.json({
      organization,
      stats: {
        projects: projectStats,
        consultants: consultantsCount,
        tasks: taskStats,
        hours: {
          thisMonth: Math.round(hoursThisMonth * 10) / 10,
          total: Math.round(totalHours * 10) / 10,
        },
        budget: budgetStats,
        team: teamStats,
        incidents: incidentsCount || 0,
      },
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    logger.error("Error in GET /api/organizations/[orgId]/analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
