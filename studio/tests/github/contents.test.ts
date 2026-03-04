import { describe, expect, it, vi } from 'vitest';

import { listDirectory, readFile, writeFile } from '@/lib/github/contents';

vi.mock('@octokit/rest', () => ({}));

function createMockClient() {
  return {
    rest: {
      repos: {
        createOrUpdateFileContents: vi.fn(),
        getContent: vi.fn(),
      },
    },
  };
}

describe('github contents module', () => {
  it('writes a file with base64 content', async () => {
    const client = createMockClient();
    client.rest.repos.createOrUpdateFileContents.mockResolvedValue({
      data: { content: { sha: 'abc123' }, commit: { sha: 'def456' } },
    });

    const result = await writeFile({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      path: 'docs/prd/new.md',
      message: 'add prd',
      content: 'hello world',
      branch: 'main',
    });

    expect(client.rest.repos.createOrUpdateFileContents).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      path: 'docs/prd/new.md',
      message: 'add prd',
      content: 'aGVsbG8gd29ybGQ=',
      branch: 'main',
      sha: undefined,
      committer: undefined,
      author: undefined,
    });
    expect(result).toEqual({ content: { sha: 'abc123' }, commit: { sha: 'def456' } });
  });

  it('reads a file', async () => {
    const client = createMockClient();
    client.rest.repos.getContent.mockResolvedValue({
      data: { type: 'file', name: 'file.md', content: 'aGVsbG8=' },
    });

    const result = await readFile({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      path: 'file.md',
      ref: 'main',
    });

    expect(client.rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      path: 'file.md',
      ref: 'main',
    });
    expect(result).toEqual({ type: 'file', name: 'file.md', content: 'aGVsbG8=' });
  });

  it('lists a directory when content response is an array', async () => {
    const client = createMockClient();
    client.rest.repos.getContent.mockResolvedValue({
      data: [{ type: 'file', name: 'a.md' }],
    });

    const result = await listDirectory({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      path: 'docs/prd',
    });

    expect(result).toEqual([{ type: 'file', name: 'a.md' }]);
  });

  it('throws if listDirectory receives file payload', async () => {
    const client = createMockClient();
    client.rest.repos.getContent.mockResolvedValue({
      data: { type: 'file', name: 'a.md' },
    });

    await expect(
      listDirectory({
        client: client as never,
        owner: 'acme',
        repo: 'pipeline',
        path: 'docs/prd',
      })
    ).rejects.toThrow('Requested path is not a directory');
  });
});
