import { createClient } from "@/lib/supabase/server";

/**
 * Notification Helper Functions
 * Use these functions to create notifications throughout the application
 */

type NotificationType =
  | "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM"
  | "TASK_CREATED" | "TASK_ASSIGNED" | "TASK_REASSIGNED" | "TASK_STATUS_CHANGED"
  | "TASK_COMPLETED" | "TASK_UPDATED" | "TASK_DELETED"
  | "MILESTONE_CREATED" | "MILESTONE_ASSIGNED" | "MILESTONE_UNASSIGNED"
  | "MILESTONE_UPDATED" | "MILESTONE_COMPLETED" | "MILESTONE_DELETED"
  | "MILESTONE_TASK_LINKED" | "MILESTONE_REACHED"
  | "PROJECT_CREATED" | "PROJECT_UPDATED" | "PROJECT_DELETED" | "PROJECT_UPDATE"
  | "CONSULTANT_CREATED" | "CONSULTANT_UPDATED"
  | "ORG_MEMBER_ADDED" | "ORG_CREATED" | "WELCOME_TO_ORG" | "WELCOME_ORG_ADMIN";

interface CreateNotificationParams {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a single notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from("notification").insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      metadata: params.metadata || null,
    });

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in createNotification:", error);
    return { success: false, error };
  }
}

/**
 * Notify all users in an organization
 */
export async function notifyOrganization(params: Omit<CreateNotificationParams, "userId">) {
  try {
    const supabase = await createClient();

    // Get all users in the organization
    const { data: members } = await supabase
      .from("user_organizations")
      .select("user_id")
      .eq("organization_id", params.organizationId);

    if (!members || members.length === 0) {
      return { success: true, count: 0 };
    }

    const typedMembers = members as unknown as { user_id: string }[];

    // Create notifications for all members
    const notifications = typedMembers.map((member) => ({
      user_id: member.user_id,
      organization_id: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      metadata: params.metadata || null,
    }));

    const { error } = await supabase.from("notification").insert(notifications);

    if (error) {
      console.error("Error notifying organization:", error);
      return { success: false, error };
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Error in notifyOrganization:", error);
    return { success: false, error };
  }
}

/**
 * Notify users by role within an organization
 */
export async function notifyByRole(
  params: Omit<CreateNotificationParams, "userId"> & { role: "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT" }
) {
  try {
    const supabase = await createClient();

    // Get all users with the specified role in the organization
    const { data: members } = await supabase
      .from("user_organizations")
      .select("user_id")
      .eq("organization_id", params.organizationId)
      .eq("role", params.role);

    if (!members || members.length === 0) {
      return { success: true, count: 0 };
    }

    const typedMembers = members as unknown as { user_id: string }[];

    // Create notifications for all matching members
    const notifications = typedMembers.map((member) => ({
      user_id: member.user_id,
      organization_id: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      metadata: params.metadata || null,
    }));

    const { error } = await supabase.from("notification").insert(notifications);

    if (error) {
      console.error("Error notifying by role:", error);
      return { success: false, error };
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error("Error in notifyByRole:", error);
    return { success: false, error };
  }
}

/**
 * Convenience functions for common notification scenarios
 */

export async function notifyTaskAssigned(params: {
  assigneeId: string;
  assignerId: string;
  organizationId: string;
  taskTitle: string;
  taskId: string;
}) {
  return createNotification({
    userId: params.assigneeId,
    organizationId: params.organizationId,
    type: "TASK_ASSIGNED",
    title: "New Task Assigned",
    message: `You have been assigned to: ${params.taskTitle}`,
    link: `/app/tasks/${params.taskId}`,
    metadata: {
      task_id: params.taskId,
      assigner_id: params.assignerId,
    },
  });
}

export async function notifyTaskCompleted(params: {
  userId: string;
  organizationId: string;
  taskTitle: string;
  taskId: string;
  completedBy: string;
}) {
  return createNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    type: "TASK_COMPLETED",
    title: "Task Completed",
    message: `Task "${params.taskTitle}" has been completed`,
    link: `/app/tasks/${params.taskId}`,
    metadata: {
      task_id: params.taskId,
      completed_by: params.completedBy,
    },
  });
}

