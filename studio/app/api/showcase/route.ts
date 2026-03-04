import { NextResponse } from 'next/server';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listDirectory, readFile } from '@/lib/github/contents';
import type { ShowcaseEntry } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';

function parseReadmeContent(content: string): Partial<ShowcaseEntry> {
  const entry: Partial<ShowcaseEntry> = {};

  const titleMatch = /^#\s+(.+)$/m.exec(content);
  if (titleMatch?.[1]) {
    entry.title = titleMatch[1];
  }

  const tagMatch = /\*\*Tag\*\*:\s*\[`([^`]+)`\]/i.exec(content);
  if (tagMatch?.[1]) {
    entry.tag = tagMatch[1];
  }

  const deploymentMatch = /\*\*Deployment\*\*:\s*\[([^\]]+)\]\(([^)]+)\)/i.exec(content);
  if (deploymentMatch?.[2]) {
    entry.deploymentUrl = deploymentMatch[2];
  }

  const dateMatch = /\*\*Date\*\*:\s*(.+)$/im.exec(content);
  if (dateMatch?.[1]) {
    entry.date = dateMatch[1].trim();
  }

  const issueMatch = /\|\s*Pipeline issues\s*\|\s*(\d+|\?)\s*\|/i.exec(content);
  if (issueMatch?.[1]) {
    entry.issueCount = issueMatch[1];
  }

  const prMatch = /\|\s*PRs merged\s*\|\s*(\d+|\?)\s*\|/i.exec(content);
  if (prMatch?.[1]) {
    entry.prCount = prMatch[1];
  }

  return entry;
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

    let showcaseItems;
    try {
      showcaseItems = await listDirectory({
        client,
        owner,
        repo,
        path: 'showcase',
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) {
        return NextResponse.json({ entries: [] });
      }
      throw error;
    }

    const directories = showcaseItems.filter(
      (item) => item.type === 'dir' && /^\d{2}-/.test(item.name ?? '')
    );

    const entries: ShowcaseEntry[] = [];

    for (const dir of directories) {
      const dirName = dir.name ?? '';
      const runNumberMatch = /^(\d{2})-(.+)$/.exec(dirName);

      if (!runNumberMatch) {
        continue;
      }

      const runNumber = runNumberMatch[1];
      const projectName = runNumberMatch[2];

      try {
        const readmeResult = await readFile({
          client,
          owner,
          repo,
          path: `showcase/${dirName}/README.md`,
        });

        if ('content' in readmeResult && readmeResult.type === 'file') {
          const content = Buffer.from(readmeResult.content, 'base64').toString('utf8');
          const parsed = parseReadmeContent(content);

          const entry: ShowcaseEntry = {
            slug: dirName,
            runNumber,
            projectName,
            title: parsed.title ?? `Run ${runNumber}`,
            tag: parsed.tag ?? '',
            date: parsed.date ?? '',
            deploymentUrl: parsed.deploymentUrl,
            issueCount: parsed.issueCount,
            prCount: parsed.prCount,
          };

          entries.push(entry);
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Failed to fetch showcase entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase entries' },
      { status: 500 }
    );
  }
}
