/**
 * HTTP Client for MCP Server
 *
 * This module creates an HTTP client that connects to the Kahuna tRPC API.
 * The MCP server uses this client to call tRPC procedures via HTTP.
 *
 * Using direct HTTP calls instead of the tRPC client to:
 * 1. Avoid complex type dependencies on the API package
 * 2. Keep this package self-contained
 * 3. Provide a simpler template for the team
 *
 * Configuration is via environment variables:
 * - KAHUNA_API_URL: Base URL of the Kahuna API (default: http://localhost:3000)
 * - KAHUNA_SESSION_TOKEN: Session token for authentication
 */

// Type definitions for API entities
export interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextFile {
  id: string;
  projectId: string;
  filename: string;
  content: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

export interface VckGeneration {
  id: string;
  projectId: string;
  createdAt: string;
}

export interface BuildResult {
  id: string;
  generationId: string;
  conversationLog: string;
  resultCode?: string;
  errorMessages?: string;
  createdAt: string;
}

/**
 * Configuration for the Kahuna client
 */
export interface KahunaClientConfig {
  /** Base URL of the Kahuna API */
  apiUrl: string;
  /** Session token for authentication (from cookie or environment) */
  sessionToken?: string;
}

/**
 * tRPC batch response format
 */
interface TRPCBatchResponse<T> {
  result: {
    data: T;
  };
}

/**
 * Kahuna API Client
 *
 * Provides typed methods for calling tRPC procedures via HTTP.
 * This is a simplified client that doesn't require the full tRPC client setup.
 */
export class KahunaClient {
  private baseUrl: string;
  private sessionToken?: string;

  constructor(config: KahunaClientConfig) {
    this.baseUrl = config.apiUrl;
    this.sessionToken = config.sessionToken;
  }

  /**
   * Make a tRPC query call (GET request)
   */
  private async query<T>(procedure: string, input?: unknown): Promise<T> {
    const url = new URL(`${this.baseUrl}/trpc/${procedure}`);

    if (input !== undefined) {
      url.searchParams.set('input', JSON.stringify(input));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`tRPC query failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as TRPCBatchResponse<T>;
    return data.result.data;
  }

  /**
   * Make a tRPC mutation call (POST request)
   */
  private async mutate<T>(procedure: string, input: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}/trpc/${procedure}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`tRPC mutation failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as TRPCBatchResponse<T>;
    return data.result.data;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionToken) {
      headers.Cookie = `kahuna_session=${this.sessionToken}`;
    }

    return headers;
  }

  // ===========================================================================
  // PROJECT ROUTER
  // ===========================================================================

  /**
   * Create a new project
   */
  async projectCreate(input: { name: string; description?: string }): Promise<Project> {
    return this.mutate<Project>('project.create', input);
  }

  /**
   * List all projects for the authenticated user
   */
  async projectList(): Promise<Project[]> {
    return this.query<Project[]>('project.list');
  }

  /**
   * Get a project by ID
   */
  async projectGet(input: { id: string }): Promise<Project> {
    return this.query<Project>('project.get', input);
  }

  /**
   * Update a project
   */
  async projectUpdate(input: {
    id: string;
    name?: string;
    description?: string | null;
  }): Promise<Project> {
    return this.mutate<Project>('project.update', input);
  }

  /**
   * Delete a project
   */
  async projectDelete(input: { id: string }): Promise<{ success: boolean }> {
    return this.mutate<{ success: boolean }>('project.delete', input);
  }

  // ===========================================================================
  // CONTEXT ROUTER (template - implement when wrapping context router)
  // ===========================================================================

  /**
   * Create a context file
   */
  async contextCreate(input: {
    projectId: string;
    filename: string;
    content: string;
    fileType: string;
  }): Promise<ContextFile> {
    return this.mutate<ContextFile>('context.create', input);
  }

  /**
   * List context files for a project
   */
  async contextList(input: { projectId: string }): Promise<ContextFile[]> {
    return this.query<ContextFile[]>('context.list', input);
  }

  /**
   * Get a context file by ID
   */
  async contextGet(input: { id: string }): Promise<ContextFile> {
    return this.query<ContextFile>('context.get', input);
  }

  /**
   * Update a context file
   */
  async contextUpdate(input: {
    id: string;
    filename?: string;
    content?: string;
  }): Promise<ContextFile> {
    return this.mutate<ContextFile>('context.update', input);
  }

  /**
   * Delete a context file
   */
  async contextDelete(input: { id: string }): Promise<{ success: boolean }> {
    return this.mutate<{ success: boolean }>('context.delete', input);
  }

  // ===========================================================================
  // VCK ROUTER (template - implement when wrapping vck router)
  // ===========================================================================

  /**
   * Generate a VCK
   */
  async vckGenerate(input: { projectId: string }): Promise<VckGeneration> {
    return this.mutate<VckGeneration>('vck.generate', input);
  }

  // ===========================================================================
  // RESULTS ROUTER (template - implement when wrapping results router)
  // ===========================================================================

  /**
   * Submit build results
   */
  async resultsSubmit(input: {
    generationId: string;
    conversationLog: string;
    resultCode?: string;
    errorMessages?: string;
  }): Promise<BuildResult> {
    return this.mutate<BuildResult>('results.submit', input);
  }

  /**
   * List build results for a project
   */
  async resultsList(input: { projectId: string }): Promise<BuildResult[]> {
    return this.query<BuildResult[]>('results.list', input);
  }

  // ===========================================================================
  // HEALTH CHECK
  // ===========================================================================

  /**
   * Ping the API to verify connectivity
   */
  async healthPing(): Promise<{ status: string; timestamp: string }> {
    return this.query<{ status: string; timestamp: string }>('health.ping');
  }
}

/**
 * Create a client from environment variables.
 * Convenience function for the MCP server entry point.
 */
export function createClientFromEnv(): KahunaClient {
  const apiUrl = process.env.KAHUNA_API_URL || 'http://localhost:3000';
  const sessionToken = process.env.KAHUNA_SESSION_TOKEN;

  if (!sessionToken) {
    console.warn(
      '[MCP Server] Warning: KAHUNA_SESSION_TOKEN not set. API calls will be unauthenticated.',
    );
  }

  return new KahunaClient({ apiUrl, sessionToken });
}
