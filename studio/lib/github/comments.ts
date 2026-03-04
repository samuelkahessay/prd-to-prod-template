import type { Octokit } from '@octokit/rest';

export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface PostCommentParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
  body: string;
}

export type PostCommentResult = Awaited<
  ReturnType<Octokit['rest']['issues']['createComment']>
>['data'];

export async function postComment(
  params: PostCommentParams
): Promise<PostCommentResult> {
  const response = await params.client.rest.issues.createComment({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    body: params.body,
  });

  return response.data;
}

export interface ListCommentsParams extends BaseRepoParams {
  client: Octokit;
  issueNumber: number;
  perPage?: number;
  page?: number;
}

export type ListCommentsResult = Awaited<
  ReturnType<Octokit['rest']['issues']['listComments']>
>['data'];

export async function listComments(
  params: ListCommentsParams
): Promise<ListCommentsResult> {
  const response = await params.client.rest.issues.listComments({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}
