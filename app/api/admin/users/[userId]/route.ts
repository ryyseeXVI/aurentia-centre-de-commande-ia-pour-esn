// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * PATCH /api/admin/users/[userId]
 *
 * Update a user (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
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

    const { userId } = await context.params;
    const body = await request.json();
    const { role, status, nom, prenom, phone, organization_id } = body;

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (phone !== undefined) updateData.phone = phone;
    if (organization_id !== undefined) updateData.organization_id = organization_id;

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "USER_UPDATED",
      description: `Updated user role to ${role}`,
      metadata: { target_user_id: userId },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[userId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]
 *
 * Delete a user (Admin only)
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
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

    const { userId } = await context.params;

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Delete user from profiles table
    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 },
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "USER_DELETED",
      description: "Deleted user account",
      metadata: { target_user_id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users/[userId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
