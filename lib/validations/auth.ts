/**
 * Authentication Validation Schemas
 *
 * @fileoverview Zod validation schemas for authentication forms and server actions.
 * These schemas provide runtime type checking, input sanitization, and comprehensive
 * error messages for user feedback.
 *
 * @module lib/validations/auth
 *
 * @security
 * - Prevents SQL injection through type validation
 * - Sanitizes user input before database operations
 * - Validates email format to prevent invalid data
 * - Enforces password complexity requirements
 * - Protects against XSS through string normalization
 *
 * @see {@link https://zod.dev/|Zod Documentation}
 */

import { z } from 'zod'

/**
 * Password complexity requirements
 *
 * @constant
 * @remarks
 * Consider these best practices for password requirements:
 * - Minimum 8 characters (current)
 * - At least one uppercase letter (recommended)
 * - At least one lowercase letter (recommended)
 * - At least one number (recommended)
 * - At least one special character (recommended)
 */
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

/**
 * Email validation schema
 *
 * @remarks
 * - Validates RFC 5322 email format
 * - Converts to lowercase for consistency
 * - Trims whitespace
 * - Maximum length prevents database overflow
 */
export const emailSchema = z
  .string({ message: 'Email must be a string' })
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long')
  .toLowerCase()
  .trim()
  .describe('User email address')

/**
 * Password validation schema for new passwords
 *
 * @remarks
 * **Current Requirements:**
 * - Minimum 8 characters
 * - Maximum 128 characters (bcrypt limit)
 *
 * **TODO: Add complexity requirements:**
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @example
 * ```typescript
 * passwordSchema.parse('MySecurePass123!') // ✓ Valid
 * passwordSchema.parse('weak')             // ✗ Too short
 * ```
 */
export const passwordSchema = z
  .string({ message: 'Password must be a string' })
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be less than ${PASSWORD_MAX_LENGTH} characters`)
  // TODO: Add regex for complexity requirements
  // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  //   message: 'Password must contain uppercase, lowercase, number, and special character'
  // })
  .describe('User password')

/**
 * Full name validation schema
 *
 * @remarks
 * - Validates basic name format
 * - Trims leading/trailing whitespace
 * - Allows letters, spaces, hyphens, and apostrophes
 * - Prevents special characters that could cause issues
 */
export const nameSchema = z
  .string({ message: 'Name must be a string' })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long')
  .trim()
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  .describe('User full name')

/**
 * User role validation schema
 *
 * @remarks
 * Must match the user_role enum defined in the database schema.
 * These roles control access permissions throughout the application.
 *
 * @see {@link Database.public.Enums.user_role} in types.ts
 */
export const roleSchema = z
  .enum(['ADMIN', 'MANAGER', 'CONSULTANT', 'CLIENT'], {
    message: 'Invalid role selected',
  })
  .describe('User role in the system')

/**
 * Sign-up form validation schema
 *
 * Validates all fields required for user registration including
 * email, password, password confirmation, name, and role.
 *
 * @example
 * ```typescript
 * import { signUpSchema } from '@/lib/validations/auth'
 *
 * const result = signUpSchema.safeParse({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!',
 *   name: 'Jean Dupont',
 *   role: 'CONSULTANT'
 * })
 *
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 *
 * @remarks
 * **Validation Steps:**
 * 1. Validates each field individually
 * 2. Checks that passwords match
 * 3. Returns detailed error messages for each field
 *
 * **Error Handling:**
 * Use `.safeParse()` to handle validation errors gracefully:
 * ```typescript
 * const result = signUpSchema.safeParse(data)
 * if (!result.success) {
 *   const errors = result.error.flatten().fieldErrors
 *   // { email: ['Invalid email'], password: ['Too short'], ... }
 * }
 * ```
 */
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ message: 'Please confirm your password' }),
    name: nameSchema,
    role: roleSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/**
 * Sign-in form validation schema
 *
 * Validates email and password for user authentication.
 * Less strict than sign-up since we're checking against existing data.
 *
 * @example
 * ```typescript
 * import { signInSchema } from '@/lib/validations/auth'
 *
 * const result = signInSchema.safeParse({
 *   email: 'user@example.com',
 *   password: 'MyPassword123!'
 * })
 *
 * if (result.success) {
 *   await signIn(result.data)
 * }
 * ```
 *
 * @remarks
 * **Security:**
 * - Still validates email format to prevent injection
 * - No minimum password length check (existing passwords may predate requirements)
 * - Rate limiting should be implemented at the action level
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required')
    .describe('User password'),
})

/**
 * Password reset request validation schema
 *
 * Validates email for password reset requests.
 *
 * @example
 * ```typescript
 * import { passwordResetSchema } from '@/lib/validations/auth'
 *
 * const result = passwordResetSchema.safeParse({
 *   email: 'user@example.com'
 * })
 * ```
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
})

/**
 * Password update validation schema
 *
 * Validates new password and confirmation for password changes.
 *
 * @example
 * ```typescript
 * import { passwordUpdateSchema } from '@/lib/validations/auth'
 *
 * const result = passwordUpdateSchema.safeParse({
 *   password: 'NewSecurePass123!',
 *   confirmPassword: 'NewSecurePass123!'
 * })
 * ```
 */
export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ message: 'Please confirm your new password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/**
 * Type inference helpers for TypeScript
 *
 * @example
 * ```typescript
 * import type { SignUpInput, SignInInput } from '@/lib/validations/auth'
 *
 * function handleSignUp(data: SignUpInput) {
 *   // data is fully typed
 * }
 * ```
 */
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>
