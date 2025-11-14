// API Route Helper Utilities
// Reduces boilerplate in API routes

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function unauthorizedResponse(message = "Not authenticated") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Insufficient permissions") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFoundResponse(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function validationErrorResponse(errors: any) {
  return NextResponse.json(
    { error: "Validation failed", errors },
    { status: 422 },
  );
}

// ============================================================================
// AUTHENTICATION HELPER
// ============================================================================

export async function authenticateUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "Not authenticated" };
  }

  return { user, error: null };
}

// ============================================================================
// ERROR HANDLING WRAPPER
// ============================================================================

export function handleApiError(error: any) {
  console.error("API Error:", error);

  if (error.message) {
    // Known error (from our code or Supabase)
    const status = error.message.includes("not found")
      ? 404
      : error.message.includes("Access denied") ||
          error.message.includes("Insufficient")
        ? 403
        : error.message.includes("authenticated")
          ? 401
          : 500;
    return errorResponse(error.message, status);
  }

  // Unknown error
  return errorResponse("An unexpected error occurred", 500);
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
  params: PaginationParams,
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

export function getPaginationParams(
  searchParams: URLSearchParams,
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
  );

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
export async function checkRateLimit(
  _userId: string,
): Promise<{ success: boolean }> {
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
  } = {},
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = options.userId || user?.id;

    if (!userId) return;

    await supabase.from("activity_logs").insert({
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
    console.error("Failed to log activity:", error);
  }
}
