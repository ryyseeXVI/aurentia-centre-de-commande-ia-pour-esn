// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

/**
 * GET /api/chat/groups
 * Get all group chats for the authenticated user
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

    // Get groups where user is a member
    // First, get group IDs where user is a member
    const { data: memberGroups } = await supabase
      .from("group_chat_members")
      .select("group_chat_id")
      .eq("user_id", user.id);

    const groupIds = (memberGroups || []).map((m: any) => m.group_chat_id);

    // Then get the full group details
    const { data: groups, error } = await supabase
      .from("group_chats")
      .select(
        `
        *,
        members:group_chat_members(count)
      `,
      )
      .in("id", groupIds);

    if (error) {
      console.error("Error fetching groups:", error);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 },
      );
    }

    return NextResponse.json({ groups: groups || [] });
  } catch (error) {
    console.error("Error in GET /api/chat/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/groups
 * Create a new group chat
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

    const body = await request.json();
    const { name, description, memberIds } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!(profile as any)?.organization_id) {
      return NextResponse.json(
        { error: "No organization associated with user" },
        { status: 403 },
      );
    }

    // Create group
    const { data: group, error: groupError } = await supabase
      .from("group_chats")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        organization_id: (profile as any).organization_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 },
      );
    }

    // Add creator as member
    const membersToAdd = [user.id, ...(memberIds || [])].filter(
      (id, index, self) => self.indexOf(id) === index,
    );

    const { error: membersError } = await supabase
      .from("group_chat_members")
      .insert(
        membersToAdd.map((userId) => ({
          group_chat_id: (group as any).id,
          user_id: userId,
        })),
      );

    if (membersError) {
      console.error("Error adding members:", membersError);
      // Delete the group if we can't add members
      await supabase.from("group_chats").delete().eq("id", (group as any).id);
      return NextResponse.json(
        { error: "Failed to add members" },
        { status: 500 },
      );
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chat/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
