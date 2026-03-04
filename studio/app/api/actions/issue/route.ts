import { NextResponse } from 'next/server';

import {
  addLabel,
  closeIssue,
  removeLabel,
} from '@/lib/actions/issue-actions';

export const dynamic = 'force-dynamic';

type IssueAction = 'close' | 'label' | 'unlabel';

interface IssueRequestBody {
  owner?: unknown;
  repo?: unknown;
  action?: unknown;
  issueNumber?: unknown;
  label?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as IssueRequestBody | null;

  if (
    !body ||
    !isNonEmptyString(body.owner) ||
    !isNonEmptyString(body.repo) ||
    !isPositiveInteger(body.issueNumber)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid request body. Expected owner, repo, and issueNumber.',
      },
      { status: 400 }
    );
  }

  const action = body.action as IssueAction;

  try {
    if (action === 'close') {
      await closeIssue(body.owner, body.repo, body.issueNumber);
    } else if (action === 'label') {
      if (!isNonEmptyString(body.label)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid label payload. label is required.' },
          { status: 400 }
        );
      }

      await addLabel(body.owner, body.repo, body.issueNumber, body.label);
    } else if (action === 'unlabel') {
      if (!isNonEmptyString(body.label)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid unlabel payload. label is required.' },
          { status: 400 }
        );
      }

      await removeLabel(body.owner, body.repo, body.issueNumber, body.label);
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid action. Expected close, label, or unlabel.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      invalidateKeys: [
        ['pipeline', 'issues', body.owner, body.repo],
        ['pipeline', 'activity', body.owner, body.repo],
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Issue action failed';

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
