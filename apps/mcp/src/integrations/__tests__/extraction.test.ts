/**
 * Tests for integration extraction
 */

import { describe, expect, it } from 'vitest';
import type { SensitiveDataMatch } from '../../vault/sensitive-detection.js';
import {
  createCustomIntegration,
  extractIntegrationsFromPatterns,
  generateIntegrationId,
  mergeSecretsWithIntegrations,
} from '../extraction.js';

describe('extractIntegrationsFromPatterns', () => {
  describe('database detection', () => {
    it('detects PostgreSQL from content', () => {
      const content = `
        # Database Setup
        We use PostgreSQL for our customer database.
        DATABASE_URL=postgres://user:pass@host/db
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('postgresql');
      expect(result.integrations[0].type).toBe('database');
      expect(result.integrations[0].operations).toHaveLength(2);
      expect(result.integrations[0].operations.map((op) => op.name)).toContain('query');
    });

    it('detects MongoDB from content', () => {
      const content = `
        Connect to MongoDB database for user data storage.
        Use mongoose for ODM.
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('mongodb');
      expect(result.integrations[0].type).toBe('database');
    });
  });

  describe('messaging detection', () => {
    it('detects Slack from content', () => {
      const content = `
        Notifications are sent to Slack when orders are ready.
        SLACK_BOT_TOKEN=xoxb-123456789
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('slack');
      expect(result.integrations[0].type).toBe('messaging');
      expect(result.integrations[0].authentication.method).toBe('bearer_token');
    });

    it('detects Gmail from content', () => {
      const content = `
        Use Gmail API to send customer notification emails.
        OAuth2 authentication required.
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('gmail');
      expect(result.integrations[0].authentication.method).toBe('oauth2');
    });

    it('detects SendGrid from content', () => {
      const content = 'Use SendGrid for transactional emails. SG.apikey123';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('sendgrid');
    });
  });

  describe('CRM detection', () => {
    it('detects Salesforce from content', () => {
      const content = `
        Sync customer data with Salesforce CRM.
        Use SFDC REST API for record management.
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('salesforce');
      expect(result.integrations[0].type).toBe('crm');
    });

    it('detects HubSpot from content', () => {
      const content = 'Use HubSpot for contact management and marketing.';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('hubspot');
      expect(result.integrations[0].type).toBe('crm');
    });
  });

  describe('AI service detection', () => {
    it('detects OpenAI from content', () => {
      const content = `
        Use OpenAI GPT-4 for text generation.
        OPENAI_API_KEY=sk-abc123...
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('openai');
      expect(result.integrations[0].type).toBe('ai');
    });

    it('detects Anthropic from content', () => {
      const content = 'Use Claude from Anthropic for chat completion.';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('anthropic');
      expect(result.integrations[0].type).toBe('ai');
    });
  });

  describe('payment detection', () => {
    it('detects Stripe from content', () => {
      const content = `
        Process payments with Stripe.
        STRIPE_SECRET_KEY=sk_live_123456
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('stripe');
      expect(result.integrations[0].type).toBe('payment');
    });
  });

  describe('storage detection', () => {
    it('detects AWS S3 from content', () => {
      const content = `
        Store files in Amazon S3.
        AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].id).toBe('aws-s3');
      expect(result.integrations[0].type).toBe('storage');
    });
  });

  describe('multiple integrations', () => {
    it('detects multiple integrations in same content', () => {
      const content = `
        # System Architecture
        
        - PostgreSQL for data storage
        - Gmail for notifications
        - Slack for team alerts
        - OpenAI for text generation
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations.length).toBeGreaterThanOrEqual(4);
      const ids = result.integrations.map((i) => i.id);
      expect(ids).toContain('postgresql');
      expect(ids).toContain('gmail');
      expect(ids).toContain('slack');
      expect(ids).toContain('openai');
    });

    it('does not duplicate integrations', () => {
      const content = `
        PostgreSQL database connection.
        Another PostgreSQL mention.
        Also postgres:// connection string.
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      const pgIntegrations = result.integrations.filter((i) => i.id === 'postgresql');
      expect(pgIntegrations).toHaveLength(1);
    });
  });

  describe('generic API mentions', () => {
    it('captures unknown API mentions', () => {
      const content = `
        Connect to the Acme API for inventory data.
        Use the Widget service for calculations.
      `;

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      // Should have mentions for unknown APIs
      expect(result.mentions.length).toBeGreaterThanOrEqual(1);
      const mentionNames = result.mentions.map((m) => m.name.toLowerCase());
      expect(mentionNames).toContain('acme');
    });
  });

  describe('vault references', () => {
    it('includes vault references for credentials', () => {
      const content = 'Use PostgreSQL database.';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations[0].authentication.vaultRefs).toBeDefined();
      expect(result.integrations[0].authentication.vaultRefs.database_url).toMatch(
        /^vault:\/\/env\//
      );
    });

    it('links detected secrets to integrations', () => {
      const secrets: SensitiveDataMatch[] = [
        {
          type: 'database_url',
          confidence: 'high',
          description: 'PostgreSQL connection string',
          value: 'postgres://user:pass@host/db',
          position: { start: 0, end: 10 },
          suggestedVaultPath: 'database/database-url',
          maskedValue: 'post***',
        },
      ];

      const content = 'DATABASE_URL=postgres://user:pass@host/db';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
        detectedSecrets: secrets,
      });

      // Should detect postgresql integration with vault refs
      const pg = result.integrations.find((i) => i.id === 'postgresql');
      expect(pg).toBeDefined();
      // The vault refs are set based on credential key matching
      expect(pg?.authentication.vaultRefs).toBeDefined();
    });
  });

  describe('source metadata', () => {
    it('includes source file information', () => {
      const content = 'Use PostgreSQL database.';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: '/path/to/config.md',
        project: 'my-project',
      });

      expect(result.integrations[0].source.learnedFrom).toBe('/path/to/config.md');
      expect(result.integrations[0].source.project).toBe('my-project');
      expect(result.integrations[0].source.confidence).toBe(0.7);
      expect(result.integrations[0].source.extractionMethod).toBe('pattern');
    });
  });

  describe('no matches', () => {
    it('returns empty when no integrations found', () => {
      const content = 'This is just regular text without any integrations.';

      const result = extractIntegrationsFromPatterns(content, {
        sourceFile: 'test.md',
      });

      expect(result.integrations).toHaveLength(0);
    });
  });
});

