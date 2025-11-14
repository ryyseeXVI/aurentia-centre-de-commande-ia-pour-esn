/**
 * Supabase Server Client
 *
 * @fileoverview Creates and configures a Supabase client for use in server-side
 * Next.js contexts including Server Components, Server Actions, and Route Handlers.
 * This implementation ensures proper cookie handling and session management on the server.
 *
 * @module lib/supabase/server
 *
 * @security
 * - Uses Next.js cookies() API for secure server-side cookie access
 * - Handles authentication sessions securely on the server
 * - Prevents session leakage between requests
 * - Never exposes sensitive keys to the client
 *
 * @see {@link https://supabase.com/docs/guides/auth/server-side/creating-a-client|Supabase Server Client Guide}
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a type-safe Supabase client for server-side operations
 *
 * This async factory function initializes a Supabase client optimized for server-side
 * rendering in Next.js. It integrates with Next.js cookies() API to:
 * - Read authentication cookies securely on the server
 * - Update cookies when sessions are refreshed
 * - Maintain session state across Server Component renders
 * - Enable seamless auth state in Server Actions
 *
 * @returns A promise resolving to a configured Supabase server client with full TypeScript types
 *
 * @async
 *
 * @example
 * ```typescript
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function ProfilePage() {
 *   const supabase = await createClient()
 *
 *   const { data: profile } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .single()
 *
 *   return <div>Hello {profile?.prenom}</div>
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In a Server Action
 * 'use server'
 *
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function updateProfile(formData: FormData) {
 *   const supabase = await createClient()
 *
 *   const { data, error } = await supabase
 *     .from('profiles')
 *     .update({ nom: formData.get('nom') })
 *     .eq('id', userId)
 *
 *   if (error) throw error
 *   return data
 * }
 * ```
 *
 * @throws {Error} If NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set
 * @throws {Error} If called outside of a valid Next.js server context
 *
 * @remarks
 * - Must be used in Server Components, Server Actions, or Route Handlers only
 * - For Client Components, use `@/lib/supabase/client` instead
 * - Cookie setting may silently fail in Server Components (handled by middleware)
 * - Session refresh is automatically handled by middleware
 *
 * @see {@link Database} for available database types and schemas
 * @see {@link updateSession} in middleware.ts for session refresh logic
 */
export async function createClient(): Promise<SupabaseClient<Database, 'public'>> {
  const cookieStore = await cookies()

  return createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves all authentication cookies from the Next.js cookie store
         * @returns Array of cookies containing session information
         */
        getAll() {
          return cookieStore.getAll()
        },
        /**
         * Attempts to set updated authentication cookies in the Next.js cookie store
         * Silently fails in Server Components (session refresh handled by middleware)
         * @param cookiesToSet - Array of cookies to update with new session data
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
