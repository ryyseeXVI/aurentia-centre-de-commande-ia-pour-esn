import { z } from "zod";

export const notificationSchema = z.object({
  user_id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  type: z.enum([
    "INFO",
    "SUCCESS",
    "WARNING",
    "ERROR",
    "SYSTEM",
    "TASK_CREATED",
    "TASK_ASSIGNED",
    "TASK_REASSIGNED",
    "TASK_STATUS_CHANGED",
    "TASK_COMPLETED",
    "TASK_UPDATED",
    "TASK_DELETED",
    "MILESTONE_CREATED",
    "MILESTONE_ASSIGNED",
    "MILESTONE_UNASSIGNED",
    "MILESTONE_UPDATED",
    "MILESTONE_COMPLETED",
    "MILESTONE_DELETED",
    "MILESTONE_TASK_LINKED",
    "MILESTONE_REACHED",
    "PROJECT_CREATED",
    "PROJECT_UPDATED",
    "PROJECT_DELETED",
    "PROJECT_UPDATE",
    "CONSULTANT_CREATED",
    "CONSULTANT_UPDATED",
    "ORG_MEMBER_ADDED",
    "ORG_CREATED",
    "WELCOME_TO_ORG",
    "WELCOME_ORG_ADMIN",
  ]),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message is too long"),
  link: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.any()).optional(),
});

export const createNotificationSchema = notificationSchema;

export const updateNotificationSchema = notificationSchema.partial();

export const bulkCreateNotificationSchema = z.object({
  organization_id: z.string().uuid(),
  type: z.enum([
    "INFO",
    "SUCCESS",
    "WARNING",
    "ERROR",
    "SYSTEM",
    "TASK_CREATED",
    "TASK_ASSIGNED",
    "TASK_REASSIGNED",
    "TASK_STATUS_CHANGED",
    "TASK_COMPLETED",
    "TASK_UPDATED",
    "TASK_DELETED",
    "MILESTONE_CREATED",
    "MILESTONE_ASSIGNED",
    "MILESTONE_UNASSIGNED",
    "MILESTONE_UPDATED",
    "MILESTONE_COMPLETED",
    "MILESTONE_DELETED",
    "MILESTONE_TASK_LINKED",
    "MILESTONE_REACHED",
    "PROJECT_CREATED",
    "PROJECT_UPDATED",
    "PROJECT_DELETED",
    "PROJECT_UPDATE",
    "CONSULTANT_CREATED",
    "CONSULTANT_UPDATED",
    "ORG_MEMBER_ADDED",
    "ORG_CREATED",
    "WELCOME_TO_ORG",
    "WELCOME_ORG_ADMIN",
  ]),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message is too long"),
  link: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.any()).optional(),
  recipient_type: z.enum(["ALL", "ROLE", "SPECIFIC_USERS"]),
  role: z
    .enum(["ADMIN", "MANAGER", "CONSULTANT", "CLIENT"])
    .optional()
    .nullable(),
  user_ids: z.array(z.string().uuid()).optional().nullable(),
});

export type NotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationUpdate = z.infer<typeof updateNotificationSchema>;
export type BulkNotificationInput = z.infer<typeof bulkCreateNotificationSchema>;
