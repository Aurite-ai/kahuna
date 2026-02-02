/**
 * User-related type definitions
 *
 * These types represent user identity for the feedback loop.
 * The loop only needs the user ID - authentication details stay in infrastructure.
 */

/**
 * Basic user information available to the feedback loop.
 * Intentionally minimal - the loop shouldn't need user details.
 */
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User reference type for when we only need the ID.
 * Used in context where full user details aren't needed.
 */
export type UserId = string;

/**
 * Public user info (safe to expose to clients).
 * Excludes sensitive fields like password hash.
 */
export interface PublicUser {
  id: string;
  email: string;
}
