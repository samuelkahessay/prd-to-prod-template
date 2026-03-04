import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { postComment } from '@/lib/github/comments';

export const SLASH_COMMANDS = [
  '/plan',
  '/decompose',
  '/repo-assist',
  '/approve-architecture',
  '/approve-sensitive',
] as const;

export type SlashCommand = (typeof SLASH_COMMANDS)[number];

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

function isSlashCommand(command: string): command is SlashCommand {
  return (SLASH_COMMANDS as readonly string[]).includes(command);
}

export async function postSlashCommand(
  owner: string,
  repo: string,
  issueNumber: number,
  command: SlashCommand
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(issueNumber, 'issueNumber');

  if (!isSlashCommand(command)) {
    throw new Error(`Invalid slash command: ${command}`);
  }

  const authResult = resolveAuthToken();
  if (!authResult) {
    throw new Error('No GitHub authentication token found');
  }

  const client = createGitHubClient(authResult.token);

  try {
    await postComment({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      issueNumber,
      body: command,
    });
  } catch (error) {
    throw new Error(`Failed to post slash command ${command}`, { cause: error });
  }
}
