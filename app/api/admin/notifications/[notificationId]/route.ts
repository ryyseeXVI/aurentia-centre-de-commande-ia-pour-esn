// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { updateNotificationSchema } from "@/lib/validations/notification";

export async function PATCH(request: NextRequest, context: { params: Promise<{ notificationId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { notificationId } = await context.params;
    const body = await request.json();

    const validation = updateNotificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { type, title, message, link, metadata } = validation.data;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (link !== undefined) updateData.link = link || null;
    if (metadata !== undefined) updateData.metadata = metadata || null;

    const { data, error } = await supabase.from("notification").update(updateData).eq("id", notificationId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "NOTIFICATION_UPDATED",
      description: `Updated notification: ${data.title}`,
      metadata: { notification_id: data.id },
    });

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error("Error in PATCH /api/admin/notifications/[notificationId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ notificationId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN" && (profile as any)?.role !== "OWNER") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { notificationId } = await context.params;

    // Get notification details before deletion for logging
    const { data: notification } = await supabase
      .from("notification")
      .select("title")
      .eq("id", notificationId)
      .single();

    const { error } = await supabase.from("notification").delete().eq("id", notificationId);
    if (error) return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });

    if (notification) {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "NOTIFICATION_DELETED",
        description: `Deleted notification: ${notification.title}`,
        metadata: { notification_id: notificationId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/notifications/[notificationId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
