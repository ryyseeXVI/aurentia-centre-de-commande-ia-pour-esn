// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/admin/organizations
 * Get all organizations (Admin only)
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching organizations:", error);
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 },
      );
    }

    return NextResponse.json({ organizations: organizations || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/organizations
 * Create organization or bulk operations (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Check if bulk operation
    if (body.operation) {
      const { operation, organization_ids } = body;

      if (operation === "bulk_delete") {
        const { error } = await supabase
          .from("organizations")
          .delete()
          .in("id", organization_ids);

        if (error) {
          console.error("Error bulk deleting organizations:", error);
          return NextResponse.json(
            { error: "Failed to delete organizations" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          deleted: organization_ids.length,
        });
      }
    } else {
      // Create new organization
      const { name, slug, description, logo_url } = body;

      const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({
          name,
          slug,
          description,
          logo_url,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating organization:", error);
        return NextResponse.json(
          { error: error.message || "Failed to create organization" },
          { status: 500 },
        );
      }

      return NextResponse.json({ organization: newOrg });
    }
  } catch (error) {
    console.error("Error in POST /api/admin/organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
