/**
 * GitHub Connector Tests
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubConnector } from '../github.connector.js';

describe('GitHubConnector', () => {
  let connector: GitHubConnector;

  beforeEach(() => {
    connector = new GitHubConnector();
    // Reset fetch mock
    vi.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should successfully connect with valid token', async () => {
      // Mock successful GitHub API response
      const mockUser = {
        login: 'testuser',
        name: 'Test User',
        id: 12345,
        type: 'User',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUser,
      } as Response);

      const result = await connector.testConnection(
        { baseUrl: 'https://api.github.com' },
        { token: 'test-token' }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('testuser');
      expect(result.details).toEqual({
        username: 'testuser',
        name: 'Test User',
        id: 12345,
        type: 'User',
      });
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should fail when token is missing', async () => {
      const result = await connector.testConnection({ baseUrl: 'https://api.github.com' }, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('GitHub token is required');
    });

    it('should fail with invalid token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Bad credentials',
      } as Response);

      const result = await connector.testConnection(
        { baseUrl: 'https://api.github.com' },
        { token: 'invalid-token' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await connector.testConnection(
        { baseUrl: 'https://api.github.com' },
        { token: 'test-token' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should use custom base URL for GitHub Enterprise', async () => {
      const mockUser = {
        login: 'enterpriseuser',
        name: 'Enterprise User',
        id: 67890,
        type: 'User',
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUser,
      } as Response);

      global.fetch = fetchSpy;

      await connector.testConnection(
        { baseUrl: 'https://github.company.com/api' },
        { token: 'test-token' }
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://github.company.com/api/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should include correct headers', async () => {
      const mockUser = { login: 'testuser', name: 'Test', id: 1, type: 'User' };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      } as Response);

      global.fetch = fetchSpy;

      await connector.testConnection(
        { baseUrl: 'https://api.github.com' },
        { token: 'test-token' }
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-token',
            'User-Agent': 'Kahuna-CLI',
            Accept: 'application/vnd.github+json',
          },
        })
      );
    });

    it('should measure response time accurately', async () => {
      const mockUser = { login: 'testuser', name: 'Test', id: 1, type: 'User' };

      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            // Simulate 100ms delay
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => mockUser,
              } as Response);
            }, 100);
          })
      );

      const result = await connector.testConnection(
        { baseUrl: 'https://api.github.com' },
        { token: 'test-token' }
      );

      expect(result.responseTime).toBeGreaterThanOrEqual(100);
      expect(result.responseTime).toBeLessThan(200);
    });
  });
});
