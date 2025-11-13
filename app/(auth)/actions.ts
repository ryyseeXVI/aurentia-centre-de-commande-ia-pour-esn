/**
 * Authentication Server Actions
 *
 * @fileoverview Server-side authentication actions for user registration,
 * login, and logout. These functions run exclusively on the server and
 * handle sensitive authentication operations securely.
 *
 * @module app/(auth)/actions
 *
 * @security
 * ⚠️ SECURITY WARNINGS:
 * - TODO: Add input validation using Zod schemas (CRITICAL)
 * - TODO: Remove console.error statements (logs PII to client) (HIGH)
 * - TODO: Implement rate limiting for brute-force protection (HIGH)
 * - TODO: Add CAPTCHA for signup/login (MEDIUM)
 * - TODO: Implement account lockout after failed attempts (MEDIUM)
 * - TODO: Add audit logging for authentication events (MEDIUM)
 *
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs|Supabase Auth Guide}
 */

'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from '@/lib/validations/auth'

// Type definitions are now imported from validations/auth.ts
// SignUpInput and SignInInput are inferred from Zod schemas

/**
 * Server action for user registration and account creation
 *
 * Creates a new user account in Supabase Auth and sends a verification email.
 * After successful registration, the user must verify their email before
 * accessing protected routes (if email confirmation is enabled).
 *
 * @param data - User registration information
 * @returns Object containing error message if registration fails
 *
 * @async
 *
 * @example
 * ```typescript
 * // In a form submission handler
 * const result = await signUp({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!',
 *   name: 'Jean Dupont',
 *   role: 'CONSULTANT'
 * })
 *
 * if (result?.error) {
 *   console.error(result.error)
 * }
 * // User is redirected to dashboard if successful
 * ```
 *
 * @throws {Error} Redirects to `/dashboard` on successful registration
 *
 * @security
 * ⚠️ SECURITY ISSUES:
 * 1. **Missing Input Validation**: No Zod schema validation (XSS/injection risk)
 * 2. **console.error**: Logs errors to client console (PII exposure)
 * 3. **No Rate Limiting**: Vulnerable to automated account creation
 * 4. **Weak Password Check**: Client-side only (can be bypassed)
 * 5. **No Email Domain Validation**: Allows disposable email addresses
 *
 * @remarks
 * **Email Verification:**
 * - If Supabase email confirmation is enabled, user receives verification email
 * - User cannot sign in until email is verified
 * - Verification link redirects to `/auth/callback`
 *
 * **User Metadata:**
 * - `full_name` and `role` stored in auth.users.user_metadata
 * - Additional profile data should be added to profiles table via trigger
 *
 * @todo Add Zod validation schema
 * @todo Replace console.error with server-side logging
 * @todo Implement rate limiting (e.g., 5 attempts per hour per IP)
 * @todo Add password strength validation
 * @todo Validate email domain against allowlist/blocklist
 */
export async function signUp(data: SignUpInput) {
  // ✅ SECURITY: Validate and sanitize all input data using Zod schema
  const validation = signUpSchema.safeParse(data)

  if (!validation.success) {
    // Return detailed validation errors
    const errors = validation.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input data' }
  }

  // Extract validated and sanitized data
  const { email, password, name, role } = validation.data

  // Access server-side cookies for session management
  const cookieStore = await cookies()

  // Create Supabase client for server-side auth operations
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Attempt to create new user account in Supabase Auth
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // OAuth callback URL for email verification
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        // Store additional user metadata
        data: {
          full_name: name,
          role: role,
        },
      },
    })

    if (error) {
      // ⚠️ SECURITY ISSUE: console.error exposes error details to client
      // TODO: Use server-side logging instead (e.g., Sentry, Winston)
      console.error('Supabase signup error:', error)
      return { error: error.message }
    }

    // Check if email confirmation is required (configured in Supabase)
    if (signUpData?.user && !signUpData.session) {
      return { error: 'Please check your email to confirm your account' }
    }

    // Success: redirect to dashboard (throws redirect error)
    redirect('/dashboard')
  } catch (err) {
    // ⚠️ SECURITY ISSUE: console.error exposes error details to client
    // TODO: Use server-side logging instead
    console.error('Signup error:', err)
    return { error: 'An unexpected error occurred during signup' }
  }
}

