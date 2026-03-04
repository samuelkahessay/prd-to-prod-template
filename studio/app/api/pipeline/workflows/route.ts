import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listWorkflowRuns } from '@/lib/github/workflows';
import type { PipelineWorkflowRun } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';

function transformWorkflowRun(run: {
  id: number;
  name?: string | null;
  status: string | null;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}): PipelineWorkflowRun {
  const status =
    run.status === 'queued' || run.status === 'in_progress'
      ? run.status
      : 'completed';

  const conclusion =
    run.conclusion === 'success' ||
    run.conclusion === 'failure' ||
    run.conclusion === 'neutral' ||
    run.conclusion === 'cancelled' ||
    run.conclusion === 'skipped'
      ? run.conclusion
      : null;

  return {
    id: String(run.id),
    name: run.name ?? 'Unknown Workflow',
    status,
    conclusion,
    started_at: run.created_at,
    completed_at: status === 'completed' ? run.updated_at : null,
    url: run.html_url,
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
    const result = await listWorkflowRuns({
      client,
      owner,
      repo,
      perPage: 20,
    });

    const workflows = result.workflow_runs.map(transformWorkflowRun);

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      { workflows },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch workflow runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs from GitHub' },
      { status: 500 }
    );
  }
}
