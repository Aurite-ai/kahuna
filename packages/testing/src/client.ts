/**
 * API client for testing the Kahuna feedback loop
 *
 * This client wraps the tRPC endpoints and uses the test auth bypass
 * header (X-Test-User-Id) for authentication in development/test mode.
 *
 * Note: Requires Node.js 18+ for native fetch support.
 */

import type {
  ApiClientOptions,
  BuildResult,
  BuildResultInput,
  ContextFile,
  Project,
  TRPCError,
  TRPCResult,
  VckGenerateResponse,
  VckGeneration,
} from "./types.js";
import { SEED_DATA } from "./types.js";

/**
 * API client for programmatic testing of the feedback loop.
 *
 * Uses the X-Test-User-Id header for test authentication bypass.
 * Works in development and test environments only.
 */
export class TestApiClient {
  private baseUrl: string;
  private testUserId: string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || "http://localhost:3000";
    this.testUserId = options.testUserId || SEED_DATA.TEST_USER_1_ID;
  }

  /**
   * Make a tRPC mutation (POST request)
   */
  private async mutation<T>(
    procedure: string,
    input: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/trpc/${procedure}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-User-Id": this.testUserId,
      },
      body: JSON.stringify(input),
    });

    const data = (await response.json()) as TRPCResult<T> | TRPCError;

    if (!response.ok || "error" in data) {
      const error = data as TRPCError;
      throw new Error(
        error.error?.message || `Request failed with status ${response.status}`,
      );
    }

    return (data as TRPCResult<T>).result.data;
  }

  /**
   * Make a tRPC query (GET request)
   */
  private async query<T>(
    procedure: string,
    input?: Record<string, unknown>,
  ): Promise<T> {
    let url = `${this.baseUrl}/api/trpc/${procedure}`;

    if (input) {
      const encodedInput = encodeURIComponent(JSON.stringify(input));
      url += `?input=${encodedInput}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Test-User-Id": this.testUserId,
      },
    });

    const data = (await response.json()) as TRPCResult<T> | TRPCError;

    if (!response.ok || "error" in data) {
      const error = data as TRPCError;
      throw new Error(
        error.error?.message || `Request failed with status ${response.status}`,
      );
    }

    return (data as TRPCResult<T>).result.data;
  }

  /**
   * Set the test user ID for subsequent requests
   */
  setTestUserId(userId: string): void {
    this.testUserId = userId;
  }

  /**
   * Get the current test user ID
   */
  getTestUserId(): string {
    return this.testUserId;
  }

  // ==================== Project Operations ====================

  /**
   * Create a new project
   */
  async createProject(name: string): Promise<Project> {
    return this.mutation<Project>("project.create", { name });
  }

  /**
   * List all projects for the test user
   */
  async listProjects(): Promise<Project[]> {
    return this.query<Project[]>("project.list");
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: string): Promise<Project> {
    return this.query<Project>("project.get", { id });
  }

  // ==================== Context Operations ====================

  /**
   * Create a context file for a project
   */
  async createContext(
    projectId: string,
    filename: string,
    content: string,
  ): Promise<ContextFile> {
    return this.mutation<ContextFile>("context.create", {
      projectId,
      filename,
      content,
    });
  }

  /**
   * List all context files for a project
   */
  async listContextFiles(projectId: string): Promise<ContextFile[]> {
    return this.query<ContextFile[]>("context.list", { projectId });
  }

  /**
   * Get a specific context file
   */
  async getContextFile(id: string): Promise<ContextFile> {
    return this.query<ContextFile>("context.get", { id });
  }

  // ==================== VCK Operations ====================

  /**
   * Generate a VCK for a project
   */
  async generateVck(
    projectId: string,
    options?: { framework?: string; copilot?: string },
  ): Promise<VckGenerateResponse> {
    return this.mutation<VckGenerateResponse>("vck.generate", {
      projectId,
      ...options,
    });
  }

  /**
   * List all VCK generations for a project (via history endpoint)
   */
  async listVckGenerations(projectId: string): Promise<VckGeneration[]> {
    return this.query<VckGeneration[]>("vck.history", {
      projectId,
    });
  }

  // ==================== Results Operations ====================

  /**
   * Submit build results for a project with structured fields
   */
  async submitResults(input: BuildResultInput): Promise<BuildResult> {
    return this.mutation<BuildResult>(
      "results.submit",
      input as unknown as Record<string, unknown>,
    );
  }

  /**
   * List all build results for a project
   */
  async listResults(projectId: string): Promise<BuildResult[]> {
    return this.query<BuildResult[]>("results.list", { projectId });
  }

  /**
   * Get a specific build result
   */
  async getResult(id: string): Promise<BuildResult> {
    return this.query<BuildResult>("results.get", { id });
  }

  // ==================== Health Check ====================

  /**
   * Check if the API is running
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.query<{ status: string; timestamp: string }>("health.ping");
  }
}

/**
 * Create a new API client with default options
 */
export function createTestClient(options?: ApiClientOptions): TestApiClient {
  return new TestApiClient(options);
}
