// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ milestoneId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { milestoneId } = await context.params;
    const body = await request.json();
    const { nom, description, date_debut, date_fin, statut, priorite, couleur } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nom !== undefined) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (date_debut !== undefined) updateData.date_debut = date_debut;
    if (date_fin !== undefined) updateData.date_fin = date_fin;
    if (statut !== undefined) updateData.statut = statut;
    if (priorite !== undefined) updateData.priorite = priorite;
    if (couleur !== undefined) updateData.couleur = couleur;

    const { data, error } = await supabase.from("milestone").update(updateData).eq("id", milestoneId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ milestone: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ milestoneId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { milestoneId } = await context.params;
    const { error } = await supabase.from("milestone").delete().eq("id", milestoneId);
    if (error) return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