export async function notifyProjectUpdate(params: {
  organizationId: string;
  projectId: string;
  projectName: string;
  updateMessage: string;
}) {
  return notifyOrganization({
    organizationId: params.organizationId,
    type: "PROJECT_UPDATE",
    title: `Project Update: ${params.projectName}`,
    message: params.updateMessage,
    link: `/app/projects/${params.projectId}`,
    metadata: {
      project_id: params.projectId,
    },
  });
}

export async function notifyMilestoneReached(params: {
  organizationId: string;
  milestoneId: string;
  milestoneName: string;
  projectId?: string;
}) {
  return notifyOrganization({
    organizationId: params.organizationId,
    type: "MILESTONE_REACHED",
    title: "Milestone Reached!",
    message: `Congratulations! The milestone "${params.milestoneName}" has been reached.`,
    link: params.projectId ? `/app/projects/${params.projectId}` : undefined,
    metadata: {
      milestone_id: params.milestoneId,
      project_id: params.projectId,
    },
  });
}

/**
 * ============================================================================
 * ENHANCED NOTIFICATION FUNCTIONS FOR COMPREHENSIVE EVENT COVERAGE
 * ============================================================================
 */

/**
 * Task Creation Notification
 */
export async function notifyTaskCreated(params: {
  taskId: string;
  taskTitle: string;
  assigneeId?: string;
  projectManagerId: string;
  projectId: string;
  organizationId: string;
  creatorId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Notify assignee if task was assigned during creation
  if (params.assigneeId && params.assigneeId !== params.creatorId) {
    notifications.push({
      user_id: params.assigneeId,
      organization_id: params.organizationId,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `You have been assigned to: ${params.taskTitle}`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: { task_id: params.taskId, creator_id: params.creatorId },
    });
  }

  // Notify project manager if they're not the creator
  if (params.projectManagerId && params.projectManagerId !== params.creatorId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "TASK_CREATED",
      title: "New Task Created",
      message: `Task "${params.taskTitle}" was created in your project`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: { task_id: params.taskId, creator_id: params.creatorId },
    });
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) {
      console.error("Error creating task notifications:", error);
      return { success: false, error };
    }
  }

  return { success: true, count: notifications.length };
}

/**
 * Task Reassignment Notification (handles both old and new assignee)
 */
export async function notifyTaskReassigned(params: {
  taskId: string;
  taskTitle: string;
  newAssigneeId: string;
  oldAssigneeId: string;
  projectManagerId?: string;
  projectId: string;
  organizationId: string;
  reassignerId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Notify new assignee
  notifications.push({
    user_id: params.newAssigneeId,
    organization_id: params.organizationId,
    type: "TASK_ASSIGNED",
    title: "Task Assigned to You",
    message: `You have been assigned to: ${params.taskTitle}`,
    link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
    metadata: {
      task_id: params.taskId,
      reassigner_id: params.reassignerId,
      previous_assignee_id: params.oldAssigneeId,
    },
  });

  // Notify old assignee
  notifications.push({
    user_id: params.oldAssigneeId,
    organization_id: params.organizationId,
    type: "TASK_REASSIGNED",
    title: "Task Reassigned",
    message: `Task "${params.taskTitle}" has been reassigned to another team member`,
    link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
    metadata: {
      task_id: params.taskId,
      new_assignee_id: params.newAssigneeId,
    },
  });

  // Notify project manager if they exist and aren't the reassigner
  if (params.projectManagerId && params.projectManagerId !== params.reassignerId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "TASK_REASSIGNED",
      title: "Task Reassignment",
      message: `Task "${params.taskTitle}" was reassigned`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: {
        task_id: params.taskId,
        old_assignee_id: params.oldAssigneeId,
        new_assignee_id: params.newAssigneeId,
      },
    });
  }

  const { error } = await supabase.from("notification").insert(notifications);
  if (error) {
    console.error("Error creating reassignment notifications:", error);
    return { success: false, error };
  }

  return { success: true, count: notifications.length };
}

