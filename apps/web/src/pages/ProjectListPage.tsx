/**
 * ProjectListPage - Lists user's projects with create functionality.
 *
 * Features:
 * - Fetches and displays user's projects via tRPC
 * - Create new project form
 * - Navigation to project detail page
 * - Loading and error states
 */
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';

export function ProjectListPage() {
  const [newProjectName, setNewProjectName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Fetch projects
  const { data: projects, isLoading, error: fetchError } = trpc.project.list.useQuery();

  // Create project mutation
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      // Clear form and invalidate list to refetch
      setNewProjectName('');
      setCreateError(null);
      utils.project.list.invalidate();
    },
    onError: (error) => {
      setCreateError(error.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setCreateError('Project name is required');
      return;
    }
    setCreateError(null);
    createProject.mutate({ name: trimmedName });
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Projects</h2>
        <div className="flex justify-center py-8">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Projects</h2>
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          Error loading projects: {fetchError.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Projects</h2>

      {/* Create project form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3 items-start">
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
              disabled={createProject.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {createError && <p className="mt-1 text-sm text-red-600">{createError}</p>}
          </div>
          <button
            type="submit"
            disabled={createProject.isPending}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>

      {/* Project list */}
      {projects && projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No projects yet. Create your first project above!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects?.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
