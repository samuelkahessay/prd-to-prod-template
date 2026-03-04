import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { getPR, getPRReviews } from '@/lib/github/pulls';
import type { PipelinePR, ReviewStatus } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';

function extractLinkedIssue(body: string | null): number | null {
  if (!body) {
    return null;
  }

  const closesPattern = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
  const matches = [...body.matchAll(closesPattern)];

  if (matches.length > 0 && matches[0]?.[1]) {
    return Number.parseInt(matches[0][1], 10);
  }

  return null;
}

function transformReview(review: {
  user: { login: string } | null;
  state: string;
  submitted_at?: string | null;
}): ReviewStatus {
  const state =
    review.state === 'APPROVED' ||
    review.state === 'CHANGES_REQUESTED' ||
    review.state === 'COMMENTED'
      ? review.state
      : 'PENDING';

  return {
    reviewer: review.user?.login ?? 'unknown',
    state,
    submitted_at: review.submitted_at ?? null,
  };
}

function transformPR(
  pr: {
    id: number;
    number: number;
    title: string;
    state: string;
    merged_at: string | null;
    body: string | null;
    mergeable: boolean | null;
    auto_merge: unknown;
  },
  reviews: ReviewStatus[]
): PipelinePR {
  const state = pr.merged_at ? 'merged' : pr.state === 'open' ? 'open' : 'closed';

  return {
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    state,
    linked_issue: extractLinkedIssue(pr.body),
    reviews,
    checks: [],
    mergeable: pr.mergeable ?? false,
    auto_merge: pr.auto_merge !== null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const authResult = resolveAuthToken();

  if (!authResult) {
    return NextResponse.json(
      { error: 'No GitHub authentication token found' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const { number } = await params;
  const pullNumber = Number.parseInt(number, 10);

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required query params: owner, repo' },
      { status: 400 }
    );
  }

  if (Number.isNaN(pullNumber)) {
    return NextResponse.json({ error: 'Invalid PR number' }, { status: 400 });
  }

  try {
    const client = createGitHubClient(authResult.token);
    
    const rawPR = await getPR({
      client,
      owner,
      repo,
      pullNumber,
    });

    const rawReviews = await getPRReviews({
      client,
      owner,
      repo,
      pullNumber,
    });

    const reviews = rawReviews.map(transformReview);
    const pr = transformPR(rawPR, reviews);

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      { pull_request: pr },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch PR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR from GitHub' },
      { status: 500 }
    );
  }
}
