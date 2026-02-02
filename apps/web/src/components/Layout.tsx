/**
 * Layout - Shared layout wrapper for authenticated pages.
 *
 * Provides header with app name, user info, and logout button.
 * Renders nested routes via Outlet.
 */
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // User should never be null or 'loading' here (ProtectedRoute handles that)
  const userEmail = typeof user === 'object' && user !== null ? user.email : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '1rem',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Kahuna</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{userEmail}</span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
