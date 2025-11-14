/**
 * Organization Validation Schemas
 *
 * @fileoverview Zod validation schemas for organization management.
 * These schemas provide runtime type checking, input sanitization, and comprehensive
 * error messages for user feedback.
 *
 * @module lib/validations/organization
 *
 * @security
 * - Validates slug format for URL-safe identifiers
 * - Sanitizes user input before database operations
 * - Validates URL format for logo URLs
 */

import { z } from 'zod'

/**
 * Organization name validation schema
 *
 * @remarks
 * - Minimum 2 characters for meaningful organization names
 * - Maximum 200 characters to prevent database overflow
 * - Trims whitespace
 */
export const organizationNameSchema = z
  .string({ message: 'Organization name must be a string' })
  .min(2, 'Organization name must be at least 2 characters')
  .max(200, 'Organization name is too long')
  .trim()
  .describe('Organization name')

/**
 * Organization slug validation schema
 *
 * @remarks
 * - URL-safe identifier for the organization
 * - Lowercase letters, numbers, and hyphens only
 * - Used in URLs: /organizations/{slug}
 * - Must be unique across all organizations
 */
export const organizationSlugSchema = z
  .string({ message: 'Slug must be a string' })
  .min(2, 'Slug must be at least 2 characters')
  .max(100, 'Slug is too long')
  .toLowerCase()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  .describe('URL-friendly organization identifier')

/**
 * Organization description validation schema
 *
 * @remarks
 * - Optional field
 * - Maximum 1000 characters for detailed descriptions
 * - Trims whitespace
 */
export const organizationDescriptionSchema = z
  .string()
  .max(1000, 'Description is too long')
  .trim()
  .optional()
  .describe('Organization description')

/**
 * Organization logo URL validation schema
 *
 * @remarks
 * - Optional field
 * - Must be a valid URL
 * - Typically points to uploaded image in Supabase Storage
 */
export const organizationLogoUrlSchema = z
  .string()
  .url('Logo URL must be a valid URL')
  .optional()
  .describe('Organization logo image URL')

/**
 * Organization creation validation schema
 *
 * Validates all fields required for organization creation.
 *
 * @example
 * ```typescript
 * import { createOrganizationSchema } from '@/lib/validations/organization'
 *
 * const result = createOrganizationSchema.safeParse({
 *   name: 'Acme Corporation',
 *   slug: 'acme-corp',
 *   description: 'Leading provider of innovative solutions',
 *   logo_url: 'https://example.com/logo.png'
 * })
 *
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 *
 * @remarks
 * **Required Fields:**
 * - name: Organization name
 * - slug: URL-friendly identifier (must be unique)
 *
 * **Optional Fields:**
 * - description: Organization description
 * - logo_url: Logo image URL
 */
export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
  description: organizationDescriptionSchema,
  logo_url: organizationLogoUrlSchema,
})

/**
 * Organization update validation schema
 *
 * All fields are optional for partial updates.
 *
 * @example
 * ```typescript
 * import { updateOrganizationSchema } from '@/lib/validations/organization'
 *
 * const result = updateOrganizationSchema.safeParse({
 *   description: 'Updated description',
 *   logo_url: 'https://example.com/new-logo.png'
 * })
 * ```
 *
 * @remarks
 * Be careful when updating slug as it affects URLs throughout the application.
 */
export const updateOrganizationSchema = createOrganizationSchema.partial()

/**
 * Type inference helpers for TypeScript
 *
 * @example
 * ```typescript
 * import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/lib/validations/organization'
 *
 * function handleCreateOrganization(data: CreateOrganizationInput) {
 *   // data is fully typed
 * }
 * ```
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