describe('mergeSecretsWithIntegrations', () => {
  it('merges detected secrets with matching integrations', () => {
    const integrations = [
      {
        id: 'openai',
        displayName: 'OpenAI',
        type: 'ai' as const,
        description: 'OpenAI integration',
        operations: [],
        authentication: {
          method: 'api_key' as const,
          requiredCredentials: ['api_key'],
          vaultRefs: { api_key: 'vault://env/openai/api_key' },
        },
        examples: [],
        notes: [],
        source: {
          learnedFrom: 'test.md',
          learnedAt: new Date().toISOString(),
          confidence: 0.7,
          extractionMethod: 'pattern' as const,
        },
        status: 'discovered' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const secrets: SensitiveDataMatch[] = [
      {
        type: 'openai_api_key',
        confidence: 'high',
        description: 'OpenAI API key',
        value: 'sk-abc123',
        position: { start: 0, end: 10 },
        suggestedVaultPath: 'openai/openai-api-key',
        maskedValue: 'sk-a***',
      },
    ];

    const merged = mergeSecretsWithIntegrations(integrations, secrets);

    // The function should preserve the integration and potentially add vault refs
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('openai');
    expect(merged[0].authentication.vaultRefs).toBeDefined();
  });
});

describe('generateIntegrationId', () => {
  it('converts name to kebab-case', () => {
    const id = generateIntegrationId('Customer Database', new Set());
    expect(id).toBe('customer-database');
  });

  it('handles special characters', () => {
    const id = generateIntegrationId('My API (v2)', new Set());
    expect(id).toBe('my-api-v2');
  });

  it('avoids duplicates', () => {
    const existingIds = new Set(['customer-database']);
    const id = generateIntegrationId('Customer Database', existingIds);
    expect(id).toBe('customer-database-2');
  });

  it('increments counter for multiple duplicates', () => {
    const existingIds = new Set(['my-api', 'my-api-2', 'my-api-3']);
    const id = generateIntegrationId('My API', existingIds);
    expect(id).toBe('my-api-4');
  });
});

describe('createCustomIntegration', () => {
  it('creates integration with minimal info', () => {
    const integration = createCustomIntegration(
      { name: 'Custom Service' },
      { sourceFile: 'test.md' }
    );

    expect(integration.id).toBe('custom-service');
    expect(integration.displayName).toBe('Custom Service');
    expect(integration.type).toBe('custom');
    expect(integration.authentication.method).toBe('api_key');
    expect(integration.source.confidence).toBe(0.5);
    expect(integration.source.extractionMethod).toBe('llm');
  });

  it('uses provided type and operations', () => {
    const integration = createCustomIntegration(
      {
        name: 'My Database',
        type: 'database',
        operations: [
          {
            name: 'query',
            description: 'Run a query',
            params: [],
            returns: { type: 'array', description: 'Results' },
          },
        ],
      },
      { sourceFile: 'test.md' }
    );

    expect(integration.type).toBe('database');
    expect(integration.operations).toHaveLength(1);
  });

  it('avoids ID conflicts', () => {
    const existingIds = new Set(['custom-service']);
    const integration = createCustomIntegration(
      { name: 'Custom Service' },
      { sourceFile: 'test.md', existingIds }
    );

    expect(integration.id).toBe('custom-service-2');
  });
});
