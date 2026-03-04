import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/pulls', () => ({
  approvePR: vi.fn(),
  mergePR: vi.fn(),
}));

import { resolveAuthToken } from '@/lib/auth/provider';
import {
  approvePR,
  closePR,
  mergePR,
  requestChangesPR,
} from '@/lib/actions/pr-actions';
import { createGitHubClient } from '@/lib/github/client';
import {
  approvePR as approveGitHubPR,
  mergePR as mergeGitHubPR,
} from '@/lib/github/pulls';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedApproveGitHubPR = vi.mocked(approveGitHubPR);
const mockedMergeGitHubPR = vi.mocked(mergeGitHubPR);

describe('actions/pr-actions', () => {
  const mockClient = {
    rest: {
      pulls: {
        createReview: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedApproveGitHubPR.mockReset();
    mockedMergeGitHubPR.mockReset();
    mockClient.rest.pulls.createReview.mockReset();
    mockClient.rest.pulls.update.mockReset();

    mockedResolveAuthToken.mockReturnValue({ token: 'token-123', method: 'env' });
    mockedCreateOctokit.mockReturnValue(mockClient as never);
    mockedApproveGitHubPR.mockResolvedValue({ id: 1 } as never);
    mockedMergeGitHubPR.mockResolvedValue({ merged: true } as never);
    mockClient.rest.pulls.createReview.mockResolvedValue({ data: { id: 2 } });
    mockClient.rest.pulls.update.mockResolvedValue({ data: { state: 'closed' } });
  });

  it('approves a PR', async () => {
    await approvePR('acme', 'pipeline', 15);

    expect(mockedApproveGitHubPR).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      pullNumber: 15,
    });
  });

  it('requests changes on a PR with reason', async () => {
    await requestChangesPR('acme', 'pipeline', 16, 'Please fix failing tests');

    expect(mockClient.rest.pulls.createReview).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      pull_number: 16,
      event: 'REQUEST_CHANGES',
      body: 'Please fix failing tests',
    });
  });

  it('merges a PR with the selected method', async () => {
    await mergePR('acme', 'pipeline', 16, 'squash');

    expect(mockedMergeGitHubPR).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      pullNumber: 16,
      mergeMethod: 'squash',
    });
  });

  it('closes a PR', async () => {
    await closePR('acme', 'pipeline', 17);

    expect(mockClient.rest.pulls.update).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      pull_number: 17,
      state: 'closed',
    });
  });
});
