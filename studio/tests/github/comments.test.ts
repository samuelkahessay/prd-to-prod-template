import { describe, expect, it, vi } from 'vitest';

import { listComments, postComment } from '@/lib/github/comments';

vi.mock('@octokit/rest', () => ({}));

function createMockClient() {
  return {
    rest: {
      issues: {
        createComment: vi.fn(),
        listComments: vi.fn(),
      },
    },
  };
}

describe('github comments module', () => {
  it('posts a comment', async () => {
    const client = createMockClient();
    client.rest.issues.createComment.mockResolvedValue({ data: { id: 1, body: '/decompose' } });

    const result = await postComment({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 10,
      body: '/decompose',
    });

    expect(client.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 10,
      body: '/decompose',
    });
    expect(result).toEqual({ id: 1, body: '/decompose' });
  });

  it('lists comments', async () => {
    const client = createMockClient();
    client.rest.issues.listComments.mockResolvedValue({ data: [{ id: 2 }] });

    const result = await listComments({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 10,
      perPage: 100,
      page: 1,
    });

    expect(client.rest.issues.listComments).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 10,
      per_page: 100,
      page: 1,
    });
    expect(result).toEqual([{ id: 2 }]);
  });
});
