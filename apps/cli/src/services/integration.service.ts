import type { WorkflowIntegration } from '@prisma/client';
/**
 * Integration Service - CRUD operations for workflow integrations
 */
import { prisma } from '../lib/db.js';
import { decrypt, encrypt } from '../lib/encryption.js';

export interface CreateIntegrationInput {
  name: string;
  description?: string;
  integrationType: string;
  configuration: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface UpdateIntegrationInput {
  name?: string;
  description?: string;
  configuration?: Record<string, any>;
  credentials?: Record<string, any>;
  isActive?: boolean;
}

export interface IntegrationWithDecryptedCredentials
  extends Omit<WorkflowIntegration, 'encryptedCredentials'> {
  credentials?: Record<string, any>;
}

export class IntegrationService {
  /**
   * List all integrations for a user
   */
  async list(userId: string): Promise<WorkflowIntegration[]> {
    return prisma.workflowIntegration.findMany({
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
   * Get an integration by ID
   */
  async getById(id: string, userId: string): Promise<IntegrationWithDecryptedCredentials | null> {
    const integration = await prisma.workflowIntegration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!integration) {
      return null;
    }

    return this.decryptCredentials(integration);
  }

  /**
   * Get an integration by name
   */
  async getByName(
    name: string,
    userId: string
  ): Promise<IntegrationWithDecryptedCredentials | null> {
    const integration = await prisma.workflowIntegration.findFirst({
      where: {
        name,
        userId,
      },
    });

    if (!integration) {
      return null;
    }

    return this.decryptCredentials(integration);
  }

  /**
   * Create a new integration
   */
  async create(userId: string, input: CreateIntegrationInput): Promise<WorkflowIntegration> {
    // Encrypt credentials if provided
    let encryptedCredentials: string | null = null;
    if (input.credentials && Object.keys(input.credentials).length > 0) {
      encryptedCredentials = encrypt(JSON.stringify(input.credentials));
    }

    return prisma.workflowIntegration.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        integrationType: input.integrationType,
        configuration: input.configuration,
        encryptedCredentials,
      },
    });
  }

  /**
   * Update an integration
   */
  async update(
    id: string,
    userId: string,
    input: UpdateIntegrationInput
  ): Promise<WorkflowIntegration> {
    // Verify ownership
    const existing = await prisma.workflowIntegration.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Integration not found');
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

    return prisma.workflowIntegration.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete an integration
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.workflowIntegration.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Integration not found');
    }

    await prisma.workflowIntegration.delete({
      where: { id },
    });
  }

  /**
   * Update test status
   */
  async updateTestStatus(id: string, status: 'success' | 'failed'): Promise<void> {
    await prisma.workflowIntegration.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: status,
      },
    });
  }

  /**
   * Helper: Decrypt credentials from an integration
   */
  private decryptCredentials(
    integration: WorkflowIntegration
  ): IntegrationWithDecryptedCredentials {
    const { encryptedCredentials, ...rest } = integration;

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

export const integrationService = new IntegrationService();
