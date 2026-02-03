import type { WorkflowTool } from '@prisma/client';
/**
 * Tool Service - CRUD operations for workflow tools
 */
import { prisma } from '../lib/db.js';
import { decrypt, encrypt } from '../lib/encryption.js';

export interface CreateToolInput {
  name: string;
  description?: string;
  toolType: string;
  configuration: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface UpdateToolInput {
  name?: string;
  description?: string;
  configuration?: Record<string, any>;
  credentials?: Record<string, any>;
  isActive?: boolean;
}

export interface ToolWithDecryptedCredentials extends Omit<WorkflowTool, 'encryptedCredentials'> {
  credentials?: Record<string, any>;
}

export class ToolService {
  /**
   * List all tools for a user
   */
  async list(userId: string): Promise<WorkflowTool[]> {
    return prisma.workflowTool.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a tool by ID
   */
  async getById(id: string, userId: string): Promise<ToolWithDecryptedCredentials | null> {
    const tool = await prisma.workflowTool.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!tool) {
      return null;
    }

    return this.decryptCredentials(tool);
  }

  /**
   * Get a tool by name
   */
  async getByName(name: string, userId: string): Promise<ToolWithDecryptedCredentials | null> {
    const tool = await prisma.workflowTool.findFirst({
      where: {
        name,
        userId,
      },
    });

    if (!tool) {
      return null;
    }

    return this.decryptCredentials(tool);
  }

  /**
   * Create a new tool
   */
  async create(userId: string, input: CreateToolInput): Promise<WorkflowTool> {
    // Encrypt credentials if provided
    let encryptedCredentials: string | null = null;
    if (input.credentials && Object.keys(input.credentials).length > 0) {
      encryptedCredentials = encrypt(JSON.stringify(input.credentials));
    }

    return prisma.workflowTool.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        toolType: input.toolType,
        configuration: input.configuration,
        encryptedCredentials,
      },
    });
  }

  /**
   * Update a tool
   */
  async update(id: string, userId: string, input: UpdateToolInput): Promise<WorkflowTool> {
    // Verify ownership
    const existing = await prisma.workflowTool.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Tool not found');
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.configuration !== undefined) updateData.configuration = input.configuration;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Encrypt new credentials if provided
    if (input.credentials !== undefined) {
      if (Object.keys(input.credentials).length > 0) {
        updateData.encryptedCredentials = encrypt(JSON.stringify(input.credentials));
      } else {
        updateData.encryptedCredentials = null;
      }
    }

    return prisma.workflowTool.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a tool
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.workflowTool.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Tool not found');
    }

    await prisma.workflowTool.delete({
      where: { id },
    });
  }

  /**
   * Update test status
   */
  async updateTestStatus(id: string, status: 'success' | 'failed'): Promise<void> {
    await prisma.workflowTool.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: status,
      },
    });
  }

  /**
   * Helper: Decrypt credentials from a tool
   */
  private decryptCredentials(tool: WorkflowTool): ToolWithDecryptedCredentials {
    const { encryptedCredentials, ...rest } = tool;

    let credentials: Record<string, any> | undefined;
    if (encryptedCredentials) {
      try {
        credentials = JSON.parse(decrypt(encryptedCredentials));
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
      }
    }

    return {
      ...rest,
      credentials,
    };
  }
}

export const toolService = new ToolService();
