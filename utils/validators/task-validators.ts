/**
 * Task Validators - Zod schemas for task operations
 *
 * Validates all task-related API requests
 */

import { z } from "zod";
import { TaskStatus } from "@/types/tasks";

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  projetId: z.string().uuid("Invalid project ID"),
  nom: z
    .string()
    .min(1, "Task name is required")
    .max(255, "Task name must be less than 255 characters"),
  description: z.string().max(5000, "Description too long").optional(),
  statut: z.nativeEnum(TaskStatus).optional(),
  consultantResponsableId: z
    .string()
    .uuid("Invalid consultant ID")
    .optional()
    .nullable(),
  livrableId: z.string().uuid("Invalid livrable ID").optional().nullable(),
  chargeEstimeeJh: z
    .number()
    .positive("Charge must be positive")
    .max(10000, "Charge too large")
    .optional()
    .nullable(),
  dateFinCible: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(50, "Tag too long"))
    .max(20, "Too many tags")
    .optional(),
  position: z.number().int().min(0, "Position must be non-negative").optional(),
});

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  nom: z
    .string()
    .min(1, "Task name cannot be empty")
    .max(255, "Task name must be less than 255 characters")
    .optional(),
  description: z
    .string()
    .max(5000, "Description too long")
    .optional()
    .nullable(),
  statut: z.nativeEnum(TaskStatus).optional(),
  consultantResponsableId: z
    .string()
    .uuid("Invalid consultant ID")
    .optional()
    .nullable(),
  livrableId: z.string().uuid("Invalid livrable ID").optional().nullable(),
  chargeEstimeeJh: z
    .number()
    .positive("Charge must be positive")
    .max(10000, "Charge too large")
    .optional()
    .nullable(),
  dateFinCible: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(50, "Tag too long"))
    .max(20, "Too many tags")
    .optional(),
  position: z.number().int().min(0, "Position must be non-negative").optional(),
});

/**
 * Move task schema (for drag and drop)
 */
export const moveTaskSchema = z.object({
  statut: z.nativeEnum(TaskStatus, { errorMap: () => ({ message: "Status is required" }) }),
  position: z
    .number()
    .int("Position must be an integer")
    .min(0, "Position must be non-negative"),
});

/**
 * Task query parameters schema
 */
export const taskQuerySchema = z.object({
  projetId: z.string().uuid("Invalid project ID").optional(),
  statut: z
    .union([z.nativeEnum(TaskStatus), z.array(z.nativeEnum(TaskStatus))])
    .optional(),
  consultantResponsableId: z.string().uuid("Invalid consultant ID").optional(),
  livrableId: z.string().uuid("Invalid livrable ID").optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(255, "Search query too long").optional(),
  limit: z.number().int().positive().max(100, "Limit too large").optional(),
  offset: z.number().int().min(0, "Offset must be non-negative").optional(),
});

/**
 * Bulk update tasks schema
 */
export const bulkUpdateTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid("Invalid task ID"))
    .min(1, "At least one task ID required")
    .max(50, "Too many tasks"),
  updates: updateTaskSchema,
});

/**
 * Bulk delete tasks schema
 */
export const bulkDeleteTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid("Invalid task ID"))
    .min(1, "At least one task ID required")
    .max(50, "Too many tasks"),
});

/**
 * Assign consultant schema
 */
export const assignConsultantSchema = z.object({
  consultantResponsableId: z.string().uuid("Invalid consultant ID").nullable(),
});

/**
 * Update tags schema
 */
export const updateTagsSchema = z.object({
  tags: z.array(z.string().max(50, "Tag too long")).max(20, "Too many tags"),
});

/**
 * Reorder tasks schema (for reordering within a column)
 */
export const reorderTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid("Invalid task ID"))
    .min(1, "At least one task ID required"),
});