/**
 * Task Status Change Notification
 */
export async function notifyTaskStatusChanged(params: {
  taskId: string;
  taskTitle: string;
  assigneeId?: string;
  projectManagerId?: string;
  oldStatus: string;
  newStatus: string;
  projectId: string;
  organizationId: string;
  changerId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  const isCompleted = params.newStatus === "done" || params.newStatus === "TERMINE";
  const notifType = isCompleted ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED";
  const title = isCompleted ? "Task Completed!" : "Task Status Updated";
  const message = isCompleted
    ? `Task "${params.taskTitle}" has been completed!`
    : `Task "${params.taskTitle}" moved from ${params.oldStatus} to ${params.newStatus}`;

  // Notify assignee if they exist and aren't the changer
  if (params.assigneeId && params.assigneeId !== params.changerId) {
    notifications.push({
      user_id: params.assigneeId,
      organization_id: params.organizationId,
      type: notifType,
      title,
      message,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: {
        task_id: params.taskId,
        old_status: params.oldStatus,
        new_status: params.newStatus,
        changer_id: params.changerId,
      },
    });
  }

  // Notify project manager if completed and they're not the changer
  if (isCompleted && params.projectManagerId && params.projectManagerId !== params.changerId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "TASK_COMPLETED",
      title: "Task Completed in Your Project",
      message: `Task "${params.taskTitle}" was marked as complete`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: {
        task_id: params.taskId,
        completed_by: params.changerId,
      },
    });
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) {
      console.error("Error creating status change notifications:", error);
      return { success: false, error };
    }
  }

  return { success: true, count: notifications.length };
}

/**
 * Task Deletion Notification
 */
export async function notifyTaskDeleted(params: {
  taskTitle: string;
  assigneeId?: string;
  projectManagerId?: string;
  projectId: string;
  organizationId: string;
  deleterId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Notify assignee if they exist and aren't the deleter
  if (params.assigneeId && params.assigneeId !== params.deleterId) {
    notifications.push({
      user_id: params.assigneeId,
      organization_id: params.organizationId,
      type: "TASK_DELETED",
      title: "Task Deleted",
      message: `Task "${params.taskTitle}" has been deleted`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: {
        task_title: params.taskTitle,
        deleter_id: params.deleterId,
      },
    });
  }

  // Notify project manager if they aren't the deleter
  if (params.projectManagerId && params.projectManagerId !== params.deleterId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "TASK_DELETED",
      title: "Task Deleted from Project",
      message: `Task "${params.taskTitle}" was deleted`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: {
        task_title: params.taskTitle,
        deleter_id: params.deleterId,
      },
    });
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) {
      console.error("Error creating deletion notifications:", error);
      return { success: false, error };
    }
  }

  return { success: true, count: notifications.length };
}

/**
 * Milestone Assignment Notification
 */
export async function notifyMilestoneAssigned(params: {
  milestoneId: string;
  milestoneName: string;
  assigneeId: string;
  assignerRole: string;
  projectId?: string;
  organizationId: string;
  assignerId: string;
}) {
  return createNotification({
    userId: params.assigneeId,
    organizationId: params.organizationId,
    type: "MILESTONE_ASSIGNED",
    title: "Assigned to Milestone",
    message: `You have been assigned as ${params.assignerRole} for milestone: ${params.milestoneName}`,
    link: params.projectId
      ? `/app/organizations/${params.organizationId}/projects/${params.projectId}`
      : undefined,
    metadata: {
      milestone_id: params.milestoneId,
      role: params.assignerRole,
      assigner_id: params.assignerId,
    },
  });
}

