/**
 * AuthContext - React context for managing authentication state.
 *
 * Provides:
 * - Current user state (User | null | 'loading')
 * - Auth methods: login, register, logout
 * - Session restoration on mount
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthApiError, type AuthUser, authApi } from '../lib/auth-api';

/** Auth state can be loading, authenticated, or unauthenticated */
type AuthState = AuthUser | null | 'loading';

/** Context value provided to consumers */
interface AuthContextValue {
  /** Current user, null if not logged in, 'loading' during initial check */
  user: AuthState;
  /** True while checking initial auth state */
  isLoading: boolean;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** Login with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Register a new account */
  register: (email: string, password: string) => Promise<void>;
  /** Logout the current user */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - wraps app to provide auth state.
 * Checks for existing session on mount.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthState>('loading');

  /**
   * Check for existing session on mount.
   * This allows the session to persist across page refreshes.
   */
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch (error) {
      // Network error or unexpected error - assume not authenticated
      console.error('Auth check failed:', error);
      setUser(null);
    }
  }, []);

  // Check auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login with email and password.
   * Throws AuthApiError on failure.
   */
  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
  }, []);

  /**
   * Register a new account.
   * Throws AuthApiError on failure.
   */
  const register = useCallback(async (email: string, password: string) => {
    const newUser = await authApi.register(email, password);
    setUser(newUser);
  }, []);

  /**
   * Logout the current user.
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout request fails, clear local state
      console.error('Logout request failed:', error);
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: user === 'loading',
      isAuthenticated: user !== null && user !== 'loading',
      login,
      register,
      logout,
    }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export types and errors for convenience
export type { AuthUser };
export { AuthApiError };
