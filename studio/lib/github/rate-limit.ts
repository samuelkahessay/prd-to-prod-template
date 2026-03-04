import type { Octokit } from '@octokit/rest';

export interface GetRateLimitParams {
  client: Octokit;
  owner: string;
  repo: string;
}

export type GetRateLimitResult = Awaited<
  ReturnType<Octokit['rest']['rateLimit']['get']>
>['data'];

export async function getRateLimit(
  params: GetRateLimitParams
): Promise<GetRateLimitResult> {
  void params.owner;
  void params.repo;

  const response = await params.client.rest.rateLimit.get();
  return response.data;
}

export interface RateLimitHeaders {
  remaining: number | null;
  reset: number | null;
}

export function parseRateLimitHeaders(
  headers: Record<string, number | string | string[] | undefined>
): RateLimitHeaders {
  const remainingHeader = headers['x-ratelimit-remaining'] ?? headers['X-RateLimit-Remaining'];
  const resetHeader = headers['x-ratelimit-reset'] ?? headers['X-RateLimit-Reset'];

  const remaining = parseHeaderNumber(remainingHeader);
  const reset = parseHeaderNumber(resetHeader);

  return { remaining, reset };
}

function parseHeaderNumber(value: number | string | string[] | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(rawValue), 10);

  return Number.isNaN(parsed) ? null : parsed;
}
