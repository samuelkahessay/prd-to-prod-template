import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';

export const dynamic = 'force-dynamic';

const REQUIRED_WORKFLOW_FILES = [
  'prd-decomposer.lock.yml',
  'repo-assist.lock.yml',
  'review.lock.yml',
];

interface ValidateRepoBody {
  owner?: unknown;
  repo?: unknown;
}

export async function POST(request: Request) {
  const authResult = resolveAuthToken();

  if (!authResult) {
    return NextResponse.json(
      { error: 'No GitHub authentication token found' },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as ValidateRepoBody | null;
  const owner = typeof body?.owner === 'string' ? body.owner.trim() : '';
  const repo = typeof body?.repo === 'string' ? body.repo.trim() : '';

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required fields: owner, repo' },
      { status: 400 }
    );
  }

  try {
    const client = createGitHubClient(authResult.token);

    const workflowChecks = await Promise.allSettled(
      REQUIRED_WORKFLOW_FILES.map(async file => {
        const response = await client.rest.repos.getContent({
          owner,
          repo,
          path: `.github/workflows/${file}`,
        });

        return {
          file,
          exists: response.status === 200,
        };
      })
    );

    const missingWorkflows = workflowChecks
      .map((result, index) => {
        if (result.status === 'rejected') {
          return REQUIRED_WORKFLOW_FILES[index];
        }
        return null;
      })
      .filter((file): file is string => file !== null);

    const isPipelineRepo = missingWorkflows.length === 0;

    return NextResponse.json({
      valid: isPipelineRepo,
      owner,
      repo,
      missing_workflows: missingWorkflows,
      message: isPipelineRepo
        ? 'This is a valid prd-to-prod pipeline repository.'
        : `Missing required workflow files: ${missingWorkflows.join(', ')}`,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Not Found')) {
      return NextResponse.json(
        {
          valid: false,
          owner,
          repo,
          message: 'Repository not found or not accessible.',
        },
        { status: 404 }
      );
    }

    console.error('Failed to validate repository:', error);
    return NextResponse.json(
      { error: 'Failed to validate repository' },
      { status: 500 }
    );
  }
}
