import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/pulls', () => ({
  getPR: vi.fn(),
  getPRReviews: vi.fn(),
}));

import { GET } from '@/app/api/pipeline/pull/[number]/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { getPR, getPRReviews } from '@/lib/github/pulls';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedGetPR = vi.mocked(getPR);
const mockedGetPRReviews = vi.mocked(getPRReviews);

describe('GET /api/pipeline/pull/[number]', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedGetPR.mockReset();
    mockedGetPRReviews.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request(
      'http://localhost/api/pipeline/pull/5?owner=test&repo=repo'
    );

    const response = await GET(request, {
      params: Promise.resolve({ number: '5' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns 400 for invalid PR number', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const request = new Request(
      'http://localhost/api/pipeline/pull/invalid?owner=test&repo=repo'
    );

    const response = await GET(request, {
      params: Promise.resolve({ number: 'invalid' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid PR number');
  });

  it('returns PR with reviews', async () => {
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

    mockedGetPR.mockResolvedValue({
      id: 100,
      number: 5,
      title: 'Fix bug',
      state: 'open',
      merged_at: null,
      body: 'Closes #42',
      mergeable: true,
      auto_merge: null,
    } as never);

    mockedGetPRReviews.mockResolvedValue([
      {
        user: { login: 'reviewer' },
        state: 'APPROVED',
        submitted_at: '2024-01-03T00:00:00Z',
      },
    ] as never);

    const request = new Request(
      'http://localhost/api/pipeline/pull/5?owner=test&repo=repo'
    );

    const response = await GET(request, {
      params: Promise.resolve({ number: '5' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.pull_request).toMatchObject({
      id: '100',
      number: 5,
      title: 'Fix bug',
      state: 'open',
      linked_issue: 42,
      mergeable: true,
    });

    expect(payload.pull_request.reviews).toHaveLength(1);
    expect(payload.pull_request.reviews[0]).toMatchObject({
      reviewer: 'reviewer',
      state: 'APPROVED',
      submitted_at: '2024-01-03T00:00:00Z',
    });
  });
});
