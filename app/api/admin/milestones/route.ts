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

    const { data: milestones, error } = await supabase
      .from("milestone")
      .select(`*, organization:organizations(name), projet:projet(nom)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching milestones:", error);
      return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
    }

    return NextResponse.json({ milestones: milestones || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/milestones:", error);
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

    if (body.operation === "bulk_delete") {
      const { milestone_ids } = body;
      if (!Array.isArray(milestone_ids) || milestone_ids.length === 0) {
        return NextResponse.json({ error: "Invalid milestone_ids" }, { status: 400 });
      }

      const { error } = await supabase.from("milestone").delete().in("id", milestone_ids);
      if (error) return NextResponse.json({ error: "Failed to delete milestones" }, { status: 500 });

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_MILESTONES",
        description: `Deleted ${milestone_ids.length} milestones`,
        metadata: { milestone_ids },
      });

      return NextResponse.json({ success: true, deleted: milestone_ids.length });
    }

    const { nom, description, date_debut, date_fin, statut, priorite, couleur, projet_id, organization_id } = body;

    if (!nom || !organization_id) {
      return NextResponse.json({ error: "Missing required fields: nom, organization_id" }, { status: 400 });
    }

    const { data: newMilestone, error } = await supabase
      .from("milestone")
      .insert({ nom, description, date_debut, date_fin, statut: statut || "A_VENIR", priorite, couleur, projet_id, organization_id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message || "Failed to create milestone" }, { status: 500 });

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "MILESTONE_CREATED",
      description: `Created milestone: ${newMilestone.nom}`,
      metadata: { milestone_id: newMilestone.id },
    });

    return NextResponse.json({ milestone: newMilestone });
  } catch (error) {
    console.error("Error in POST /api/admin/milestones:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
