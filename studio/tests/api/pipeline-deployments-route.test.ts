import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/deployments', () => ({
  listDeployments: vi.fn(),
  getDeploymentStatuses: vi.fn(),
}));

import { GET } from '@/app/api/pipeline/deployments/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import {
  getDeploymentStatuses,
  listDeployments,
} from '@/lib/github/deployments';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedListDeployments = vi.mocked(listDeployments);
const mockedGetDeploymentStatuses = vi.mocked(getDeploymentStatuses);

describe('GET /api/pipeline/deployments', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedListDeployments.mockReset();
    mockedGetDeploymentStatuses.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request(
      'http://localhost/api/pipeline/deployments?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns transformed deployments with statuses', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const mockClient = {
      rest: {
        rateLimit: {
          get: vi.fn().mockResolvedValue({
            data: {
              rate: {
                limit: 5000,
                remaining: 4999,
                reset: 1234567890,
              },
            },
          }),
        },
      },
    };

    mockedCreateOctokit.mockReturnValue(mockClient as never);

    mockedListDeployments.mockResolvedValue([
      {
        id: 300,
        environment: 'production',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      },
    ] as never);

    mockedGetDeploymentStatuses.mockResolvedValue([
      {
        state: 'success',
        environment_url: 'https://example.com',
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/deployments?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.deployments).toHaveLength(1);
    expect(payload.deployments[0]).toMatchObject({
      id: '300',
      environment: 'production',
      status: 'success',
      url: 'https://example.com',
    });
  });

  it('maps deployment status states correctly', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const mockClient = {
      rest: {
        rateLimit: {
          get: vi.fn().mockResolvedValue({
            data: {
              rate: {
                limit: 5000,
                remaining: 4999,
                reset: 1234567890,
              },
            },
          }),
        },
      },
    };

    mockedCreateOctokit.mockReturnValue(mockClient as never);

    mockedListDeployments.mockResolvedValue([
      {
        id: 301,
        environment: 'staging',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      },
    ] as never);

    mockedGetDeploymentStatuses.mockResolvedValue([
      {
        state: 'failure',
        environment_url: '',
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/deployments?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(payload.deployments[0].status).toBe('failure');
  });
});
