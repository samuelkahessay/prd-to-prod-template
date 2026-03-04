import { NextResponse } from 'next/server';

import {
  approvePR,
  closePR,
  mergePR,
  requestChangesPR,
  type MergeMethod,
} from '@/lib/actions/pr-actions';

export const dynamic = 'force-dynamic';

type PRAction = 'approve' | 'reject' | 'merge' | 'close';

interface PRRequestBody {
  owner?: unknown;
  repo?: unknown;
  action?: unknown;
  prNumber?: unknown;
  reason?: unknown;
  method?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isMergeMethod(value: unknown): value is MergeMethod {
  return value === 'merge' || value === 'squash' || value === 'rebase';
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PRRequestBody | null;

  if (
    !body ||
    !isNonEmptyString(body.owner) ||
    !isNonEmptyString(body.repo) ||
    !isPositiveInteger(body.prNumber)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid request body. Expected owner, repo, and prNumber.',
      },
      { status: 400 }
    );
  }

  const action = body.action as PRAction;

  try {
    if (action === 'approve') {
      await approvePR(body.owner, body.repo, body.prNumber);
    } else if (action === 'reject') {
      if (!isNonEmptyString(body.reason)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Invalid reject payload. A reason is required.',
          },
          { status: 400 }
        );
      }

      await requestChangesPR(body.owner, body.repo, body.prNumber, body.reason);
    } else if (action === 'merge') {
      if (!isMergeMethod(body.method)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Invalid merge payload. Method must be merge, squash, or rebase.',
          },
          { status: 400 }
        );
      }

      await mergePR(body.owner, body.repo, body.prNumber, body.method);
    } else if (action === 'close') {
      await closePR(body.owner, body.repo, body.prNumber);
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid action. Expected approve, reject, merge, or close.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      invalidateKeys: [
        ['pipeline', 'pulls', body.owner, body.repo],
        ['pipeline', 'issues', body.owner, body.repo],
        ['pipeline', 'activity', body.owner, body.repo],
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PR action failed';

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
