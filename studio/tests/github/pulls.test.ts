import { describe, expect, it, vi } from 'vitest';

import {
  approvePR,
  getPR,
  getPRReviews,
  listPipelinePRs,
  mergePR,
} from '@/lib/github/pulls';

vi.mock('@octokit/rest', () => ({}));

function createMockClient() {
  return {
    rest: {
      pulls: {
        list: vi.fn(),
        get: vi.fn(),
        listReviews: vi.fn(),
        createReview: vi.fn(),
        merge: vi.fn(),
      },
    },
  };
}

describe('github pulls module', () => {
  it('lists pipeline PRs', async () => {
    const client = createMockClient();
    client.rest.pulls.list.mockResolvedValue({ data: [{ number: 5 }] });

    const result = await listPipelinePRs({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      state: 'open',
      perPage: 10,
      page: 3,
    });

    expect(client.rest.pulls.list).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      state: 'open',
      sort: 'updated',
      direction: 'desc',
      per_page: 10,
      page: 3,
    });
    expect(result).toEqual([{ number: 5 }]);
  });

  it('gets a pull request', async () => {
    const client = createMockClient();
    client.rest.pulls.get.mockResolvedValue({ data: { number: 7 } });

    const result = await getPR({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      pullNumber: 7,
    });

    expect(client.rest.pulls.get).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      pull_number: 7,
    });
    expect(result).toEqual({ number: 7 });
  });

  it('gets pull request reviews', async () => {
    const client = createMockClient();
    client.rest.pulls.listReviews.mockResolvedValue({ data: [{ id: 1 }] });

    const result = await getPRReviews({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      pullNumber: 7,
      perPage: 30,
      page: 1,
    });

    expect(client.rest.pulls.listReviews).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      pull_number: 7,
      per_page: 30,
      page: 1,
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('approves a pull request', async () => {
    const client = createMockClient();
    client.rest.pulls.createReview.mockResolvedValue({ data: { id: 4, state: 'APPROVED' } });

    const result = await approvePR({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      pullNumber: 11,
      body: 'looks good',
    });

    expect(client.rest.pulls.createReview).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      pull_number: 11,
      event: 'APPROVE',
      body: 'looks good',
    });
    expect(result).toEqual({ id: 4, state: 'APPROVED' });
  });

  it('merges a pull request', async () => {
    const client = createMockClient();
    client.rest.pulls.merge.mockResolvedValue({ data: { merged: true } });

    const result = await mergePR({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      pullNumber: 11,
      commitTitle: 'merge title',
      commitMessage: 'merge message',
      mergeMethod: 'squash',
    });

    expect(client.rest.pulls.merge).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      pull_number: 11,
      commit_title: 'merge title',
      commit_message: 'merge message',
      merge_method: 'squash',
    });
    expect(result).toEqual({ merged: true });
  });
});
