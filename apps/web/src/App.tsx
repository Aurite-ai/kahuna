/**
 * App - Root component with route definitions.
 *
 * Route structure:
 * - /login          → LoginPage (public)
 * - /register       → RegisterPage (public)
 * - /               → ProjectListPage (protected) [placeholder]
 * - /projects/:id   → ProjectDetailPage (protected) [placeholder]
 */
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Placeholder components for protected routes (to be implemented in Phase 4/5)
function ProjectListPage() {
  return (
    <div>
      <h2>Projects</h2>
      <p>Project list will be implemented in Phase 4.</p>
    </div>
  );
}

function ProjectDetailPage() {
  return (
    <div>
      <h2>Project Detail</h2>
      <p>Project detail will be implemented in Phase 5.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<ProjectListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
