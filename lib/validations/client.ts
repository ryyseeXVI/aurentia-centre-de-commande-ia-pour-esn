/**
 * Client Validation Schemas
 *
 * @fileoverview Zod validation schemas for client management.
 * These schemas provide runtime type checking, input sanitization, and comprehensive
 * error messages for user feedback.
 *
 * @module lib/validations/client
 *
 * @security
 * - Validates UUID format for foreign key references
 * - Sanitizes user input before database operations
 * - Validates text lengths to prevent overflow
 */

import { z } from 'zod'
import { uuidSchema } from './project'

/**
 * Client name validation schema
 *
 * @remarks
 * - Minimum 2 characters for meaningful client names
 * - Maximum 200 characters to prevent database overflow
 * - Trims whitespace
 */
export const clientNameSchema = z
  .string({ message: 'Client name must be a string' })
  .min(2, 'Client name must be at least 2 characters')
  .max(200, 'Client name is too long')
  .trim()
  .describe('Client company name')

/**
 * Client contact name validation schema
 *
 * @remarks
 * - Optional field for primary contact person
 * - Allows full names with common characters
 */
export const contactPrincipalSchema = z
  .string()
  .min(2, 'Contact name must be at least 2 characters')
  .max(100, 'Contact name is too long')
  .trim()
  .optional()
  .describe('Primary contact person name')

/**
 * Client sector/industry validation schema
 *
 * @remarks
 * - Optional field to categorize clients
 * - Examples: "Finance", "Healthcare", "E-commerce", "Technology"
 */
export const secteurSchema = z
  .string()
  .min(2, 'Sector must be at least 2 characters')
  .max(100, 'Sector is too long')
  .trim()
  .optional()
  .describe('Client industry or sector')

/**
 * Client creation validation schema
 *
 * Validates all fields required for client creation.
 *
 * @example
 * ```typescript
 * import { createClientSchema } from '@/lib/validations/client'
 *
 * const result = createClientSchema.safeParse({
 *   nom: 'Acme Corporation',
 *   contact_principal: 'John Smith',
 *   secteur: 'Technology',
 *   contact_user_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *   organization_id: '99f54681-c503-4aba-b547-c7b05011d396'
 * })
 *
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 *
 * @remarks
 * **Required Fields:**
 * - nom: Client company name
 * - organization_id: Organization UUID reference
 *
 * **Optional Fields:**
 * - contact_principal: Primary contact person name
 * - secteur: Client industry or sector
 * - contact_user_id: User UUID reference for contact person
 */
export const createClientSchema = z.object({
  nom: clientNameSchema,
  contact_principal: contactPrincipalSchema,
  secteur: secteurSchema,
  contact_user_id: uuidSchema.optional(),
  organization_id: uuidSchema,
})

/**
 * Client update validation schema
 *
 * All fields are optional for partial updates.
 *
 * @example
 * ```typescript
 * import { updateClientSchema } from '@/lib/validations/client'
 *
 * const result = updateClientSchema.safeParse({
 *   secteur: 'Finance',
 *   contact_principal: 'Jane Doe'
 * })
 * ```
 */
export const updateClientSchema = createClientSchema.partial()

/**
 * Type inference helpers for TypeScript
 *
 * @example
 * ```typescript
 * import type { CreateClientInput, UpdateClientInput } from '@/lib/validations/client'
 *
 * function handleCreateClient(data: CreateClientInput) {
 *   // data is fully typed
 * }
 * ```
 */
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
