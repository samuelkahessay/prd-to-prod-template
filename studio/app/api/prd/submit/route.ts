import { NextResponse } from 'next/server';

import { getAuthenticatedClient } from '@/lib/auth/server';
import { postComment } from '@/lib/github/comments';
import { writeFile } from '@/lib/github/contents';

export const dynamic = 'force-dynamic';

type SubmitStep = 'commitFile' | 'createIssue' | 'triggerDecompose';

interface SubmitRequestBody {
  owner?: unknown;
  repo?: unknown;
  title?: unknown;
  content?: unknown;
  issueNumber?: unknown;
  step?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function normalizeIssueTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed.startsWith('PRD:') ? trimmed : `PRD: ${trimmed}`;
}

async function runCommitFileStep(
  owner: string,
  repo: string,
  title: string,
  content: string
): Promise<{ path: string }> {
  const client = getAuthenticatedClient();
  const path = `docs/prd/${slugify(title)}.md`;

  await writeFile({
    client,
    owner,
    repo,
    path,
    message: `docs: add PRD - ${slugify(title)}.md`,
    content,
  });

  return { path };
}

async function runCreateIssueStep(
  owner: string,
  repo: string,
  title: string,
  content: string
): Promise<{ number: number; url: string }> {
  const client = getAuthenticatedClient();
  const response = await client.rest.issues.create({
    owner,
    repo,
    title: normalizeIssueTitle(title),
    body: content,
    labels: ['pipeline'],
  });

  return {
    number: response.data.number,
    url: response.data.html_url,
  };
}

async function runTriggerDecomposeStep(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  const client = getAuthenticatedClient();
  await postComment({
    client,
    owner,
    repo,
    issueNumber,
    body: '/decompose',
  });
}

function isStep(value: unknown): value is SubmitStep {
  return (
    value === 'commitFile' ||
    value === 'createIssue' ||
    value === 'triggerDecompose'
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SubmitRequestBody | null;

  if (!body || !isNonEmptyString(body.owner) || !isNonEmptyString(body.repo)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body. Expected owner and repo.',
      },
      { status: 400 }
    );
  }

  const owner = body.owner.trim();
  const repo = body.repo.trim();
  const step = isStep(body.step) ? body.step : null;

  if (step === 'triggerDecompose') {
    if (!isPositiveInteger(body.issueNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. issueNumber must be a positive integer.',
          step: 'triggerDecompose',
        },
        { status: 400 }
      );
    }

    try {
      await runTriggerDecomposeStep(owner, repo, body.issueNumber);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to trigger /decompose',
          step: 'triggerDecompose',
        },
        { status: 500 }
      );
    }
  }

  if (!isNonEmptyString(body.title) || !isNonEmptyString(body.content)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body. Expected title and content.',
      },
      { status: 400 }
    );
  }

  const title = body.title.trim();
  const content = body.content;

  if (step === 'commitFile') {
    try {
      const result = await runCommitFileStep(owner, repo, title, content);
      return NextResponse.json({ success: true, path: result.path });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to commit PRD file',
          step: 'commitFile',
        },
        { status: 500 }
      );
    }
  }

  if (step === 'createIssue') {
    try {
      const issue = await runCreateIssueStep(owner, repo, title, content);
      return NextResponse.json({
        success: true,
        issueNumber: issue.number,
        issueUrl: issue.url,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create issue',
          step: 'createIssue',
        },
        { status: 500 }
      );
    }
  }

  let issue: { number: number; url: string } | null = null;

  try {
    await runCommitFileStep(owner, repo, title, content);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to commit PRD file',
        step: 'commitFile',
      },
      { status: 500 }
    );
  }

  try {
    issue = await runCreateIssueStep(owner, repo, title, content);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create issue',
        step: 'createIssue',
      },
      { status: 500 }
    );
  }

  try {
    await runTriggerDecomposeStep(owner, repo, issue.number);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger /decompose',
        step: 'triggerDecompose',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    issueNumber: issue.number,
    issueUrl: issue.url,
  });
}
