import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import {
  addLabel as addIssueLabel,
  closeIssue as closeGitHubIssue,
  removeLabel as removeIssueLabel,
} from '@/lib/github/issues';

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

export async function closeIssue(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(issueNumber, 'issueNumber');

  const client = getAuthedClient();

  try {
    await closeGitHubIssue({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      issueNumber,
    });
  } catch (error) {
    throw new Error(`Failed to close issue #${issueNumber}`, { cause: error });
  }
}

export async function addLabel(
  owner: string,
  repo: string,
  issueNumber: number,
  label: string
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(issueNumber, 'issueNumber');
  assertNonEmpty(label, 'label');

  const client = getAuthedClient();

  try {
    await addIssueLabel({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      issueNumber,
      labels: [label.trim()],
    });
  } catch (error) {
    throw new Error(`Failed to add label to issue #${issueNumber}`, {
      cause: error,
    });
  }
}

export async function removeLabel(
  owner: string,
  repo: string,
  issueNumber: number,
  label: string
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(issueNumber, 'issueNumber');
  assertNonEmpty(label, 'label');

  const client = getAuthedClient();

  try {
    await removeIssueLabel({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      issueNumber,
      label: label.trim(),
    });
  } catch (error) {
    throw new Error(`Failed to remove label from issue #${issueNumber}`, {
      cause: error,
    });
  }
}
