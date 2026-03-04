import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/issues', () => ({
  getIssue: vi.fn(),
  getIssueComments: vi.fn(),
}));

import { GET } from '@/app/api/pipeline/issue/[number]/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { getIssue, getIssueComments } from '@/lib/github/issues';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedGetIssue = vi.mocked(getIssue);
const mockedGetIssueComments = vi.mocked(getIssueComments);

describe('GET /api/pipeline/issue/[number]', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedGetIssue.mockReset();
    mockedGetIssueComments.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request(
      'http://localhost/api/pipeline/issue/42?owner=test&repo=repo'
    );

    const response = await GET(request, {
      params: Promise.resolve({ number: '42' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns 400 for invalid issue number', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const request = new Request(
      'http://localhost/api/pipeline/issue/invalid?owner=test&repo=repo'
    );

    const response = await GET(request, {
      params: Promise.resolve({ number: 'invalid' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid issue number');
  });

  it('returns issue with comments', async () => {
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

    mockedGetIssue.mockResolvedValue({
      id: 1,
      number: 42,
      title: 'Test Issue',
      state: 'open',
      labels: [{ name: 'pipeline' }, { name: 'depends-on-#10' }],
      assignee: { login: 'octocat' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    } as never);

    mockedGetIssueComments.mockResolvedValue([
      {
        id: 100,
        user: { login: 'reviewer' },
        body: 'Looks good!',
        created_at: '2024-01-03T00:00:00Z',
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/issue/42?owner=test&repo=repo'
    );

    const response = await GET(request, {
      params: Promise.resolve({ number: '42' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.issue).toMatchObject({
      id: '1',
      number: 42,
      title: 'Test Issue',
      state: 'open',
      dependencies: [10],
    });

    expect(payload.comments).toHaveLength(1);
    expect(payload.comments[0]).toMatchObject({
      id: '100',
      author: 'reviewer',
      body: 'Looks good!',
    });
  });
});
