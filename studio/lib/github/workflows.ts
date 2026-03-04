import type { Octokit } from '@octokit/rest';

export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface ListWorkflowRunsParams extends BaseRepoParams {
  client: Octokit;
  actor?: string;
  branch?: string;
  event?: string;
  status?:
    | 'completed'
    | 'action_required'
    | 'cancelled'
    | 'failure'
    | 'neutral'
    | 'skipped'
    | 'stale'
    | 'success'
    | 'timed_out'
    | 'in_progress'
    | 'queued'
    | 'requested'
    | 'waiting'
    | 'pending';
  perPage?: number;
  page?: number;
}

export type ListWorkflowRunsResult = Awaited<
  ReturnType<Octokit['rest']['actions']['listWorkflowRunsForRepo']>
>['data'];

export async function listWorkflowRuns(
  params: ListWorkflowRunsParams
): Promise<ListWorkflowRunsResult> {
  const response = await params.client.rest.actions.listWorkflowRunsForRepo({
    owner: params.owner,
    repo: params.repo,
    actor: params.actor,
    branch: params.branch,
    event: params.event,
    status: params.status,
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}

export interface GetWorkflowRunParams extends BaseRepoParams {
  client: Octokit;
  runId: number;
}

export type GetWorkflowRunResult = Awaited<
  ReturnType<Octokit['rest']['actions']['getWorkflowRun']>
>['data'];

export async function getWorkflowRun(
  params: GetWorkflowRunParams
): Promise<GetWorkflowRunResult> {
  const response = await params.client.rest.actions.getWorkflowRun({
    owner: params.owner,
    repo: params.repo,
    run_id: params.runId,
  });

  return response.data;
}

export interface DispatchWorkflowParams extends BaseRepoParams {
  client: Octokit;
  workflowId: number | string;
  ref: string;
  inputs?: Record<string, string>;
}

export type DispatchWorkflowResult = Awaited<
  ReturnType<Octokit['rest']['actions']['createWorkflowDispatch']>
>['status'];

export async function dispatchWorkflow(
  params: DispatchWorkflowParams
): Promise<DispatchWorkflowResult> {
  const response = await params.client.rest.actions.createWorkflowDispatch({
    owner: params.owner,
    repo: params.repo,
    workflow_id: params.workflowId,
    ref: params.ref,
    inputs: params.inputs,
  });

  return response.status;
}

export interface CancelWorkflowRunParams extends BaseRepoParams {
  client: Octokit;
  runId: number;
}

export type CancelWorkflowRunResult = Awaited<
  ReturnType<Octokit['rest']['actions']['cancelWorkflowRun']>
>['status'];

export async function cancelWorkflowRun(
  params: CancelWorkflowRunParams
): Promise<CancelWorkflowRunResult> {
  const response = await params.client.rest.actions.cancelWorkflowRun({
    owner: params.owner,
    repo: params.repo,
    run_id: params.runId,
  });

  return response.status;
}