/**
 * Milestone Completion Notification (broadcast to organization)
 */
export async function notifyMilestoneCompleted(params: {
  milestoneId: string;
  milestoneName: string;
  projectId?: string;
  organizationId: string;
  completerId: string;
}) {
  return notifyOrganization({
    organizationId: params.organizationId,
    type: "MILESTONE_COMPLETED",
    title: "🎉 Milestone Completed!",
    message: `Congratulations! Milestone "${params.milestoneName}" has been completed!`,
    link: params.projectId
      ? `/app/organizations/${params.organizationId}/projects/${params.projectId}`
      : undefined,
    metadata: {
      milestone_id: params.milestoneId,
      completer_id: params.completerId,
    },
  });
}

/**
 * Project Creation Notification
 */
export async function notifyProjectCreated(params: {
  projectId: string;
  projectName: string;
  projectManagerId?: string;
  organizationId: string;
  creatorId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Notify project manager if they're not the creator
  if (params.projectManagerId && params.projectManagerId !== params.creatorId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "PROJECT_CREATED",
      title: "You're Managing a New Project",
      message: `You have been assigned as project manager for: ${params.projectName}`,
      link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
      metadata: {
        project_id: params.projectId,
        creator_id: params.creatorId,
      },
    });
  }

  // Notify all organization admins
  const { data: admins } = await supabase
    .from("user_organizations")
    .select("user_id")
    .eq("organization_id", params.organizationId)
    .eq("role", "ADMIN");

  const typedAdmins = (admins || []) as unknown as { user_id: string }[];

  if (typedAdmins.length > 0) {
    typedAdmins.forEach((admin) => {
      if (admin.user_id !== params.creatorId) {
        notifications.push({
          user_id: admin.user_id,
          organization_id: params.organizationId,
          type: "PROJECT_CREATED",
          title: "New Project Created",
          message: `Project "${params.projectName}" has been created`,
          link: `/app/organizations/${params.organizationId}/projects/${params.projectId}`,
          metadata: {
            project_id: params.projectId,
            creator_id: params.creatorId,
          },
        });
      }
    });
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) {
      console.error("Error creating project notifications:", error);
      return { success: false, error };
    }
  }

  return { success: true, count: notifications.length };
}

/**
 * Organization Member Added Notification
 */
