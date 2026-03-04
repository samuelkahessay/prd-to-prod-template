import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/pulls', () => ({
  listPipelinePRs: vi.fn(),
}));

import { GET } from '@/app/api/pipeline/pulls/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listPipelinePRs } from '@/lib/github/pulls';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedListPipelinePRs = vi.mocked(listPipelinePRs);

describe('GET /api/pipeline/pulls', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedListPipelinePRs.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request(
      'http://localhost/api/pipeline/pulls?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns transformed pipeline PRs with linked issues', async () => {
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

    mockedListPipelinePRs.mockResolvedValue([
      {
        id: 100,
        number: 5,
        title: 'Fix bug in feature',
        state: 'open',
        merged_at: null,
        body: 'This PR closes #42',
        mergeable: true,
        auto_merge: null,
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/pulls?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.pull_requests).toHaveLength(1);
    expect(payload.pull_requests[0]).toMatchObject({
      id: '100',
      number: 5,
      title: 'Fix bug in feature',
      state: 'open',
      linked_issue: 42,
      mergeable: true,
      auto_merge: false,
    });
  });

  it('detects merged state from merged_at field', async () => {
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

    mockedListPipelinePRs.mockResolvedValue([
      {
        id: 101,
        number: 6,
        title: 'Merged PR',
        state: 'closed',
        merged_at: '2024-01-01T00:00:00Z',
        body: 'Closes #10',
        mergeable: false,
        auto_merge: { enabled_by: { login: 'bot' } },
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/pulls?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(payload.pull_requests[0].state).toBe('merged');
    expect(payload.pull_requests[0].auto_merge).toBe(true);
  });
});
