/**
 * Testing-specific type definitions for @kahuna/testing
 *
 * These types define the CLI configuration and API client interfaces
 * used for programmatic testing of the feedback loop.
 */

/**
 * Configuration file schema (.kahuna)
 * Stored at repository root, gitignored
 */
export interface KahunaConfig {
  tester: {
    /** Tester's name for attribution */
    name: string;
    /** Optional email for identification */
    email?: string;
  };
  defaults: {
    /** Default copilot: claude-code | cursor | codex */
    copilot: "claude-code" | "cursor" | "codex";
    /** Default framework: langgraph */
    framework: "langgraph";
    /** Last-used scenario ID */
    scenario?: string;
  };
  api: {
    /** API base URL (default: http://localhost:3000) */
    url: string;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: KahunaConfig = {
  tester: {
    name: "Anonymous",
  },
  defaults: {
    copilot: "claude-code",
    framework: "langgraph",
  },
  api: {
    url: "http://localhost:3000",
  },
};

/**
 * Test session information returned after creating a test project
 */
export interface TestSessionInfo {
  /** Session/project ID for tracking */
  projectId: string;
  /** User ID used for the test */
  userId: string;
  /** Project name */
  projectName: string;
  /** Timestamp when session was created */
  createdAt: string;
}

/**
 * API client options
 */
export interface ApiClientOptions {
  /** Base URL for the API (default: http://localhost:3000) */
  baseUrl?: string;
  /** Test user ID to use for authentication bypass */
  testUserId?: string;
}

/**
 * tRPC response wrapper for successful responses
 */
export interface TRPCResult<T> {
  result: {
    data: T;
  };
}

/**
 * tRPC error response
 */
export interface TRPCError {
  error: {
    message: string;
    code: number;
    data?: {
      code: string;
      httpStatus: number;
      path: string;
    };
  };
}

/**
 * Project from API
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Context file from API
 */
export interface ContextFile {
  id: string;
  projectId: string;
  filename: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * VCK generation record from API
 */
export interface VckGeneration {
  id: string;
  projectId: string;
  contextSnapshot: string[];
  framework: string;
  copilot: string;
  createdAt: string;
}

/**
 * VCK generation response from API
 */
export interface VckGenerateResponse {
  vck: {
    metadata: {
      projectId: string;
      generatedAt: string;
      version: string;
    };
    context: {
      businessSummary: string;
      files: Record<string, string>;
    };
    rules: string[];
    boilerplate: Record<string, string>;
  };
  /** Generation ID from the database record */
  generationId: string;
}

/**
 * File content map - maps relative paths to file contents
 */
export type FileContentMap = Record<string, string>;

/**
 * Build result input for submitting results
 */
export interface BuildResultInput {
  projectId: string;
  code: FileContentMap;
  docs: FileContentMap;
  tests: FileContentMap;
  conversationLog?: string;
}

/**
 * Build result from API
 */
export interface BuildResult {
  id: string;
  projectId: string;
  code: FileContentMap;
  docs: FileContentMap;
  tests: FileContentMap;
  conversationLog?: string | null;
  createdAt: string;
}

/**
 * Seed data constants - fixed CUIDs for reproducible testing
 * These match the IDs created by apps/api/prisma/seed.ts
 */
export const SEED_DATA = {
  TEST_USER_1_ID: "cm6mwpnw80000qz1ktest0001",
  TEST_USER_2_ID: "cm6mwpnw80001qz1ktest0002",
  SAMPLE_PROJECT_ID: "cm6mwpnw80002qz1ktest0003",
  SAMPLE_CONTEXT_ID: "cm6mwpnw80003qz1ktest0004",
} as const;
