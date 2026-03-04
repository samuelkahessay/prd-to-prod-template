import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import {
  getDeploymentStatuses,
  listDeployments,
} from '@/lib/github/deployments';
import { listPipelineIssues } from '@/lib/github/issues';
import { listPipelinePRs } from '@/lib/github/pulls';
import { listWorkflowRuns } from '@/lib/github/workflows';
import type {
  PipelineDeployment,
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
} from '@/lib/pipeline/types';

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

async function transformDeployment(
  deployment: {
    id: number;
    environment: string;
    created_at: string;
    updated_at: string;
  },
  client: ReturnType<typeof createGitHubClient>,
  owner: string,
  repo: string
): Promise<PipelineDeployment> {
  const statuses = await getDeploymentStatuses({
    client,
    owner,
    repo,
    deploymentId: deployment.id,
    perPage: 1,
  });

  const latestStatus = statuses[0];

  const status =
    latestStatus?.state === 'success'
      ? 'success'
      : latestStatus?.state === 'failure' || latestStatus?.state === 'error'
        ? 'failure'
        : latestStatus?.state === 'in_progress'
          ? 'in_progress'
          : 'pending';

  return {
    id: String(deployment.id),
    environment: deployment.environment,
    status,
    url: latestStatus?.environment_url ?? '',
    created_at: deployment.created_at,
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

    const [rawIssues, rawPRs, workflowResult, rawDeployments] =
      await Promise.all([
        listPipelineIssues({
          client,
          owner,
          repo,
          state: 'open',
        }),
        listPipelinePRs({
          client,
          owner,
          repo,
          state: 'open',
        }),
        listWorkflowRuns({
          client,
          owner,
          repo,
          perPage: 20,
        }),
        listDeployments({
          client,
          owner,
          repo,
          perPage: 10,
        }),
      ]);

    const issues = rawIssues.map(transformIssue);
    const pull_requests = rawPRs.map(transformPR);
    const workflows = workflowResult.workflow_runs.map(transformWorkflowRun);
    const deployments = await Promise.all(
      rawDeployments.map(deployment =>
        transformDeployment(deployment, client, owner, repo)
      )
    );

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      {
        issues,
        pull_requests,
        workflows,
        deployments,
        rateLimitRemaining: rateLimit.remaining,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error: unknown) {
    console.error('Failed to fetch pipeline overview:', error);

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
