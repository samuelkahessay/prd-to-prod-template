import type { Octokit } from '@octokit/rest';

export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface ListPipelineIssuesParams extends BaseRepoParams {
  client: Octokit;
  state?: 'open' | 'closed';
  perPage?: number;
  page?: number;
}

export type ListPipelineIssuesResult = Awaited<
  ReturnType<Octokit['rest']['issues']['listForRepo']>
>['data'];

export async function listPipelineIssues(
  params: ListPipelineIssuesParams
): Promise<ListPipelineIssuesResult> {
  const response = await params.client.rest.issues.listForRepo({
    owner: params.owner,
    repo: params.repo,
    state: params.state ?? 'open',
    labels: 'pipeline',
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}

export interface GetIssueParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
}

export type GetIssueResult = Awaited<
  ReturnType<Octokit['rest']['issues']['get']>
>['data'];

export async function getIssue(params: GetIssueParams): Promise<GetIssueResult> {
  const response = await params.client.rest.issues.get({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
  });

  return response.data;
}

export interface GetIssueCommentsParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
  perPage?: number;
  page?: number;
}

export type GetIssueCommentsResult = Awaited<
  ReturnType<Octokit['rest']['issues']['listComments']>
>['data'];

export async function getIssueComments(
  params: GetIssueCommentsParams
): Promise<GetIssueCommentsResult> {
  const response = await params.client.rest.issues.listComments({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}

export interface AddLabelParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
  labels: string[];
}

export type AddLabelResult = Awaited<
  ReturnType<Octokit['rest']['issues']['addLabels']>
>['data'];

export async function addLabel(params: AddLabelParams): Promise<AddLabelResult> {
  const response = await params.client.rest.issues.addLabels({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    labels: params.labels,
  });

  return response.data;
}

export interface RemoveLabelParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
  label: string;
}

export type RemoveLabelResult = Awaited<
  ReturnType<Octokit['rest']['issues']['removeLabel']>
>['data'];

export async function removeLabel(
  params: RemoveLabelParams
): Promise<RemoveLabelResult> {
  const response = await params.client.rest.issues.removeLabel({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    name: params.label,
  });

  return response.data;
}

export interface CloseIssueParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
}

export type CloseIssueResult = Awaited<
  ReturnType<Octokit['rest']['issues']['update']>
>['data'];

export async function closeIssue(
  params: CloseIssueParams
): Promise<CloseIssueResult> {
  const response = await params.client.rest.issues.update({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    state: 'closed',
  });

  return response.data;
}
