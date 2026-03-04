import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Octokit } from '@octokit/rest';

import {
  getDeploymentStatuses,
  listDeployments,
} from '@/lib/github/deployments';

describe('lib/github/deployments', () => {
  let mockClient: { rest: { repos: Record<string, unknown> } };

  beforeEach(() => {
    mockClient = {
      rest: {
        repos: {
          listDeployments: vi.fn(),
          listDeploymentStatuses: vi.fn(),
        },
      },
    };
  });

  describe('listDeployments', () => {
    it('calls GitHub API with correct params', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            environment: 'production',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      vi.mocked(mockClient.rest.repos.listDeployments).mockResolvedValue(
        mockResponse as never
      );

      const result = await listDeployments({
        client: mockClient as unknown as Octokit,
        owner: 'test',
        repo: 'repo',
        environment: 'production',
        perPage: 10,
        page: 1,
      });

      expect(mockClient.rest.repos.listDeployments).toHaveBeenCalledWith({
        owner: 'test',
        repo: 'repo',
        environment: 'production',
        per_page: 10,
        page: 1,
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getDeploymentStatuses', () => {
    it('calls GitHub API with correct params', async () => {
      const mockResponse = {
        data: [
          {
            id: 100,
            state: 'success',
            environment_url: 'https://example.com',
          },
        ],
      };

      vi.mocked(mockClient.rest.repos.listDeploymentStatuses).mockResolvedValue(
        mockResponse as never
      );

      const result = await getDeploymentStatuses({
        client: mockClient as unknown as Octokit,
        owner: 'test',
        repo: 'repo',
        deploymentId: 1,
        perPage: 5,
        page: 1,
      });

      expect(mockClient.rest.repos.listDeploymentStatuses).toHaveBeenCalledWith({
        owner: 'test',
        repo: 'repo',
        deployment_id: 1,
        per_page: 5,
        page: 1,
      });

      expect(result).toEqual(mockResponse.data);
    });
  });
});
