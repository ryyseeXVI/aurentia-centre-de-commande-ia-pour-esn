// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    // Filter by unread if requested
    if (unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Transform to camelCase
    const transformedNotifications =
      notifications?.map((notif: any) => ({
        id: notif.id,
        userId: notif.user_id,
        organizationId: notif.organization_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        metadata: notif.metadata,
        readAt: notif.read_at,
        createdAt: notif.created_at,
      })) || [];

    // Calculate unread count
    const unreadCount = transformedNotifications.filter(n => !n.readAt).length;

    return NextResponse.json({
      data: {
        notifications: transformedNotifications,
        unreadCount,
      },
      pagination: {
        limit,
        offset,
        total: transformedNotifications.length,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
