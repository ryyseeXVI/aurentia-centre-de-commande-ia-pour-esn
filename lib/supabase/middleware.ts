/**
 * Supabase Middleware for Next.js
 *
 * @fileoverview Handles authentication session management and route protection
 * in Next.js middleware. This ensures users stay authenticated across page
 * navigations and enforces access control rules.
 *
 * @module lib/supabase/middleware
 *
 * @security
 * - Validates authentication state on every request
 * - Automatically refreshes expired sessions
 * - Enforces route-level access control
 * - Prevents unauthorized access to protected routes
 * - Redirects authenticated users away from auth pages
 *
 * @see {@link https://supabase.com/docs/guides/auth/server-side/creating-a-client|Supabase Auth Guide}
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware|Next.js Middleware}
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

/**
 * Updates and validates user authentication session on each request
 *
 * This middleware function runs on every page request to:
 * 1. Refresh authentication session if needed (before expiry)
 * 2. Validate current user authentication state
 * 3. Enforce route access control rules
 * 4. Redirect users based on authentication status
 * 5. Update session cookies in the response
 *
 * **Route Protection Rules:**
 * - Public routes: `/`, `/login`, `/register`, `/auth/callback`
 * - Auth pages (`/login`, `/register`): Redirect to dashboard if authenticated
 * - Protected routes: Redirect to `/register` if not authenticated
 * - Callback route: Always allowed (OAuth flow)
 *
 * @param request - The incoming Next.js request object
 * @returns A Next.js response with updated cookies and potential redirects
 *
 * @async
 *
 * @example
 * ```typescript
 * // middleware.ts (root)
 * import { updateSession } from '@/lib/supabase/middleware'
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 *
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * }
 * ```
 *
 * @throws {Error} If Supabase configuration is invalid
 *
 * @remarks
 * **CRITICAL:** Do not add logic between createServerClient and supabase.auth.getUser().
 * This can cause race conditions and random session terminations.
 *
 * **Cookie Handling:** The returned response MUST include the supabaseResponse cookies.
 * Failing to do so will cause sessions to terminate prematurely.
 *
 * @see {@link createClient} for server-side Supabase client usage
 */
export async function updateSession(request: NextRequest) {
  // Initialize response object that will carry updated session cookies
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with custom cookie handlers for middleware context
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Read all cookies from the incoming request
         * Required for session validation and refresh
         */
        getAll() {
          return request.cookies.getAll()
        },
        /**
         * Update cookies in both request and response objects
         * This ensures session updates are persisted across redirects
         * @param cookiesToSet - Updated session cookies from Supabase
         */
        setAll(cookiesToSet) {
          // Update request cookies (for potential redirects)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })

          // Set cookies in response (sent back to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Validate current session and retrieve user (auto-refreshes if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define route access control lists
  const publicPaths = ['/login', '/register', '/', '/auth/callback']
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname)
  const isAuthPath = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'
  const isCallbackPath = request.nextUrl.pathname === '/auth/callback'

  // Allow OAuth callback route to pass through without any redirects
  // Callback route handles its own redirect after processing OAuth tokens
  if (isCallbackPath) {
    return supabaseResponse
  }

  // Prevent authenticated users from accessing login/register pages
  // Redirect them to the main dashboard instead
  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protect all non-public routes by redirecting unauthenticated users
  // Exclude Next.js internal routes (_next/) and API routes (/api/)
  if (
    !user &&
    !isPublicPath &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
