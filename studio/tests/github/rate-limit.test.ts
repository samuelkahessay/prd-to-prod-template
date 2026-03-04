import { describe, expect, it, vi } from 'vitest';

import { getRateLimit, parseRateLimitHeaders } from '@/lib/github/rate-limit';

vi.mock('@octokit/rest', () => ({}));

function createMockClient() {
  return {
    rest: {
      rateLimit: {
        get: vi.fn(),
      },
    },
  };
}

describe('github rate-limit module', () => {
  it('gets the API rate limit payload', async () => {
    const client = createMockClient();
    client.rest.rateLimit.get.mockResolvedValue({ data: { resources: { core: { remaining: 4999 } } } });

    const result = await getRateLimit({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
    });

    expect(client.rest.rateLimit.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ resources: { core: { remaining: 4999 } } });
  });

  it('parses rate limit headers', () => {
    const result = parseRateLimitHeaders({
      'x-ratelimit-remaining': '4998',
      'x-ratelimit-reset': '1735690000',
    });

    expect(result).toEqual({
      remaining: 4998,
      reset: 1735690000,
    });
  });

  it('returns null values when headers are missing or invalid', () => {
    const result = parseRateLimitHeaders({
      'X-RateLimit-Remaining': 'oops',
    });

    expect(result).toEqual({
      remaining: null,
      reset: null,
    });
  });
});
