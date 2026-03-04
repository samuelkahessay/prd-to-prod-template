import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

vi.mock('@/lib/github/workflows', () => ({
  dispatchWorkflow: vi.fn(),
  cancelWorkflowRun: vi.fn(),
}));

import { resolveAuthToken } from '@/lib/auth/provider';
import {
  cancelWorkflow,
  dispatchWorkflow,
  reRunWorkflow,
} from '@/lib/actions/workflow-dispatch';
import { createGitHubClient } from '@/lib/github/client';
import {
  cancelWorkflowRun,
  dispatchWorkflow as dispatchGitHubWorkflow,
} from '@/lib/github/workflows';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);
const mockedDispatchGitHubWorkflow = vi.mocked(dispatchGitHubWorkflow);
const mockedCancelWorkflowRun = vi.mocked(cancelWorkflowRun);

describe('actions/workflow-dispatch', () => {
  const mockClient = {
    rest: {
      actions: {
        reRunWorkflow: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
    mockedDispatchGitHubWorkflow.mockReset();
    mockedCancelWorkflowRun.mockReset();
    mockClient.rest.actions.reRunWorkflow.mockReset();

    mockedResolveAuthToken.mockReturnValue({ token: 'token-123', method: 'env' });
    mockedCreateOctokit.mockReturnValue(mockClient as never);
    mockedDispatchGitHubWorkflow.mockResolvedValue(204 as never);
    mockedCancelWorkflowRun.mockResolvedValue(202 as never);
    mockClient.rest.actions.reRunWorkflow.mockResolvedValue({ status: 201 });
  });

  it('dispatches a workflow with inputs', async () => {
    await dispatchWorkflow('acme', 'pipeline', 'repo-assist.yml', 'main', {
      issue_number: '123',
    });

    expect(mockedDispatchGitHubWorkflow).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      workflowId: 'repo-assist.yml',
      ref: 'main',
      inputs: { issue_number: '123' },
    });
  });

  it('re-runs a workflow by run id', async () => {
    await reRunWorkflow('acme', 'pipeline', 88);

    expect(mockClient.rest.actions.reRunWorkflow).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      run_id: 88,
    });
  });

  it('cancels a workflow run by run id', async () => {
    await cancelWorkflow('acme', 'pipeline', 99);

    expect(mockedCancelWorkflowRun).toHaveBeenCalledWith({
      client: mockClient,
      owner: 'acme',
      repo: 'pipeline',
      runId: 99,
    });
  });
});
