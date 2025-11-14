/**
 * Client-Side Notification Helpers
 * Use these functions in Client Components to trigger notifications
 */

interface CreateNotificationParams {
  userId: string;
  organizationId: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "TASK_ASSIGNED" | "TASK_COMPLETED" | "PROJECT_UPDATE" | "MILESTONE_REACHED" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification via API call (client-side)
 */
export async function createNotificationClient(params: CreateNotificationParams) {
  try {
    const response = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create notification");
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

/**
 * Broadcast a notification to multiple users (client-side)
 */
export async function broadcastNotificationClient(params: {
  organizationId: string;
  type: CreateNotificationParams["type"];
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  recipientType: "ALL" | "ROLE" | "SPECIFIC_USERS";
  role?: "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT";
  userIds?: string[];
}) {
  try {
    const response = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "broadcast",
        organization_id: params.organizationId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || null,
        recipient_type: params.recipientType,
        role: params.role || null,
        user_ids: params.userIds || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to broadcast notification");
    }

    const result = await response.json();
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error broadcasting notification:", error);
    return { success: false, error };
  }
}

/**
 * Convenience functions for common notification scenarios (client-side)
 */

export async function notifyTaskAssignedClient(params: {
  assigneeId: string;
  organizationId: string;
  taskTitle: string;
  taskId: string;
}) {
  return createNotificationClient({
    userId: params.assigneeId,
    organizationId: params.organizationId,
    type: "TASK_ASSIGNED",
    title: "New Task Assigned",
    message: `You have been assigned to: ${params.taskTitle}`,
    link: `/app/tasks/${params.taskId}`,
    metadata: {
      task_id: params.taskId,
    },
  });
}

export async function notifyTaskCompletedClient(params: {
  userId: string;
  organizationId: string;
  taskTitle: string;
  taskId: string;
}) {
  return createNotificationClient({
    userId: params.userId,
    organizationId: params.organizationId,
    type: "TASK_COMPLETED",
    title: "Task Completed",
    message: `Task "${params.taskTitle}" has been completed`,
    link: `/app/tasks/${params.taskId}`,
    metadata: {
      task_id: params.taskId,
    },
  });
}

export async function notifyProjectUpdateClient(params: {
  organizationId: string;
  projectId: string;
  projectName: string;
  updateMessage: string;
}) {
  return broadcastNotificationClient({
    organizationId: params.organizationId,
    type: "PROJECT_UPDATE",
    title: `Project Update: ${params.projectName}`,
    message: params.updateMessage,
    link: `/app/projects/${params.projectId}`,
    recipientType: "ALL",
    metadata: {
      project_id: params.projectId,
    },
  });
}

export async function notifyMilestoneReachedClient(params: {
  organizationId: string;
  milestoneId: string;
  milestoneName: string;
  projectId?: string;
}) {
  return broadcastNotificationClient({
    organizationId: params.organizationId,
    type: "MILESTONE_REACHED",
    title: "Milestone Reached!",
    message: `Congratulations! The milestone "${params.milestoneName}" has been reached.`,
    link: params.projectId ? `/app/projects/${params.projectId}` : undefined,
    recipientType: "ALL",
    metadata: {
      milestone_id: params.milestoneId,
      project_id: params.projectId,
    },
  });
}
