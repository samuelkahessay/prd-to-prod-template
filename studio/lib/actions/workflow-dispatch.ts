import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import {
  cancelWorkflowRun,
  dispatchWorkflow as dispatchGitHubWorkflow,
} from '@/lib/github/workflows';

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

export async function dispatchWorkflow(
  owner: string,
  repo: string,
  workflowId: string,
  ref: string,
  inputs?: Record<string, string>
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertNonEmpty(workflowId, 'workflowId');
  assertNonEmpty(ref, 'ref');

  const client = getAuthedClient();

  try {
    await dispatchGitHubWorkflow({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      workflowId: workflowId.trim(),
      ref: ref.trim(),
      inputs,
    });
  } catch (error) {
    throw new Error('Failed to dispatch workflow', { cause: error });
  }
}

export async function reRunWorkflow(
  owner: string,
  repo: string,
  runId: number
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(runId, 'runId');

  const client = getAuthedClient();

  try {
    await client.rest.actions.reRunWorkflow({
      owner: owner.trim(),
      repo: repo.trim(),
      run_id: runId,
    });
  } catch (error) {
    throw new Error(`Failed to re-run workflow run ${runId}`, { cause: error });
  }
}

export async function cancelWorkflow(
  owner: string,
  repo: string,
  runId: number
): Promise<void> {
  assertNonEmpty(owner, 'owner');
  assertNonEmpty(repo, 'repo');
  assertPositiveInteger(runId, 'runId');

  const client = getAuthedClient();

  try {
    await cancelWorkflowRun({
      client,
      owner: owner.trim(),
      repo: repo.trim(),
      runId,
    });
  } catch (error) {
    throw new Error(`Failed to cancel workflow run ${runId}`, { cause: error });
  }
}
