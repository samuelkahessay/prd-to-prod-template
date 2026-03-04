import type { Octokit } from '@octokit/rest';

export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface ListDeploymentsParams extends BaseRepoParams {
  client: Octokit;
  environment?: string;
  perPage?: number;
  page?: number;
}

export type ListDeploymentsResult = Awaited<
  ReturnType<Octokit['rest']['repos']['listDeployments']>
>['data'];

export async function listDeployments(
  params: ListDeploymentsParams
): Promise<ListDeploymentsResult> {
  const response = await params.client.rest.repos.listDeployments({
    owner: params.owner,
    repo: params.repo,
    environment: params.environment,
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}

export interface GetDeploymentStatusesParams extends BaseRepoParams {
  client: Octokit;
  deploymentId: number;
  perPage?: number;
  page?: number;
}

export type GetDeploymentStatusesResult = Awaited<
  ReturnType<Octokit['rest']['repos']['listDeploymentStatuses']>
>['data'];

export async function getDeploymentStatuses(
  params: GetDeploymentStatusesParams
): Promise<GetDeploymentStatusesResult> {
  const response = await params.client.rest.repos.listDeploymentStatuses({
    owner: params.owner,
    repo: params.repo,
    deployment_id: params.deploymentId,
    per_page: params.perPage,
    page: params.page,
  });

  return response.data;
}