export async function notifyMemberAdded(params: {
  newMemberId: string;
  organizationId: string;
  organizationName: string;
  role: string;
  adderId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Welcome notification for new member
  notifications.push({
    user_id: params.newMemberId,
    organization_id: params.organizationId,
    type: "WELCOME_TO_ORG",
    title: `Welcome to ${params.organizationName}!`,
    message: `You have been added to ${params.organizationName} as a ${params.role}`,
    link: `/app/organizations/${params.organizationId}`,
    metadata: {
      role: params.role,
      adder_id: params.adderId,
    },
  });

  // Notify organization admins
  const { data: admins } = await supabase
    .from("user_organizations")
    .select("user_id")
    .eq("organization_id", params.organizationId)
    .eq("role", "ADMIN");

  const typedAdmins = (admins || []) as unknown as { user_id: string }[];

  if (typedAdmins.length > 0) {
    typedAdmins.forEach((admin) => {
      if (admin.user_id !== params.adderId && admin.user_id !== params.newMemberId) {
        notifications.push({
          user_id: admin.user_id,
          organization_id: params.organizationId,
          type: "ORG_MEMBER_ADDED",
          title: "New Member Added",
          message: `A new ${params.role} has joined ${params.organizationName}`,
          link: `/app/organizations/${params.organizationId}`,
          metadata: {
            new_member_id: params.newMemberId,
            role: params.role,
          },
        });
      }
    });
  }

  const { error } = await supabase.from("notification").insert(notifications);
  if (error) {
    console.error("Error creating member added notifications:", error);
    return { success: false, error };
  }

  return { success: true, count: notifications.length };
}

/**
 * Milestone Deletion Notification
 */
export async function notifyMilestoneDeleted(params: {
  milestoneName: string;
  assignedUserIds: string[];
  projectManagerId?: string;
  projectId?: string;
  organizationId: string;
  deleterId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Notify all assigned users
  params.assignedUserIds.forEach((userId) => {
    if (userId !== params.deleterId) {
      notifications.push({
        user_id: userId,
        organization_id: params.organizationId,
        type: "MILESTONE_DELETED",
        title: "Milestone Deleted",
        message: `Milestone "${params.milestoneName}" has been deleted`,
        link: params.projectId
          ? `/app/organizations/${params.organizationId}/projects/${params.projectId}`
          : undefined,
        metadata: {
          milestone_name: params.milestoneName,
          deleter_id: params.deleterId,
        },
      });
    }
  });

  // Notify project manager if they aren't the deleter
  if (params.projectManagerId && params.projectManagerId !== params.deleterId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "MILESTONE_DELETED",
      title: "Milestone Deleted from Project",
      message: `Milestone "${params.milestoneName}" was deleted`,
      link: params.projectId
        ? `/app/organizations/${params.organizationId}/projects/${params.projectId}`
        : undefined,
      metadata: {
        milestone_name: params.milestoneName,
        deleter_id: params.deleterId,
      },
    });
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) {
      console.error("Error creating milestone deletion notifications:", error);
      return { success: false, error };
    }
  }

  return { success: true, count: notifications.length };
}

/**
 * Project Deletion Notification
 */
export async function notifyProjectDeleted(params: {
  projectName: string;
  projectManagerId?: string;
  teamMemberIds: string[];
  organizationId: string;
  deleterId: string;
}) {
  const supabase = await createClient();
  const notifications: any[] = [];

  // Notify project manager
  if (params.projectManagerId && params.projectManagerId !== params.deleterId) {
    notifications.push({
      user_id: params.projectManagerId,
      organization_id: params.organizationId,
      type: "PROJECT_DELETED",
      title: "Project Deleted",
      message: `Project "${params.projectName}" has been deleted`,
      link: `/app/organizations/${params.organizationId}`,
      metadata: {
        project_name: params.projectName,
        deleter_id: params.deleterId,
      },
    });
  }

  // Notify all team members
  params.teamMemberIds.forEach((memberId) => {
    if (memberId !== params.deleterId && memberId !== params.projectManagerId) {
      notifications.push({
        user_id: memberId,
        organization_id: params.organizationId,
        type: "PROJECT_DELETED",
        title: "Project Deleted",
        message: `Project "${params.projectName}" has been deleted`,
        link: `/app/organizations/${params.organizationId}`,
        metadata: {
          project_name: params.projectName,
          deleter_id: params.deleterId,
        },
      });
    }
  });

  // Notify organization admins
  const { data: admins } = await supabase
    .from("user_organizations")
    .select("user_id")
    .eq("organization_id", params.organizationId)
    .eq("role", "ADMIN");

  const typedAdmins = (admins || []) as unknown as { user_id: string }[];

  if (typedAdmins.length > 0) {
    typedAdmins.forEach((admin) => {
      if (admin.user_id !== params.deleterId) {
        notifications.push({
          user_id: admin.user_id,
          organization_id: params.organizationId,
          type: "PROJECT_DELETED",
          title: "Project Deleted",
          message: `Project "${params.projectName}" was deleted`,
          link: `/app/organizations/${params.organizationId}`,
          metadata: {
            project_name: params.projectName,
            deleter_id: params.deleterId,
          },
        });
      }
    });
  }

  if (notifications.length > 0) {
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) {
      console.error("Error creating project deletion notifications:", error);
      return { success: false, error };
    }
  }

  return { success: true, count: notifications.length };
}
