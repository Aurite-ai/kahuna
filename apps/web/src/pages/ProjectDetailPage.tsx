/**
 * ProjectDetailPage - View project details, list context files, and upload new files.
 *
 * Features:
 * - Fetches project with context files via tRPC
 * - Displays project name and description
 * - Lists existing context files (name, size)
 * - File upload using FileReader (immediate upload on selection)
 * - VCK export with download
 * - Loading and error states
 *
 * Layout: Contained card with linear top-to-bottom flow
 * 1. Upload button (top, centered)
 * 2. Context Files table (middle)
 * 3. Export VCK button (bottom, centered, enabled when files exist)
 */
import { type ChangeEvent, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { config } from '../lib/config';
import { trpc } from '../lib/trpc';

/**
 * Format file size in bytes to human-readable string.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Derive MIME type from file extension.
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
      return 'application/json';
    case 'yaml':
    case 'yml':
      return 'application/x-yaml';
    case 'md':
      return 'text/markdown';
    default:
      return 'text/plain';
  }
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Fetch project with context files
  const {
    data: project,
    isLoading,
    error: fetchError,
  } = trpc.project.get.useQuery({ id: id ?? '' }, { enabled: !!id });

  // Create context file mutation
  const createContext = trpc.context.create.useMutation({
    onSuccess: () => {
      // Clear error, invalidate project query to refetch files
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (id) {
        utils.project.get.invalidate({ id });
      }
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });

  // Update context file mutation (for upsert)
  const updateContext = trpc.context.update.useMutation({
    onSuccess: () => {
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (id) {
        utils.project.get.invalidate({ id });
      }
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });

  // Delete context file mutation
  const deleteContext = trpc.context.delete.useMutation({
    onSuccess: () => {
      if (id) {
        utils.project.get.invalidate({ id });
      }
    },
  });

  /**
   * Handle VCK export by fetching ZIP from Express endpoint.
   */
  const handleExportVCK = async () => {
    if (!project) return;

    setExportError(null);
    setIsExporting(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/vck/${project.id}/download`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download VCK');
      }

      // Create download from blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.vck.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !project) return;

    setUploadError(null);

    try {
      // Read file content as text
      const content = await file.text();

      // Check if file with same name exists (upsert behavior)
      const existingFile = project.contextFiles.find((f) => f.filename === file.name);

      if (existingFile) {
        // Update existing file
        updateContext.mutate({
          id: existingFile.id,
          filename: file.name,
          content,
        });
      } else {
        // Create new file
        createContext.mutate({
          projectId: id,
          filename: file.name,
          content,
        });
      }
    } catch {
      setUploadError('Failed to read file');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    deleteContext.mutate({ id: fileId });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-4 text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Back to Projects
        </Link>
        <div className="flex justify-center py-8">
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-4 text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Back to Projects
        </Link>
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {fetchError.message}
        </div>
      </div>
    );
  }

  // No project found (shouldn't happen if fetchError is handled)
  if (!project) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-4 text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Back to Projects
        </Link>
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          Project not found
        </div>
      </div>
    );
  }

  const hasFiles = project.contextFiles.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/"
        className="inline-block mb-4 text-gray-500 hover:text-blue-600 transition-colors"
      >
        ← Back to Projects
      </Link>

      {/* Project header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{project.name}</h2>

      {/* Main content card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Upload section */}
        <div className="p-6 flex flex-col items-center text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.yaml,.yml"
            onChange={handleFileSelect}
            disabled={createContext.isPending}
            className="sr-only"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={createContext.isPending || updateContext.isPending}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createContext.isPending || updateContext.isPending
              ? 'Uploading...'
              : 'Upload Business Context'}
          </button>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Context files list */}
        <div className="p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">
            Context Files
          </h3>
          {!hasFiles ? (
            <p className="text-gray-500 text-center">
              No context files yet. Upload a file to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {project.contextFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-900">{file.filename}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {formatFileSize(file.content.length)} · {getMimeType(file.filename)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deleteContext.isPending}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                      title="Delete file"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-labelledby={`delete-${file.id}`}
                        role="img"
                      >
                        <title id={`delete-${file.id}`}>Delete file</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Export section */}
        <div className="p-6 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={handleExportVCK}
            disabled={isExporting || !hasFiles}
            className={`w-full px-6 py-3 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              hasFiles
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {isExporting ? 'Downloading...' : 'Export Vibe Code Kit'}
          </button>
          {!hasFiles && (
            <p className="mt-2 text-sm text-gray-500">Upload at least one context file to export</p>
          )}
          {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}
        </div>
      </div>
    </div>
  );
}
