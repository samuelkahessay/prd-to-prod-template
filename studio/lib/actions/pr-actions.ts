import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import {
  approvePR as approvePullRequest,
  mergePR as mergePullRequest,
} from '@/lib/github/pulls';

export type MergeMethod = 'merge' | 'squash' | 'rebase';

function assertNonEmpty(value: string, fieldName: string): void {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
}

function getAuthedClient() {
  const authResult = resolveAuthToken();
  if (!authResult) {
    throw new Error('No GitHub authentication token found');
  }

  return createGitHubClient(authResult.token);
}

export async function approvePR(
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(prNumber, 'prNumber');

  const client = getAuthedClient();

  try {
    await approvePullRequest({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      pullNumber: prNumber,
    });
  } catch (error) {
    throw new Error(`Failed to approve PR #${prNumber}`, { cause: error });
  }
}

export async function requestChangesPR(
  owner: string,
  repo: string,
  prNumber: number,
  reason: string
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(prNumber, 'prNumber');
  assertNonEmpty(reason, 'reason');

  const client = getAuthedClient();

  try {
    await client.rest.pulls.createReview({
      owner: owner.trim(),
      repo: repo.trim(),
      pull_number: prNumber,
      event: 'REQUEST_CHANGES',
      body: reason.trim(),
    });
  } catch (error) {
    throw new Error(`Failed to request changes on PR #${prNumber}`, {
      cause: error,
    });
  }
}

export async function mergePR(
  owner: string,
  repo: string,
  prNumber: number,
  method: MergeMethod
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(prNumber, 'prNumber');

  const client = getAuthedClient();

  try {
    await mergePullRequest({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      pullNumber: prNumber,
      mergeMethod: method,
    });
  } catch (error) {
    throw new Error(`Failed to merge PR #${prNumber}`, { cause: error });
  }
}

export async function closePR(
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(prNumber, 'prNumber');

  const client = getAuthedClient();

  try {
    await client.rest.pulls.update({
      owner: owner.trim(),
      repo: repo.trim(),
      pull_number: prNumber,
      state: 'closed',
    });
  } catch (error) {
    throw new Error(`Failed to close PR #${prNumber}`, { cause: error });
  }
}
