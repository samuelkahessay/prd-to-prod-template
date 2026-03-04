import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/workflows', () => ({
  listWorkflowRuns: vi.fn(),
}));

import { GET } from '@/app/api/pipeline/workflows/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listWorkflowRuns } from '@/lib/github/workflows';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedListWorkflowRuns = vi.mocked(listWorkflowRuns);

describe('GET /api/pipeline/workflows', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedListWorkflowRuns.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request(
      'http://localhost/api/pipeline/workflows?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns transformed workflow runs', async () => {
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

    mockedListWorkflowRuns.mockResolvedValue({
      workflow_runs: [
        {
          id: 200,
          name: 'CI Build',
          status: 'completed',
          conclusion: 'success',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:05:00Z',
          html_url: 'https://github.com/test/repo/actions/runs/200',
        },
        {
          id: 201,
          name: 'Deploy',
          status: 'in_progress',
          conclusion: null,
          created_at: '2024-01-01T00:10:00Z',
          updated_at: '2024-01-01T00:12:00Z',
          html_url: 'https://github.com/test/repo/actions/runs/201',
        },
      ],
    } as never);

    const request = new Request(
      'http://localhost/api/pipeline/workflows?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.workflows).toHaveLength(2);

    expect(payload.workflows[0]).toMatchObject({
      id: '200',
      name: 'CI Build',
      status: 'completed',
      conclusion: 'success',
      started_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-01T00:05:00Z',
    });

    expect(payload.workflows[1]).toMatchObject({
      id: '201',
      name: 'Deploy',
      status: 'in_progress',
      conclusion: null,
      started_at: '2024-01-01T00:10:00Z',
      completed_at: null,
    });
  });
});
