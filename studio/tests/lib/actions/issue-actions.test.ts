import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/issues', () => ({
  closeIssue: vi.fn(),
  addLabel: vi.fn(),
  removeLabel: vi.fn(),
}));

import { resolveAuthToken } from '@/lib/auth/provider';
import {
  addLabel,
  closeIssue,
  removeLabel,
} from '@/lib/actions/issue-actions';
import { createGitHubClient } from '@/lib/github/client';
import {
  addLabel as addGitHubLabel,
  closeIssue as closeGitHubIssue,
  removeLabel as removeGitHubLabel,
} from '@/lib/github/issues';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedAddGitHubLabel = vi.mocked(addGitHubLabel);
const mockedCloseGitHubIssue = vi.mocked(closeGitHubIssue);
const mockedRemoveGitHubLabel = vi.mocked(removeGitHubLabel);

describe('actions/issue-actions', () => {
  const mockClient = {};

  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedAddGitHubLabel.mockReset();
    mockedCloseGitHubIssue.mockReset();
    mockedRemoveGitHubLabel.mockReset();

    mockedResolveAuthToken.mockReturnValue({ token: 'token-123', method: 'env' });
    mockedCreateOctokit.mockReturnValue(mockClient as never);
    mockedAddGitHubLabel.mockResolvedValue([{ name: 'pipeline' }] as never);
    mockedCloseGitHubIssue.mockResolvedValue({ state: 'closed' } as never);
    mockedRemoveGitHubLabel.mockResolvedValue([{ name: 'pipeline' }] as never);
  });

  it('closes an issue', async () => {
    await closeIssue('acme', 'pipeline', 10);

    expect(mockedCloseGitHubIssue).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 10,
    });
  });

  it('adds a label to an issue', async () => {
    await addLabel('acme', 'pipeline', 10, 'ready');

    expect(mockedAddGitHubLabel).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 10,
      labels: ['ready'],
    });
  });

  it('removes a label from an issue', async () => {
    await removeLabel('acme', 'pipeline', 10, 'pipeline');

    expect(mockedRemoveGitHubLabel).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 10,
      label: 'pipeline',
    });
  });
});
