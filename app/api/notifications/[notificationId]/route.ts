import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

type Params = {
  params: Promise<{
    notificationId: string;
  }>;
};

/**
 * PATCH /api/notifications/[notificationId]
 * Mark a notification as read
 */
export async function PATCH(_request: Request, { params }: Params) {
  try {
    const { notificationId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify notification belongs to user
    const { data: notification } = await supabase
      .from("notifications")
      .select("id, user_id")
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .single();

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    // Mark as read
    const { data: updatedNotification, error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error marking notification as read:", updateError);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformed = {
      id: updatedNotification.id,
      userId: updatedNotification.user_id,
      organizationId: updatedNotification.organization_id,
      type: updatedNotification.type,
      title: updatedNotification.title,
      message: updatedNotification.message,
      link: updatedNotification.link,
      metadata: updatedNotification.metadata,
      readAt: updatedNotification.read_at,
      createdAt: updatedNotification.created_at,
    };

    return NextResponse.json({ notification: transformed });
  } catch (error) {
    console.error("Error in PATCH /api/notifications/[notificationId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notifications/[notificationId]
 * Delete a notification
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { notificationId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify notification belongs to user and delete
    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting notification:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete notification" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in DELETE /api/notifications/[notificationId]:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
