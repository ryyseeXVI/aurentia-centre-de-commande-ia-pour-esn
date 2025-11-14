// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/projects/[projectId]/tags
 * Get all unique tags used in a project's tasks
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get project to verify access
    const { data: project, error: projectError } = await supabase
      .from("projet")
      .select("id, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user has access to this project's organization
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", project.organization_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to access this project" },
        { status: 403 },
      );
    }

    // Fetch all tasks from this project
    const { data: tasks, error: tasksError } = await supabase
      .from("tache")
      .select("tags")
      .eq("projet_id", projectId);

    if (tasksError) {
      logger.error("Error fetching tasks for tags", tasksError, { projectId });
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 },
      );
    }

    // Extract unique tags and create tag objects
    const tagSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            tagSet.add(tag.trim());
          }
        });
      }
    });

    // Generate consistent colors for tags based on hash
    const generateColor = (str: string): string => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = [
        "#3b82f6", // blue
        "#10b981", // green
        "#f59e0b", // amber
        "#ef4444", // red
        "#8b5cf6", // purple
        "#ec4899", // pink
        "#06b6d4", // cyan
        "#f97316", // orange
        "#84cc16", // lime
        "#6366f1", // indigo
      ];
      return colors[Math.abs(hash) % colors.length];
    };

    // Convert to array of tag objects
    const tags = Array.from(tagSet).map((tag) => ({
      id: tag,
      name: tag,
      color: generateColor(tag),
    }));

    return NextResponse.json({ data: tags });
  } catch (error) {
    logger.error("Error in GET /api/projects/[projectId]/tags", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
