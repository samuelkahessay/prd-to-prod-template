import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/comments', () => ({
  postComment: vi.fn(),
}));

import { resolveAuthToken } from '@/lib/auth/provider';
import { postSlashCommand } from '@/lib/actions/slash-commands';
import { createGitHubClient } from '@/lib/github/client';
import { postComment } from '@/lib/github/comments';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedPostComment = vi.mocked(postComment);

describe('actions/slash-commands', () => {
  const mockClient = {};

  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedPostComment.mockReset();

    mockedResolveAuthToken.mockReturnValue({ token: 'token-123', method: 'env' });
    mockedCreateOctokit.mockReturnValue(mockClient as never);
    mockedPostComment.mockResolvedValue({ id: 1 } as never);
  });

  it('posts a supported slash command as issue comment', async () => {
    await postSlashCommand('acme', 'pipeline', 42, '/decompose');

    expect(mockedCreateOctokit).toHaveBeenCalledWith('token-123');
    expect(mockedPostComment).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 42,
      body: '/decompose',
    });
  });

  it('rejects invalid slash command values', async () => {
    await expect(
      postSlashCommand('acme', 'pipeline', 42, '/invalid' as never)
    ).rejects.toThrow('Invalid slash command');

    expect(mockedPostComment).not.toHaveBeenCalled();
  });

  it('fails when auth token cannot be resolved', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    await expect(
      postSlashCommand('acme', 'pipeline', 42, '/plan')
    ).rejects.toThrow('No GitHub authentication token found');
  });
});
