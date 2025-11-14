// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/admin/consultants
 * Get all consultants (Admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { data: consultants, error } = await supabase
      .from("consultant")
      .select(`
        *,
        organization:organizations(name),
        manager:profiles!consultant_manager_id_fkey(id, nom, prenom, email),
        user:profiles!consultant_user_id_fkey(id, nom, prenom, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consultants:", error);
      return NextResponse.json({ error: "Failed to fetch consultants" }, { status: 500 });
    }

    return NextResponse.json({ consultants: consultants || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/consultants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/consultants
 * Create consultant or bulk operations (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    // Bulk delete operation
    if (body.operation === "bulk_delete") {
      const { consultant_ids } = body;

      if (!Array.isArray(consultant_ids) || consultant_ids.length === 0) {
        return NextResponse.json({ error: "Invalid consultant_ids" }, { status: 400 });
      }

      const { error } = await supabase
        .from("consultant")
        .delete()
        .in("id", consultant_ids);

      if (error) {
        console.error("Error bulk deleting consultants:", error);
        return NextResponse.json({ error: "Failed to delete consultants" }, { status: 500 });
      }

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_CONSULTANTS",
        description: `Deleted ${consultant_ids.length} consultants`,
        metadata: { consultant_ids },
      });

      return NextResponse.json({ success: true, deleted: consultant_ids.length });
    }

    // Create new consultant
    const {
      nom,
      prenom,
      email,
      date_embauche,
      taux_journalier_cout,
      taux_journalier_vente,
      role,
      statut,
      manager_id,
      user_id,
      organization_id,
    } = body;

    if (!nom || !prenom || !email || !organization_id) {
      return NextResponse.json(
        { error: "Missing required fields: nom, prenom, email, organization_id" },
        { status: 400 }
      );
    }

    const { data: newConsultant, error } = await supabase
      .from("consultant")
      .insert({
        nom,
        prenom,
        email,
        date_embauche,
        taux_journalier_cout,
        taux_journalier_vente,
        role,
        statut: statut || "DISPONIBLE",
        manager_id,
        user_id,
        organization_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating consultant:", error);
      return NextResponse.json({ error: error.message || "Failed to create consultant" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "CONSULTANT_CREATED",
      description: `Created consultant: ${newConsultant.nom} ${newConsultant.prenom}`,
      metadata: { consultant_id: newConsultant.id },
    });

    return NextResponse.json({ consultant: newConsultant });
  } catch (error) {
    console.error("Error in POST /api/admin/consultants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
