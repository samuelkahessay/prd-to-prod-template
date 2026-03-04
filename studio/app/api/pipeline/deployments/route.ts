import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import {
  getDeploymentStatuses,
  listDeployments,
} from '@/lib/github/deployments';
import type { PipelineDeployment } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';

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
    const rawDeployments = await listDeployments({
      client,
      owner,
      repo,
      perPage: 20,
    });

    const deployments = await Promise.all(
      rawDeployments.map(deployment =>
        transformDeployment(deployment, client, owner, repo)
      )
    );

    const rateLimitResponse = await client.rest.rateLimit.get();
    const rateLimit = rateLimitResponse.data.rate;

    return NextResponse.json(
      { deployments },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments from GitHub' },
      { status: 500 }
    );
  }
}
