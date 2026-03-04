import type { Octokit } from '@octokit/rest';

export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface ListPipelinePRsParams extends BaseRepoParams {
  client: Octokit;
  state?: 'open' | 'closed' | 'all';
  perPage?: number;
  page?: number;
}

export type ListPipelinePRsResult = Awaited<
  ReturnType<Octokit['rest']['pulls']['list']>
>['data'];

export async function listPipelinePRs(
  params: ListPipelinePRsParams
): Promise<ListPipelinePRsResult> {
  const response = await params.client.rest.pulls.list({
    owner: params.owner,
    repo: params.repo,
    state: params.state ?? 'open',
    sort: 'updated',
    direction: 'desc',
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}

export interface GetPRParams extends BaseRepoParams {
  client: Octokit;
  pullNumber: number;
}

export type GetPRResult = Awaited<
  ReturnType<Octokit['rest']['pulls']['get']>
>['data'];

export async function getPR(params: GetPRParams): Promise<GetPRResult> {
  const response = await params.client.rest.pulls.get({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
  });

  return response.data;
}

export interface GetPRReviewsParams extends BaseRepoParams {
  client: Octokit;
  pullNumber: number;
  perPage?: number;
  page?: number;
}

export type GetPRReviewsResult = Awaited<
  ReturnType<Octokit['rest']['pulls']['listReviews']>
>['data'];

export async function getPRReviews(
  params: GetPRReviewsParams
): Promise<GetPRReviewsResult> {
  const response = await params.client.rest.pulls.listReviews({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}

export interface ApprovePRParams extends BaseRepoParams {
  client: Octokit;
  pullNumber: number;
  body?: string;
}

export type ApprovePRResult = Awaited<
  ReturnType<Octokit['rest']['pulls']['createReview']>
>['data'];

export async function approvePR(
  params: ApprovePRParams
): Promise<ApprovePRResult> {
  const response = await params.client.rest.pulls.createReview({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
    event: 'APPROVE',
    body: params.body,
  });

  return response.data;
}

export interface MergePRParams extends BaseRepoParams {
  client: Octokit;
  pullNumber: number;
  commitTitle?: string;
  commitMessage?: string;
  mergeMethod?: 'merge' | 'squash' | 'rebase';
}

export type MergePRResult = Awaited<
  ReturnType<Octokit['rest']['pulls']['merge']>
>['data'];

export async function mergePR(params: MergePRParams): Promise<MergePRResult> {
  const response = await params.client.rest.pulls.merge({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
    commit_title: params.commitTitle,
    commit_message: params.commitMessage,
    merge_method: params.mergeMethod,
  });

  return response.data;
}
