/**
 * ProtectedRoute - Guards routes that require authentication.
 *
 * Shows loading state while checking auth, redirects to login if not authenticated,
 * renders children (via Outlet) if authenticated.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render nested routes
  return <Outlet />;
}
