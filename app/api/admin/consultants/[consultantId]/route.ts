// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ consultantId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { consultantId } = await context.params;
    const { nom, prenom, email, role, statut, date_embauche, taux_journalier_cout, taux_journalier_vente, manager_id } = await request.json();

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (statut) updateData.statut = statut;
    if (date_embauche) updateData.date_embauche = date_embauche;
    if (taux_journalier_cout !== undefined) updateData.taux_journalier_cout = taux_journalier_cout;
    if (taux_journalier_vente !== undefined) updateData.taux_journalier_vente = taux_journalier_vente;
    if (manager_id !== undefined) updateData.manager_id = manager_id;

    const { data, error } = await supabase.from("consultant").update(updateData).eq("id", consultantId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ consultant: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ consultantId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { consultantId } = await context.params;
    const { error } = await supabase.from("consultant").delete().eq("id", consultantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
