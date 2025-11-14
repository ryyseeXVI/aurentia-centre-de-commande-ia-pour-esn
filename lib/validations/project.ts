/**
 * Project Validation Schemas
 *
 * @fileoverview Zod validation schemas for project creation and management.
 * These schemas provide runtime type checking, input sanitization, and comprehensive
 * error messages for user feedback.
 *
 * @module lib/validations/project
 *
 * @security
 * - Validates UUID format for foreign key references
 * - Sanitizes user input before database operations
 * - Validates date formats to prevent invalid data
 * - Enforces required field constraints
 */

import { z } from 'zod'

/**
 * Project name validation schema
 *
 * @remarks
 * - Minimum 3 characters for meaningful project names
 * - Maximum 200 characters to prevent database overflow
 * - Trims whitespace
 */
export const projectNameSchema = z
  .string({ message: 'Project name must be a string' })
  .min(3, 'Project name must be at least 3 characters')
  .max(200, 'Project name is too long')
  .trim()
  .describe('Project name')

/**
 * Project description validation schema
 *
 * @remarks
 * - Optional field
 * - Maximum 2000 characters for detailed descriptions
 * - Trims whitespace
 */
export const projectDescriptionSchema = z
  .string()
  .max(2000, 'Description is too long')
  .trim()
  .optional()
  .describe('Project description')

/**
 * UUID validation schema
 *
 * @remarks
 * Validates UUID v4 format for foreign key references
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format')
  .describe('UUID identifier')

/**
 * Date string validation schema
 *
 * @remarks
 * Validates ISO 8601 date format (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    },
    { message: 'Invalid date' }
  )
  .describe('Date in YYYY-MM-DD format')

/**
 * Project status validation schema
 *
 * @remarks
 * Must match the project status values used in the database.
 * - PLANIFIE: Project is planned but not yet started
 * - ACTIF: Project is currently active
 * - TERMINE: Project is completed
 */
export const projectStatusSchema = z
  .enum(['PLANIFIE', 'ACTIF', 'TERMINE'], {
    message: 'Invalid project status',
  })
  .default('PLANIFIE')
  .describe('Project status')

/**
 * Project creation validation schema
 *
 * Validates all fields required for project creation.
 *
 * @example
 * ```typescript
 * import { createProjectSchema } from '@/lib/validations/project'
 *
 * const result = createProjectSchema.safeParse({
 *   nom: 'AI Command Center',
 *   description: 'Development of AI-powered ESN management platform',
 *   client_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *   chef_projet_id: '99f54681-c503-4aba-b547-c7b05011d396',
 *   date_debut: '2025-01-15',
 *   date_fin_prevue: '2025-06-30',
 *   statut: 'ACTIF'
 * })
 *
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 *
 * @remarks
 * **Required Fields:**
 * - nom: Project name
 * - client_id: Client UUID reference
 * - date_debut: Project start date
 *
 * **Optional Fields:**
 * - description: Project description
 * - chef_projet_id: Project manager UUID reference
 * - date_fin_prevue: Expected end date
 * - statut: Defaults to 'PLANIFIE' if not provided
 */
export const createProjectSchema = z
  .object({
    nom: projectNameSchema,
    description: projectDescriptionSchema,
    client_id: uuidSchema,
    chef_projet_id: uuidSchema.optional(),
    date_debut: dateSchema,
    date_fin_prevue: dateSchema.optional(),
    statut: projectStatusSchema,
  })
  .refine(
    (data) => {
      if (data.date_fin_prevue) {
        const debut = new Date(data.date_debut)
        const fin = new Date(data.date_fin_prevue)
        return fin >= debut
      }
      return true
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['date_fin_prevue'],
    }
  )

/**
 * Project update validation schema
 *
 * All fields are optional for partial updates.
 *
 * @example
 * ```typescript
 * import { updateProjectSchema } from '@/lib/validations/project'
 *
 * const result = updateProjectSchema.safeParse({
 *   statut: 'TERMINE',
 *   date_fin_prevue: '2025-12-31'
 * })
 * ```
 */
export const updateProjectSchema = createProjectSchema.partial()

/**
 * Type inference helpers for TypeScript
 *
 * @example
 * ```typescript
 * import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project'
 *
 * function handleCreateProject(data: CreateProjectInput) {
 *   // data is fully typed
 * }
 * ```
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
