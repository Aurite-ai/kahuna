/**
 * Auth API client - plain fetch wrapper for auth endpoints.
 *
 * Uses fetch directly (not tRPC) since auth routes are standard REST endpoints.
 * All requests include credentials for cookie-based session handling.
 */
import { config } from './config';

/**
 * User info returned from auth endpoints.
 * Matches the PublicUser type but defined locally to avoid cross-package imports.
 */
export interface AuthUser {
  id: string;
  email: string;
}

/** Response from register/login endpoints */
interface AuthResponse {
  success: boolean;
  user: AuthUser;
}

/** Response from me endpoint */
interface MeResponse {
  user: AuthUser & { createdAt: string };
}

/** Response from logout endpoint */
interface LogoutResponse {
  success: boolean;
}

/** Error response from auth endpoints */
interface AuthErrorResponse {
  error: string;
}

/**
 * Custom error class for auth API errors.
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * Helper function for making auth API requests.
 * Handles JSON parsing and error responses.
 */
async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${config.apiUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Required for cookie-based auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle non-JSON error responses (e.g., 500 errors)
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new AuthApiError(response.statusText, response.status);
    }
    // This shouldn't happen for our API, but handle it gracefully
    throw new AuthApiError('Unexpected response format', response.status);
  }

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as AuthErrorResponse;
    throw new AuthApiError(errorData.error || 'Request failed', response.status);
  }

  return data as T;
}

/**
 * Auth API methods.
 */
export const authApi = {
  /**
   * Register a new user account.
   * On success, a session cookie is set automatically.
   */
  async register(email: string, password: string): Promise<AuthUser> {
    const response = await authFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.user;
  },

  /**
   * Login with existing credentials.
   * On success, a session cookie is set automatically.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const response = await authFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.user;
  },

  /**
   * Logout the current user.
   * Clears the session cookie.
   */
  async logout(): Promise<void> {
    await authFetch<LogoutResponse>('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Get the current authenticated user.
   * Returns null if not authenticated (401 response).
   */
  async me(): Promise<AuthUser | null> {
    try {
      const response = await authFetch<MeResponse>('/api/auth/me');
      return response.user;
    } catch (error) {
      // 401 means not authenticated - return null instead of throwing
      if (error instanceof AuthApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },
};
