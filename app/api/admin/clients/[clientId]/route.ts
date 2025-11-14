// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ clientId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();

    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { clientId } = await context.params;
    const body = await request.json();
    const { nom, contact_principal, secteur, contact_user_id } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nom !== undefined) updateData.nom = nom;
    if (contact_principal !== undefined) updateData.contact_principal = contact_principal;
    if (secteur !== undefined) updateData.secteur = secteur;
    if (contact_user_id !== undefined) updateData.contact_user_id = contact_user_id;

    const { data: updatedClient, error } = await supabase.from("client").update(updateData).eq("id", clientId).select().single();

    if (error) {
      console.error("Error updating client:", error);
      return NextResponse.json({ error: error.message || "Failed to update client" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "CLIENT_UPDATED",
      description: `Updated client: ${updatedClient.nom}`,
      metadata: { client_id: clientId },
    });

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error("Error in PATCH /api/admin/clients/[clientId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ clientId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();

    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { clientId } = await context.params;

    const { error } = await supabase.from("client").delete().eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "CLIENT_DELETED",
      description: "Deleted client",
      metadata: { client_id: clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/clients/[clientId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