/**
 * Server action for user authentication and login
 *
 * Authenticates a user with email and password credentials. On successful
 * authentication, creates a session and redirects to the dashboard.
 *
 * @param data - User login credentials
 * @returns Object containing error message if authentication fails
 *
 * @async
 *
 * @example
 * ```typescript
 * // In a login form handler
 * const result = await signIn({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!'
 * })
 *
 * if (result?.error) {
 *   setError(result.error)
 * }
 * // User is redirected to dashboard if successful
 * ```
 *
 * @throws {Error} Redirects to `/dashboard` on successful authentication
 *
 * @security
 * ⚠️ SECURITY ISSUES:
 * 1. **No Input Validation**: Missing Zod schema validation
 * 2. **No Rate Limiting**: Vulnerable to brute-force attacks
 * 3. **No Account Lockout**: No protection after failed attempts
 * 4. **Generic Error Messages**: Should not reveal if email exists
 *
 * @remarks
 * **Session Management:**
 * - Session cookies are automatically set on successful login
 * - Session duration configured in Supabase dashboard
 * - Middleware automatically refreshes sessions
 *
 * **Failed Attempts:**
 * - Currently no tracking of failed login attempts
 * - Should implement account lockout after N failures
 *
 * @todo Add Zod validation schema
 * @todo Implement rate limiting (e.g., 10 attempts per 15 minutes per IP)
 * @todo Add account lockout mechanism
 * @todo Use generic error messages to prevent user enumeration
 * @todo Log authentication attempts (successful and failed)
 */
export async function signIn(data: SignInInput) {
  // ✅ SECURITY: Validate and sanitize all input data using Zod schema
  const validation = signInSchema.safeParse(data)

  if (!validation.success) {
    // Return generic error to prevent user enumeration
    return { error: 'Invalid email or password' }
  }

  // Extract validated and sanitized data
  const { email, password } = validation.data

  // Access server-side cookies for session management
  const cookieStore = await cookies()

  // Create Supabase client for server-side auth operations
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Attempt to authenticate user with password
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Return generic error (consider not revealing if email exists)
    return { error: error.message }
  }

  // Success: redirect to dashboard (throws redirect error)
  redirect('/dashboard')
}

/**
 * Server action for user logout
 *
 * Signs out the current user by terminating their session and clearing
 * all authentication cookies. Redirects to the login page after logout.
 *
 * @returns void - Always redirects to login page
 *
 * @async
 *
 * @example
 * ```typescript
 * // In a logout button handler
 * <button onClick={async () => await signOut()}>
 *   Sign Out
 * </button>
 * ```
 *
 * @throws {Error} Redirects to `/login` after signout
 *
 * @security
 * ✅ SECURE:
 * - Properly terminates server-side session
 * - Clears all authentication cookies
 * - No sensitive data exposure
 *
 * @remarks
 * **Session Termination:**
 * - Invalidates session on Supabase Auth server
 * - Removes all session cookies from browser
 * - User must re-authenticate to access protected routes
 *
 * **Post-Logout:**
 * - User is automatically redirected to `/login`
 * - Previous session cannot be reused
 * - Refresh tokens are invalidated
 *
 * @see {@link signIn} for re-authentication
 */
export async function signOut() {
  // Access server-side cookies for session management
  const cookieStore = await cookies()

  // Create Supabase client for server-side auth operations
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Terminate session and clear all auth cookies
  await supabase.auth.signOut()

  // Redirect to login page after successful logout
  redirect('/login')
}
