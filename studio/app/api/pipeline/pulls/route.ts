import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listPipelinePRs } from '@/lib/github/pulls';
import type { PipelinePR } from '@/lib/pipeline/types';

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

function transformPR(pr: {
  id: number;
  number: number;
  title: string;
  state: string;
  merged_at: string | null;
  body: string | null;
  mergeable?: boolean | null;
  auto_merge: unknown;
}): PipelinePR {
  const state = pr.merged_at ? 'merged' : pr.state === 'open' ? 'open' : 'closed';

  return {
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    state,
    linked_issue: extractLinkedIssue(pr.body),
    reviews: [],
    checks: [],
    mergeable: pr.mergeable ?? false,
    auto_merge: pr.auto_merge !== null,
  };
}

export async function GET(request: Request) {
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

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required query params: owner, repo' },
      { status: 400 }
    );
  }

  try {
    const client = createGitHubClient(authResult.token);
    const rawPRs = await listPipelinePRs({
      client,
      owner,
      repo,
      state: 'open',
    });

    const prs = rawPRs.map(transformPR);

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      { pull_requests: prs, rateLimitRemaining: rateLimit.remaining },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error: unknown) {
    console.error('Failed to fetch pipeline PRs:', error);

    // Check Octokit error status
    const status = (error as { status?: number })?.status;
    if (status === 404) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    if (status === 403) {
      return NextResponse.json(
        { error: 'Access forbidden - check token permissions' },
        { status: 403 }
      );
    }

    if (status === 400) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
