// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { bulkCreateNotificationSchema, createNotificationSchema } from "@/lib/validations/notification";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { data: notifications, error } = await supabase
      .from("notification")
      .select(`
        *,
        user:profiles!notification_user_id_fkey(id, prenom, nom, email),
        organization:organizations(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
    if ((profile as any)?.role !== "ADMIN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const body = await request.json();

    // Handle bulk delete operation
    if (body.operation === "bulk_delete") {
      const { notification_ids } = body;
      if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
        return NextResponse.json({ error: "Invalid notification_ids" }, { status: 400 });
      }

      const { error } = await supabase.from("notification").delete().in("id", notification_ids);
      if (error) return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BULK_DELETE_NOTIFICATIONS",
        description: `Deleted ${notification_ids.length} notifications`,
        metadata: { notification_ids },
      });

      return NextResponse.json({ success: true, deleted: notification_ids.length });
    }

    // Handle broadcast operation
    if (body.operation === "broadcast") {
      const validation = bulkCreateNotificationSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
      }

      const { organization_id, type, title, message, link, metadata, recipient_type, role, user_ids } = validation.data;

      // Get recipient user IDs based on recipient_type
      let recipientIds: string[] = [];

      if (recipient_type === "ALL") {
        const { data: users } = await supabase
          .from("user_organizations")
          .select("user_id")
          .eq("organization_id", organization_id);
        recipientIds = users?.map((u: any) => u.user_id) || [];
      } else if (recipient_type === "ROLE" && role) {
        const { data: users } = await supabase
          .from("user_organizations")
          .select("user_id")
          .eq("organization_id", organization_id)
          .eq("role", role);
        recipientIds = users?.map((u: any) => u.user_id) || [];
      } else if (recipient_type === "SPECIFIC_USERS" && user_ids) {
        recipientIds = user_ids;
      }

      if (recipientIds.length === 0) {
        return NextResponse.json({ error: "No recipients found" }, { status: 400 });
      }

      // Create notifications for all recipients
      const notificationsToCreate = recipientIds.map(recipientId => ({
        user_id: recipientId,
        organization_id,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null,
      }));

      const { data: createdNotifications, error } = await supabase
        .from("notification")
        .insert(notificationsToCreate)
        .select();

      if (error) return NextResponse.json({ error: error.message || "Failed to broadcast notifications" }, { status: 500 });

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        organization_id: (profile as any).organization_id,
        action: "BROADCAST_NOTIFICATION",
        description: `Broadcast notification to ${recipientIds.length} users: ${title}`,
        metadata: { notification_count: recipientIds.length, type, recipient_type },
      });

      return NextResponse.json({ notifications: createdNotifications, count: recipientIds.length });
    }

    // Handle single notification creation
    const validation = createNotificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { user_id, organization_id, type, title, message, link, metadata } = validation.data;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required for single notification" }, { status: 400 });
    }

    const { data: newNotification, error } = await supabase
      .from("notification")
      .insert({ user_id, organization_id, type, title, message, link: link || null, metadata: metadata || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message || "Failed to create notification" }, { status: 500 });

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      organization_id: (profile as any).organization_id,
      action: "NOTIFICATION_CREATED",
      description: `Created notification: ${newNotification.title}`,
      metadata: { notification_id: newNotification.id },
    });

    return NextResponse.json({ notification: newNotification });
  } catch (error) {
    console.error("Error in POST /api/admin/notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
