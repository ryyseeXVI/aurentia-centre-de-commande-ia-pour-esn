/**
 * Validators for Milestone System
 * Uses Zod for runtime validation
 */

import { z } from "zod";

// =====================================================
// Validation Schemas
// =====================================================

/**
 * Milestone status enum
 */
export const milestoneStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "at_risk",
]);

/**
 * Milestone priority enum
 */
export const milestonePrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

/**
 * Dependency type enum
 */
export const dependencyTypeSchema = z.enum([
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
  "start_to_finish",
]);

/**
 * Progress mode enum
 */
export const progressModeSchema = z.enum(["auto", "manual"]);

/**
 * Assignment role enum
 */
export const assignmentRoleSchema = z.enum([
  "owner",
  "contributor",
  "reviewer",
]);

/**
 * Hex color validation (e.g., #3B82F6)
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #3B82F6)")
  .optional();

/**
 * Progress percentage validation (0-100)
 */
export const progressPercentageSchema = z
  .number()
  .int("Must be an integer")
  .min(0, "Must be at least 0")
  .max(100, "Must be at most 100")
  .optional();

/**
 * ISO date string validation
 */
export const isoDateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !Number.isNaN(date.getTime());
  },
  { message: "Must be a valid ISO date string" },
);

/**
 * Create milestone schema
 */
export const createMilestoneSchema = z
  .object({
    organizationId: z.string().uuid("Must be a valid UUID"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must be less than 255 characters")
      .transform((val) => val.trim()),
    description: z.string().optional(),
    startDate: isoDateSchema,
    dueDate: isoDateSchema,
    status: milestoneStatusSchema.default("not_started"),
    priority: milestonePrioritySchema.default("medium"),
    color: hexColorSchema,
    progressMode: progressModeSchema.default("auto"),
    progressPercentage: progressPercentageSchema.default(0),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const due = new Date(data.dueDate);
      return start <= due;
    },
    {
      message: "Start date must be before or equal to due date",
      path: ["dueDate"],
    },
  );

/**
 * Update milestone schema
 */
export const updateMilestoneSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .max(255, "Name must be less than 255 characters")
      .transform((val) => val.trim())
      .optional(),
    description: z.string().optional(),
    startDate: isoDateSchema.optional(),
    dueDate: isoDateSchema.optional(),
    status: milestoneStatusSchema.optional(),
    priority: milestonePrioritySchema.optional(),
    color: hexColorSchema,
    progressMode: progressModeSchema.optional(),
    progressPercentage: progressPercentageSchema,
  })
  .refine(
    (data) => {
      // If both dates are provided, validate range
      if (data.startDate && data.dueDate) {
        const start = new Date(data.startDate);
        const due = new Date(data.dueDate);
        return start <= due;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to due date",
      path: ["dueDate"],
    },
  );

/**
 * Add dependency schema
 */
export const addDependencySchema = z.object({
  dependsOnMilestoneId: z.string().uuid("Must be a valid UUID"),
  dependencyType: dependencyTypeSchema,
  lagDays: z.number().int("Must be an integer").default(0),
});

/**
 * Assign user schema
 */
export const assignUserSchema = z.object({
  userId: z.string().uuid("Must be a valid UUID"),
  role: assignmentRoleSchema.default("contributor"),
});

/**
 * Link tasks schema
 */
export const linkTasksSchema = z
  .object({
    taskCardIds: z
      .array(z.string().uuid("Must be a valid UUID"))
      .min(1, "At least one task ID is required"),
    weights: z
      .array(z.number().int("Must be an integer").positive("Must be positive"))
      .optional(),
  })
  .refine(
    (data) => {
      // If weights are provided, they must match taskCardIds length
      if (data.weights) {
        return data.weights.length === data.taskCardIds.length;
      }
      return true;
    },
    {
      message: "weights array must match taskCardIds array length",
      path: ["weights"],
    },
  );

/**
 * Milestone list query schema
 */
export const milestoneListQuerySchema = z.object({
  organizationId: z.string().uuid("Must be a valid UUID"),
  status: milestoneStatusSchema.optional(),
  priority: milestonePrioritySchema.optional(),
  assignedToMe: z.boolean().optional(),
  startDateFrom: isoDateSchema.optional(),
  startDateTo: isoDateSchema.optional(),
  dueDateFrom: isoDateSchema.optional(),
  dueDateTo: isoDateSchema.optional(),
});

// =====================================================
// Validator Functions
// =====================================================

/**
 * Validate create milestone request
 */
export function validateCreateMilestone(data: unknown) {
  const result = createMilestoneSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}

/**
 * Validate update milestone request
 */
export function validateUpdateMilestone(data: unknown) {
  const result = updateMilestoneSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}

/**
 * Validate add dependency request
 */
export function validateAddDependency(data: unknown) {
  const result = addDependencySchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}

/**
 * Validate assign user request
 */
export function validateAssignUser(data: unknown) {
  const result = assignUserSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}

/**
 * Validate link tasks request
 */
export function validateLinkTasks(data: unknown) {
  const result = linkTasksSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}

/**
 * Validate milestone list query
 */
export function validateMilestoneListQuery(data: unknown) {
  const result = milestoneListQuerySchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}
