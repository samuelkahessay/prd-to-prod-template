import { describe, expect, it, vi } from 'vitest';

import {
  cancelWorkflowRun,
  dispatchWorkflow,
  getWorkflowRun,
  listWorkflowRuns,
} from '@/lib/github/workflows';

vi.mock('@octokit/rest', () => ({}));

function createMockClient() {
  return {
    rest: {
      actions: {
        listWorkflowRunsForRepo: vi.fn(),
        getWorkflowRun: vi.fn(),
        createWorkflowDispatch: vi.fn(),
        cancelWorkflowRun: vi.fn(),
      },
    },
  };
}

describe('github workflows module', () => {
  it('lists workflow runs', async () => {
    const client = createMockClient();
    client.rest.actions.listWorkflowRunsForRepo.mockResolvedValue({
      data: { total_count: 1, workflow_runs: [{ id: 2 }] },
    });

    const result = await listWorkflowRuns({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      branch: 'main',
      event: 'push',
      status: 'queued',
      actor: 'octocat',
      perPage: 15,
      page: 2,
    });

    expect(client.rest.actions.listWorkflowRunsForRepo).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      actor: 'octocat',
      branch: 'main',
      event: 'push',
      status: 'queued',
      per_page: 15,
      page: 2,
    });
    expect(result).toEqual({ total_count: 1, workflow_runs: [{ id: 2 }] });
  });

  it('gets a workflow run by id', async () => {
    const client = createMockClient();
    client.rest.actions.getWorkflowRun.mockResolvedValue({ data: { id: 123 } });

    const result = await getWorkflowRun({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      runId: 123,
    });

    expect(client.rest.actions.getWorkflowRun).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      run_id: 123,
    });
    expect(result).toEqual({ id: 123 });
  });

  it('dispatches a workflow', async () => {
    const client = createMockClient();
    client.rest.actions.createWorkflowDispatch.mockResolvedValue({ status: 204 });

    const result = await dispatchWorkflow({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      workflowId: 'build.yml',
      ref: 'main',
      inputs: { prdPath: 'docs/prd/sample.md' },
    });

    expect(client.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      workflow_id: 'build.yml',
      ref: 'main',
      inputs: { prdPath: 'docs/prd/sample.md' },
    });
    expect(result).toBe(204);
  });

  it('cancels a workflow run', async () => {
    const client = createMockClient();
    client.rest.actions.cancelWorkflowRun.mockResolvedValue({ status: 202 });

    const result = await cancelWorkflowRun({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      runId: 99,
    });

    expect(client.rest.actions.cancelWorkflowRun).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      run_id: 99,
    });
    expect(result).toBe(202);
  });
});
