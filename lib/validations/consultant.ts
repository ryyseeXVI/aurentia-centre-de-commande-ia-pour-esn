/**
 * Consultant Validation Schemas
 *
 * @fileoverview Zod validation schemas for consultant management.
 * These schemas provide runtime type checking, input sanitization, and comprehensive
 * error messages for user feedback.
 *
 * @module lib/validations/consultant
 *
 * @security
 * - Validates UUID format for foreign key references
 * - Sanitizes user input before database operations
 * - Validates email format to prevent invalid data
 * - Validates numeric rates to prevent overflow
 */

import { z } from 'zod'
import { emailSchema, nomSchema, prenomSchema } from './auth'
import { uuidSchema, dateSchema } from './project'

/**
 * Daily cost rate validation schema
 *
 * @remarks
 * - Must be a positive number
 * - Allows up to 2 decimal places for cents
 * - Maximum value to prevent database overflow
 */
export const tauxJournalierSchema = z
  .number({ message: 'Daily rate must be a number' })
  .positive('Daily rate must be positive')
  .max(100000, 'Daily rate is too high')
  .refine(
    (val) => {
      // Check for at most 2 decimal places
      return Math.round(val * 100) === val * 100
    },
    { message: 'Daily rate can have at most 2 decimal places' }
  )
  .describe('Daily rate in euros')

/**
 * Consultant role/position validation schema
 *
 * @remarks
 * - Optional field
 * - Examples: "Senior Developer", "Tech Lead", "Architect"
 */
export const consultantRoleSchema = z
  .string()
  .min(2, 'Role must be at least 2 characters')
  .max(100, 'Role is too long')
  .trim()
  .optional()
  .describe('Consultant role or position')

/**
 * Consultant status validation schema
 *
 * @remarks
 * Common statuses for consultants in the system
 */
export const consultantStatusSchema = z
  .enum(['ACTIF', 'INACTIF', 'EN_MISSION', 'DISPONIBLE'], {
    message: 'Invalid consultant status',
  })
  .default('DISPONIBLE')
  .describe('Consultant availability status')

/**
 * Consultant creation validation schema
 *
 * Validates all fields required for consultant creation.
 *
 * @example
 * ```typescript
 * import { createConsultantSchema } from '@/lib/validations/consultant'
 *
 * const result = createConsultantSchema.safeParse({
 *   nom: 'Dupont',
 *   prenom: 'Jean',
 *   email: 'jean.dupont@example.com',
 *   date_embauche: '2025-01-15',
 *   taux_journalier_cout: 450.00,
 *   taux_journalier_vente: 650.00,
 *   role: 'Senior Developer',
 *   statut: 'DISPONIBLE',
 *   organization_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a'
 * })
 *
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 *
 * @remarks
 * **Required Fields:**
 * - nom: Last name
 * - prenom: First name
 * - email: Email address
 * - date_embauche: Hire date
 * - taux_journalier_cout: Daily cost rate
 * - organization_id: Organization UUID reference
 *
 * **Optional Fields:**
 * - taux_journalier_vente: Daily selling rate
 * - role: Consultant role/position
 * - statut: Defaults to 'DISPONIBLE'
 * - manager_id: Manager UUID reference
 * - user_id: User account UUID reference
 */
export const createConsultantSchema = z
  .object({
    nom: nomSchema,
    prenom: prenomSchema,
    email: emailSchema,
    date_embauche: dateSchema,
    taux_journalier_cout: tauxJournalierSchema,
    taux_journalier_vente: tauxJournalierSchema.optional(),
    role: consultantRoleSchema,
    statut: consultantStatusSchema,
    manager_id: uuidSchema.optional(),
    user_id: uuidSchema.optional(),
    organization_id: uuidSchema,
  })
  .refine(
    (data) => {
      // If selling rate is provided, it should be >= cost rate
      if (data.taux_journalier_vente) {
        return data.taux_journalier_vente >= data.taux_journalier_cout
      }
      return true
    },
    {
      message: 'Selling rate must be greater than or equal to cost rate',
      path: ['taux_journalier_vente'],
    }
  )

/**
 * Consultant update validation schema
 *
 * All fields are optional for partial updates.
 *
 * @example
 * ```typescript
 * import { updateConsultantSchema } from '@/lib/validations/consultant'
 *
 * const result = updateConsultantSchema.safeParse({
 *   statut: 'EN_MISSION',
 *   taux_journalier_vente: 700.00
 * })
 * ```
 */
export const updateConsultantSchema = createConsultantSchema.partial()

/**
 * Link consultant to user validation schema
 *
 * Links an existing consultant record to a user account.
 *
 * @example
 * ```typescript
 * const result = linkConsultantToUserSchema.safeParse({
 *   consultant_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *   user_id: '99f54681-c503-4aba-b547-c7b05011d396'
 * })
 * ```
 */
export const linkConsultantToUserSchema = z.object({
  consultant_id: uuidSchema,
  user_id: uuidSchema,
})

/**
 * Type inference helpers for TypeScript
 *
 * @example
 * ```typescript
 * import type { CreateConsultantInput, UpdateConsultantInput } from '@/lib/validations/consultant'
 *
 * function handleCreateConsultant(data: CreateConsultantInput) {
 *   // data is fully typed
 * }
 * ```
 */
export type CreateConsultantInput = z.infer<typeof createConsultantSchema>
export type UpdateConsultantInput = z.infer<typeof updateConsultantSchema>
export type LinkConsultantToUserInput = z.infer<typeof linkConsultantToUserSchema>
