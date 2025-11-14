/**
 * Rate Limiting Wrapper for API Routes
 *
 * PLACEHOLDER IMPLEMENTATION
 * TODO: Integrate with actual rate limiting solution (Upstash Redis, Vercel KV, etc.)
 *
 * This wrapper:
 * 1. Optionally checks authentication
 * 2. Applies rate limiting based on user ID or IP address
 * 3. Calls the wrapped handler if allowed
 * 4. Returns 429 Too Many Requests if rate limit exceeded
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import type { RateLimiter } from './rate-limit';
import { logger } from '@/lib/logger';

/**
 * Wrapper function to add rate limiting to API route handlers
 *
 * @param handler - The API route handler function
 * @param rateLimiter - The rate limiter configuration to use
 * @param requireAuth - Whether authentication is required (default: true)
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * async function handleGet(request: NextRequest) {
 *   // ... handler logic
 * }
 *
 * export const GET = withUserRateLimit(
 *   handleGet,
 *   generalRateLimiter,
 *   true // require auth
 * );
 * ```
 */
export function withUserRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  rateLimiter: RateLimiter,
  requireAuth: boolean = true
) {
  return async function rateLimitedHandler(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      let identifier: string;

      if (requireAuth) {
        // For authenticated routes, use user ID as identifier
        const supabase = await createServerSupabaseClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        identifier = user.id;
      } else {
        // For public routes, use IP address as identifier
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        identifier = forwardedFor?.split(',')[0] || realIp || 'anonymous';
      }

      // Apply rate limiting
      const { success, remaining, reset } = await rateLimiter.limit(identifier);

      if (!success) {
        logger.warn('Rate limit exceeded', {
          identifier,
          path: request.nextUrl.pathname,
          maxRequests: rateLimiter.maxRequests,
          windowMs: rateLimiter.windowMs,
        });

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Maximum ${rateLimiter.maxRequests} requests per ${rateLimiter.windowMs / 1000} seconds.`,
            retryAfter: reset,
          },
          {
            status: 429,
            headers: {
              'Retry-After': reset ? String(Math.ceil(reset / 1000)) : '60',
              'X-RateLimit-Limit': String(rateLimiter.maxRequests),
              'X-RateLimit-Remaining': String(remaining || 0),
              'X-RateLimit-Reset': reset ? String(reset) : '',
            },
          }
        );
      }

      // Rate limit passed, call the original handler
      const response = await handler(request, context);

      // Add rate limit headers to successful responses
      if (remaining !== undefined) {
        response.headers.set('X-RateLimit-Limit', String(rateLimiter.maxRequests));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        if (reset) {
          response.headers.set('X-RateLimit-Reset', String(reset));
        }
      }

      return response;
    } catch (error) {
      logger.error('Error in rate limit wrapper', error, {
        path: request.nextUrl.pathname,
      });

      // On error, allow the request through (fail open)
      // In production, you might want to fail closed instead
      return await handler(request, context);
    }
  };
}
