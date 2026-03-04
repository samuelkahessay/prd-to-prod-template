import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listPipelineIssues } from '@/lib/github/issues';
import type { PipelineIssue } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';

function extractDependencies(labels: string[]): number[] {
  const dependencies: number[] = [];
  
  for (const label of labels) {
    const match = /^depends-on-#(\d+)$/.exec(label);
    if (match?.[1]) {
      dependencies.push(Number.parseInt(match[1], 10));
    }
  }
  
  return dependencies;
}

function transformIssue(issue: {
  id: number;
  number: number;
  title: string;
  state: string;
  labels: Array<{ name?: string } | string>;
  assignee: { login: string } | null;
  created_at: string;
  updated_at: string;
}): PipelineIssue {
  const labelNames = issue.labels.map(label =>
    typeof label === 'string' ? label : label.name ?? ''
  );

  return {
    id: String(issue.id),
    number: issue.number,
    title: issue.title,
    state: issue.state === 'open' ? 'open' : 'closed',
    labels: labelNames,
    dependencies: extractDependencies(labelNames),
    assignee: issue.assignee?.login ?? null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
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
    const rawIssues = await listPipelineIssues({
      client,
      owner,
      repo,
      state: 'open',
    });

    const issues = rawIssues.map(transformIssue);

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      { issues, rateLimitRemaining: rateLimit.remaining },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error: unknown) {
    console.error('Failed to fetch pipeline issues:', error);

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
