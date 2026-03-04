import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/issues', () => ({
  listPipelineIssues: vi.fn(),
}));

import { GET } from '@/app/api/pipeline/issues/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listPipelineIssues } from '@/lib/github/issues';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedListPipelineIssues = vi.mocked(listPipelineIssues);

describe('GET /api/pipeline/issues', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedListPipelineIssues.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request(
      'http://localhost/api/pipeline/issues?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns 400 when owner or repo is missing', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const request = new Request('http://localhost/api/pipeline/issues?owner=test');

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('owner, repo');
  });

  it('returns transformed pipeline issues with rate limits', async () => {
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

    mockedListPipelineIssues.mockResolvedValue([
      {
        id: 1,
        number: 42,
        title: 'Test Issue',
        state: 'open',
        labels: [{ name: 'pipeline' }, { name: 'depends-on-#10' }],
        assignee: { login: 'octocat' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/issues?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.issues).toHaveLength(1);
    expect(payload.issues[0]).toMatchObject({
      id: '1',
      number: 42,
      title: 'Test Issue',
      state: 'open',
      labels: ['pipeline', 'depends-on-#10'],
      dependencies: [10],
      assignee: 'octocat',
    });

    expect(response.headers.get('X-RateLimit-Limit')).toBe('5000');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4999');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1234567890');
  });

  it('handles GitHub API errors gracefully', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    mockedCreateOctokit.mockReturnValue({} as never);
    mockedListPipelineIssues.mockRejectedValue(new Error('GitHub API error'));

    const request = new Request(
      'http://localhost/api/pipeline/issues?owner=test&repo=repo'
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toContain('Internal server error');
  });
});
