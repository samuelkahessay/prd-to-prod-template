import { NextResponse } from 'next/server';

export interface RateLimitHeaders {
  remaining: number;
  limit: number;
  reset: number;
}

/**
 * Extracts rate limit headers from a standard Response object.
 * 
 * @param response - Fetch API Response object
 * @returns Rate limit headers or null if not present
 */
export function extractRateLimitHeaders(response: Response): RateLimitHeaders | null {
  const remaining = response.headers.get('x-ratelimit-remaining') 
    ?? response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('x-ratelimit-limit') 
    ?? response.headers.get('X-RateLimit-Limit');
  const reset = response.headers.get('x-ratelimit-reset') 
    ?? response.headers.get('X-RateLimit-Reset');

  if (!remaining || !limit || !reset) {
    return null;
  }

  return {
    remaining: Number.parseInt(remaining, 10),
    limit: Number.parseInt(limit, 10),
    reset: Number.parseInt(reset, 10),
  };
}

/**
 * Injects rate limit headers into a NextResponse object.
 * 
 * @param nextResponse - NextResponse object to inject headers into
 * @param rateLimitHeaders - Rate limit data to inject
 */
export function injectRateLimitHeaders(
  nextResponse: NextResponse,
  rateLimitHeaders: RateLimitHeaders
): void {
  nextResponse.headers.set('X-RateLimit-Limit', String(rateLimitHeaders.limit));
  nextResponse.headers.set('X-RateLimit-Remaining', String(rateLimitHeaders.remaining));
  nextResponse.headers.set('X-RateLimit-Reset', String(rateLimitHeaders.reset));
}
