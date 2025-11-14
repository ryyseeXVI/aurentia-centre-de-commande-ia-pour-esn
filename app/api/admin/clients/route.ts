// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { data: clients, error } = await supabase.from("client").select("*, organization:organizations(name), contact_user:profiles(prenom, nom)").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/clients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    if (body.operation) {
      const { operation, client_ids } = body;

      if (operation === "bulk_delete") {
        const { error } = await supabase.from("client").delete().in("id", client_ids);

        if (error) {
          console.error("Error bulk deleting clients:", error);
          return NextResponse.json({ error: "Failed to delete clients" }, { status: 500 });
        }

        await supabase.from("activity_logs").insert({
          user_id: user.id,
          organization_id: (profile as any).organization_id,
          action: "BULK_DELETE_CLIENTS",
          description: `Deleted ${client_ids.length} clients`,
          metadata: { client_ids },
        });

        return NextResponse.json({ success: true, deleted: client_ids.length });
      }
    } else {
      const { nom, contact_principal, secteur, contact_user_id, organization_id } = body;

      const { data: newClient, error } = await supabase.from("client").insert({
        nom,
        contact_principal,
        secteur,
        contact_user_id,
        organization_id,
      }).select().single();

      if (error) {
        console.error("Error creating client:", error);
        return NextResponse.json({ error: error.message || "Failed to create client" }, { status: 500 });
      }

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: organization_id,
        action: "CLIENT_CREATED",
        description: `Created client: ${nom}`,
        metadata: { client_id: newClient.id },
      });

      return NextResponse.json({ client: newClient });
    }
  } catch (error) {
    console.error("Error in POST /api/admin/clients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
