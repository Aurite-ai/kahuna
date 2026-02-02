/**
 * App - Root component with route definitions.
 *
 * Route structure:
 * - /login          → LoginPage (public)
 * - /register       → RegisterPage (public)
 * - /               → ProjectListPage (protected)
 * - /projects/:id   → ProjectDetailPage (protected)
 */
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { RegisterPage } from './pages/RegisterPage';

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
