/**
 * Supabase Browser Client
 *
 * @fileoverview Creates and configures a Supabase client for use in browser-side
 * React components (Client Components). This client handles authentication state,
 * cookie management, and automatic session refresh in the browser.
 *
 * @module lib/supabase/client
 *
 * @security
 * - Uses NEXT_PUBLIC_SUPABASE_ANON_KEY (safe for client-side exposure)
 * - Row Level Security (RLS) policies protect data access
 * - Never expose service_role key in client code
 *
 * @see {@link https://supabase.com/docs/guides/auth/server-side/creating-a-client|Supabase SSR Client Guide}
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Creates a type-safe Supabase client for browser-side operations
 *
 * This factory function initializes a Supabase client optimized for Client Components
 * in Next.js. It automatically handles:
 * - Authentication state persistence via cookies
 * - Automatic session refresh before expiry
 * - Type safety for all database operations
 * - Real-time subscriptions (if needed)
 *
 * @returns A configured Supabase browser client with full TypeScript type definitions
 *
 * @example
 * ```typescript
 * // In a Client Component
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 * import { useEffect, useState } from 'react'
 *
 * export default function ProfileComponent() {
 *   const supabase = createClient()
 *   const [profile, setProfile] = useState(null)
 *
 *   useEffect(() => {
 *     async function loadProfile() {
 *       const { data } = await supabase
 *         .from('profiles')
 *         .select('*')
 *         .single()
 *       setProfile(data)
 *     }
 *     loadProfile()
 *   }, [])
 *
 *   return <div>{profile?.nom}</div>
 * }
 * ```
 *
 * @throws {Error} If NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set
 *
 * @remarks
 * - Should only be used in Client Components (components with 'use client' directive)
 * - For Server Components, use `@/lib/supabase/server` instead
 * - Client is created fresh on each call - consider memoization for performance
 *
 * @see {@link Database} for available database types and schemas
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
