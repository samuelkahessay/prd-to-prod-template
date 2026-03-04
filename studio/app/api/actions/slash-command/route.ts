import { NextResponse } from 'next/server';

import {
  postSlashCommand,
  type SlashCommand,
} from '@/lib/actions/slash-commands';

export const dynamic = 'force-dynamic';

interface SlashCommandRequestBody {
  owner?: unknown;
  repo?: unknown;
  issueNumber?: unknown;
  command?: unknown;
}

function isValidBody(body: SlashCommandRequestBody): body is {
  owner: string;
  repo: string;
  issueNumber: number;
  command: SlashCommand;
} {
  return (
    typeof body.owner === 'string' &&
    body.owner.trim().length > 0 &&
    typeof body.repo === 'string' &&
    body.repo.trim().length > 0 &&
    typeof body.issueNumber === 'number' &&
    Number.isInteger(body.issueNumber) &&
    body.issueNumber > 0 &&
    typeof body.command === 'string'
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | SlashCommandRequestBody
    | null;

  if (!body || !isValidBody(body)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Invalid request body. Expected owner, repo, issueNumber, and command.',
      },
      { status: 400 }
    );
  }

  try {
    await postSlashCommand(body.owner, body.repo, body.issueNumber, body.command);

    return NextResponse.json({
      ok: true,
      action: 'slash-command',
      command: body.command,
      invalidateKeys: [
        ['pipeline', 'issues', body.owner, body.repo],
        ['pipeline', 'activity', body.owner, body.repo],
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to post slash command';

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
