// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/admin/users
 *
 * Get all users (Admin only)
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
      .select("role")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/users
 *
 * Bulk operations on users (Admin only)
 * Supports: bulk_delete, bulk_update_roles
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { operation, user_ids, role } = body;

    if (!operation || !user_ids || !Array.isArray(user_ids)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Prevent operations on self
    const safeUserIds = user_ids.filter((id) => id !== user.id);

    if (operation === "bulk_delete") {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .in("id", safeUserIds);

      if (error) {
        console.error("Error bulk deleting users:", error);
        return NextResponse.json(
          { error: "Failed to delete users" },
          { status: 500 },
        );
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_USERS",
        description: `Deleted ${safeUserIds.length} users`,
        metadata: { user_ids: safeUserIds },
      });

      return NextResponse.json({ success: true, deleted: safeUserIds.length });
    } else if (operation === "bulk_update_roles") {
      if (!role) {
        return NextResponse.json(
          { error: "Role is required for bulk update" },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .in("id", safeUserIds);

      if (error) {
        console.error("Error bulk updating user roles:", error);
        return NextResponse.json(
          { error: "Failed to update user roles" },
          { status: 500 },
        );
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_UPDATE_USER_ROLES",
        description: `Updated ${safeUserIds.length} users to role ${role}`,
        metadata: { user_ids: safeUserIds, role },
      });

      return NextResponse.json({ success: true, updated: safeUserIds.length });
    } else {
      return NextResponse.json(
        { error: "Invalid operation" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
