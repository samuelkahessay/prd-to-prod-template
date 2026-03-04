import { NextResponse } from 'next/server';

import {
  cancelWorkflow,
  dispatchWorkflow,
  reRunWorkflow,
} from '@/lib/actions/workflow-dispatch';

export const dynamic = 'force-dynamic';

type WorkflowAction = 'dispatch' | 'rerun' | 'cancel';

interface WorkflowRequestBody {
  owner?: unknown;
  repo?: unknown;
  action?: unknown;
  workflowId?: unknown;
  ref?: unknown;
  inputs?: unknown;
  runId?: unknown;
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(item => typeof item === 'string');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as WorkflowRequestBody | null;

  if (!body || !isNonEmptyString(body.owner) || !isNonEmptyString(body.repo)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body. Expected owner and repo.' },
      { status: 400 }
    );
  }

  const action = body.action as WorkflowAction;

  try {
    if (action === 'dispatch') {
      if (!isNonEmptyString(body.workflowId) || !isNonEmptyString(body.ref)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Invalid request body for dispatch. Expected workflowId and ref.',
          },
          { status: 400 }
        );
      }

      if (body.inputs !== undefined && !isRecordOfStrings(body.inputs)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Invalid inputs. Expected an object with string values.',
          },
          { status: 400 }
        );
      }

      await dispatchWorkflow(
        body.owner,
        body.repo,
        body.workflowId,
        body.ref,
        body.inputs
      );
    } else if (action === 'rerun') {
      if (!isPositiveInteger(body.runId)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid request body for rerun. Expected runId.' },
          { status: 400 }
        );
      }

      await reRunWorkflow(body.owner, body.repo, body.runId);
    } else if (action === 'cancel') {
      if (!isPositiveInteger(body.runId)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid request body for cancel. Expected runId.' },
          { status: 400 }
        );
      }

      await cancelWorkflow(body.owner, body.repo, body.runId);
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid action. Expected dispatch, rerun, or cancel.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      invalidateKeys: [
        ['pipeline', 'workflows', body.owner, body.repo],
        ['pipeline', 'activity', body.owner, body.repo],
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Workflow action failed';

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
