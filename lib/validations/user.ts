/**
 * User Management Validation Schemas
 *
 * @fileoverview Zod validation schemas for user management in admin backoffice.
 * These schemas provide runtime type checking for user CRUD operations and bulk actions.
 *
 * @module lib/validations/user
 *
 * @security
 * - Validates UUID format for user references
 * - Validates role and status enums
 * - Sanitizes user input before database operations
 */

import { z } from 'zod'
import { roleSchema, emailSchema, nomSchema, prenomSchema } from './auth'
import { uuidSchema } from './project'

/**
 * User status validation schema
 *
 * @remarks
 * Must match the user_status enum defined in the database schema.
 * - online: User is currently active
 * - offline: User is not active
 * - away: User is temporarily unavailable
 */
export const userStatusSchema = z
  .enum(['online', 'offline', 'away'], {
    message: 'Invalid user status',
  })
  .default('offline')
  .describe('User online status')

/**
 * Phone number validation schema
 *
 * @remarks
 * - Optional field
 * - Allows various international formats
 * - Should support: +33 6 12 34 56 78, 06 12 34 56 78, etc.
 */
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .max(20, 'Phone number is too long')
  .regex(/^[\d\s+()-]+$/, {
    message: 'Phone number can only contain digits, spaces, +, -, and ()',
  })
  .trim()
  .optional()
  .describe('User phone number')

/**
 * Avatar URL validation schema
 *
 * @remarks
 * - Optional field
 * - Must be a valid URL
 * - Typically points to uploaded image in Supabase Storage
 */
export const avatarUrlSchema = z
  .string()
  .url('Avatar URL must be a valid URL')
  .optional()
  .describe('User avatar image URL')

/**
 * Update user role validation schema
 *
 * For admin operations to change a user's role.
 *
 * @example
 * ```typescript
 * import { updateUserRoleSchema } from '@/lib/validations/user'
 *
 * const result = updateUserRoleSchema.safeParse({
 *   user_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *   role: 'MANAGER'
 * })
 * ```
 */
export const updateUserRoleSchema = z.object({
  user_id: uuidSchema,
  role: roleSchema,
})

/**
 * Update user status validation schema
 *
 * For admin operations to change a user's status.
 *
 * @example
 * ```typescript
 * import { updateUserStatusSchema } from '@/lib/validations/user'
 *
 * const result = updateUserStatusSchema.safeParse({
 *   user_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *   status: 'away'
 * })
 * ```
 */
export const updateUserStatusSchema = z.object({
  user_id: uuidSchema,
  status: userStatusSchema,
})

/**
 * Update user profile validation schema
 *
 * For admin operations to update user profile information.
 *
 * @example
 * ```typescript
 * import { updateUserProfileSchema } from '@/lib/validations/user'
 *
 * const result = updateUserProfileSchema.safeParse({
 *   nom: 'Dupont',
 *   prenom: 'Jean',
 *   email: 'jean.dupont@example.com',
 *   phone: '+33 6 12 34 56 78',
 *   role: 'CONSULTANT',
 *   status: 'online'
 * })
 * ```
 */
export const updateUserProfileSchema = z.object({
  nom: nomSchema.optional(),
  prenom: prenomSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
  avatar_url: avatarUrlSchema,
  organization_id: uuidSchema.optional(),
})

/**
 * Bulk delete users validation schema
 *
 * For admin operations to delete multiple users at once.
 *
 * @example
 * ```typescript
 * import { bulkDeleteUsersSchema } from '@/lib/validations/user'
 *
 * const result = bulkDeleteUsersSchema.safeParse({
 *   user_ids: [
 *     '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *     '99f54681-c503-4aba-b547-c7b05011d396'
 *   ]
 * })
 * ```
 *
 * @remarks
 * **Warning:** This is a dangerous operation. Ensure proper confirmation
 * from the user before executing bulk deletions.
 */
export const bulkDeleteUsersSchema = z.object({
  user_ids: z
    .array(uuidSchema, { message: 'User IDs must be an array of valid UUIDs' })
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot delete more than 100 users at once'),
})

/**
 * Bulk update user roles validation schema
 *
 * For admin operations to update roles for multiple users at once.
 *
 * @example
 * ```typescript
 * import { bulkUpdateUserRolesSchema } from '@/lib/validations/user'
 *
 * const result = bulkUpdateUserRolesSchema.safeParse({
 *   user_ids: [
 *     '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *     '99f54681-c503-4aba-b547-c7b05011d396'
 *   ],
 *   role: 'CONSULTANT'
 * })
 * ```
 */
export const bulkUpdateUserRolesSchema = z.object({
  user_ids: z
    .array(uuidSchema, { message: 'User IDs must be an array of valid UUIDs' })
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot update more than 100 users at once'),
  role: roleSchema,
})

/**
 * Assign users to organization validation schema
 *
 * For admin operations to assign multiple users to an organization.
 *
 * @example
 * ```typescript
 * import { assignUsersToOrganizationSchema } from '@/lib/validations/user'
 *
 * const result = assignUsersToOrganizationSchema.safeParse({
 *   user_ids: ['2ae5048c-8b31-4628-aa2c-99275c66f58a'],
 *   organization_id: '99f54681-c503-4aba-b547-c7b05011d396',
 *   role: 'CONSULTANT'
 * })
 * ```
 */
export const assignUsersToOrganizationSchema = z.object({
  user_ids: z
    .array(uuidSchema, { message: 'User IDs must be an array of valid UUIDs' })
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot assign more than 100 users at once'),
  organization_id: uuidSchema,
  role: roleSchema.optional(),
})

/**
 * Type inference helpers for TypeScript
 *
 * @example
 * ```typescript
 * import type {
 *   UpdateUserRoleInput,
 *   BulkDeleteUsersInput,
 *   BulkUpdateUserRolesInput
 * } from '@/lib/validations/user'
 *
 * function handleUpdateRole(data: UpdateUserRoleInput) {
 *   // data is fully typed
 * }
 * ```
 */
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
export type BulkDeleteUsersInput = z.infer<typeof bulkDeleteUsersSchema>
export type BulkUpdateUserRolesInput = z.infer<typeof bulkUpdateUserRolesSchema>
export type AssignUsersToOrganizationInput = z.infer<typeof assignUsersToOrganizationSchema>
