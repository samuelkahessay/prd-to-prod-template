import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { getIssue, getIssueComments } from '@/lib/github/issues';
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
  const issueNumber = Number.parseInt(number, 10);

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required query params: owner, repo' },
      { status: 400 }
    );
  }

  if (Number.isNaN(issueNumber)) {
    return NextResponse.json({ error: 'Invalid issue number' }, { status: 400 });
  }

  try {
    const client = createGitHubClient(authResult.token);
    
    const rawIssue = await getIssue({
      client,
      owner,
      repo,
      issueNumber,
    });

    const rawComments = await getIssueComments({
      client,
      owner,
      repo,
      issueNumber,
    });

    const issue = transformIssue(rawIssue);
    const comments = rawComments.map(comment => ({
      id: String(comment.id),
      author: comment.user?.login ?? 'unknown',
      body: comment.body ?? '',
      created_at: comment.created_at,
    }));

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      { issue, comments },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch issue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue from GitHub' },
      { status: 500 }
    );
  }
}
