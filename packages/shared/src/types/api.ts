/**
 * API type exports for frontend type safety
 *
 * This file re-exports the tRPC router type from the API package.
 * The frontend can import this type for end-to-end type safety with tRPC.
 *
 * Note: The actual AppRouter type is defined in apps/api/src/trpc/router.ts
 * and should be imported directly by packages that need it. This file
 * provides convenience re-exports and API-related types.
 */

/**
 * Standard API response wrapper for non-tRPC endpoints.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Auth response for login/register endpoints.
 */
export interface AuthResponse {
  success: boolean;
  error?: string;
}

/**
 * Health check response.
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
