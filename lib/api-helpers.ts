/**
 * API Route Helper Utilities
 *
 * Provides reusable utility functions for API routes to reduce boilerplate and ensure
 * consistent response patterns across all endpoints.
 *
 * @module lib/api-helpers
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a successful JSON response
 *
 * @template T - Type of the response data
 * @param {T} data - Response data to send to client
 * @param {number} status - HTTP status code (default: 200)
 * @returns {NextResponse} Next.js response with data wrapped in {data: T}
 *
 * @example
 * return successResponse({ id: '123', name: 'Acme' })
 * // Returns: { "data": { "id": "123", "name": "Acme" } } with status 200
 *
 * @example
 * return successResponse({ created: true }, 201)
 * // Returns: { "data": { "created": true } } with status 201
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Create an error response
 *
 * @param {string} error - Error message to send to client
 * @param {number} status - HTTP status code (default: 400 Bad Request)
 * @returns {NextResponse} Next.js response with error message
 *
 * @example
 * return errorResponse('Invalid email format', 400)
 * // Returns: { "error": "Invalid email format" } with status 400
 */
export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Create a 401 Unauthorized response
 *
 * Use when user is not authenticated (no valid session).
 *
 * @param {string} message - Custom error message (default: 'Not authenticated')
 * @returns {NextResponse} 401 response
 *
 * @example
 * const { user, error } = await authenticateUser(supabase)
 * if (error) return unauthorizedResponse()
 */
export function unauthorizedResponse(message = 'Not authenticated') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a 403 Forbidden response
 *
 * Use when user is authenticated but lacks required permissions.
 *
 * @param {string} message - Custom error message (default: 'Insufficient permissions')
 * @returns {NextResponse} 403 response
 *
 * @example
 * if (userRole !== 'ADMIN') {
 *   return forbiddenResponse('ADMIN role required')
 * }
 */
export function forbiddenResponse(message = 'Insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Create a 404 Not Found response
 *
 * @param {string} resource - Name of the resource that wasn't found (default: 'Resource')
 * @returns {NextResponse} 404 response
 *
 * @example
 * return notFoundResponse('Organization')
 * // Returns: { "error": "Organization not found" } with status 404
 */
export function notFoundResponse(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

/**
 * Create a 422 Unprocessable Entity response for validation errors
 *
 * Use when input validation fails (typically from Zod schema validation).
 *
 * @param {any} errors - Validation errors object (typically from Zod)
 * @returns {NextResponse} 422 response with validation errors
 *
 * @example
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   return validationErrorResponse(result.error.flatten().fieldErrors)
 * }
 */
export function validationErrorResponse(errors: any) {
  return NextResponse.json({ error: 'Validation failed', errors }, { status: 422 });
}

// ============================================================================
// AUTHENTICATION HELPER
// ============================================================================

export async function authenticateUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Not authenticated' };
  }

  return { user, error: null };
}

// ============================================================================
// ROLE & AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if user has OWNER role (unrestricted access across all organizations)
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns true if user is OWNER, false otherwise
 */
export async function isOwnerRole(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'OWNER';
}

/**
 * Get user's role from profiles table
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns User role or null
 */
export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role || null;
}

/**
 * Get all organization IDs that a user belongs to
 * If user is OWNER, returns null (indicating access to all organizations)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Array of organization IDs, or null if user is OWNER
 */
export async function getUserOrganizations(
  supabase: SupabaseClient,
  userId: string
): Promise<string[] | null> {
  // Check if user is OWNER first
  const isOwner = await isOwnerRole(supabase, userId);
  if (isOwner) {
    return null; // null indicates unrestricted access
  }

  // Get user's organizations
  const { data: memberships } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', userId);

  return memberships?.map(m => m.organization_id) || [];
}

/**
 * Check if user has ADMIN or OWNER role in a specific organization
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns true if user is ADMIN or OWNER, false otherwise
 */
export async function hasAdminAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Check if user is OWNER (global admin)
  const isOwner = await isOwnerRole(supabase, userId);
  if (isOwner) return true;

  // Check organization-specific role
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  return membership?.role === 'ADMIN' || membership?.role === 'OWNER';
}

// ============================================================================
// ERROR HANDLING WRAPPER
// ============================================================================

export function handleApiError(error: any) {
  logger.error('API Error', error);

  if (error.message) {
    // Known error (from our code or Supabase)
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') || error.message.includes('Insufficient') ? 403 :
                   error.message.includes('authenticated') ? 401 : 500;
    return errorResponse(error.message, status);
  }

  // Unknown error
  return errorResponse('An unexpected error occurred', 500);
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = params;
  const hasMore = page * limit < total;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },
  };
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

  return { page, limit };
}

export function applyPagination(page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, to };
}

// ============================================================================
// RATE LIMITING PLACEHOLDER
// ============================================================================

/**
 * Rate limiting placeholder
 * In production, integrate with your rate limiting solution (Upstash Redis, etc.)
 * For now, this is a no-op that always returns success
 */
export async function checkRateLimit(userId: string): Promise<{ success: boolean }> {
  // TODO: Implement actual rate limiting
  // Example with Upstash Redis:
  // const { success } = await rateLimiter.limit(userId);
  // if (!success) {
  //   throw new Error('Too many requests');
  // }
  return { success: true };
}

// ============================================================================
// ACTIVITY LOGGING HELPER
// ============================================================================

export async function logActivity(
  supabase: SupabaseClient,
  action: string,
  description: string,
  options: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = options.userId || user?.id;

    if (!userId) return;

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      description,
      resource_type: options.resourceType || null,
      resource_id: options.resourceId || null,
      organization_id: options.organizationId || null,
      metadata: options.metadata || {},
    });
  } catch (error) {
    // Don't throw - activity logging should never break the main operation
    logger.warn('Failed to log activity', { error, action, description });
  }
}
