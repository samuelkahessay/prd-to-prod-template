import type { Octokit } from '@octokit/rest';

export interface BaseRepoParams {
  owner: string;
  repo: string;
}

export interface GitActor {
  name: string;
  email: string;
}

export interface WriteFileParams extends BaseRepoParams {
  client: Octokit;
  path: string;
  message: string;
  content: string;
  branch?: string;
  sha?: string;
  committer?: GitActor;
  author?: GitActor;
}

export type WriteFileResult = Awaited<
  ReturnType<Octokit['rest']['repos']['createOrUpdateFileContents']>
>['data'];

export async function writeFile(params: WriteFileParams): Promise<WriteFileResult> {
  const response = await params.client.rest.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    message: params.message,
    content: Buffer.from(params.content, 'utf8').toString('base64'),
    branch: params.branch,
    sha: params.sha,
    committer: params.committer,
    author: params.author,
  });

  return response.data;
}

export interface ReadFileParams extends BaseRepoParams {
  client: Octokit;
  path: string;
  ref?: string;
}

export type ReadFileResult = Awaited<
  ReturnType<Octokit['rest']['repos']['getContent']>
>['data'];

export async function readFile(params: ReadFileParams): Promise<ReadFileResult> {
  const response = await params.client.rest.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.ref,
  });

  return response.data;
}

export interface ListDirectoryParams extends BaseRepoParams {
  client: Octokit;
  path: string;
  ref?: string;
}

export type ListDirectoryResult = Exclude<ReadFileResult, { type: string }>;

export async function listDirectory(
  params: ListDirectoryParams
): Promise<ListDirectoryResult> {
  const response = await params.client.rest.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.ref,
  });

  if (!Array.isArray(response.data)) {
    throw new Error('Requested path is not a directory');
  }

  return response.data;
}
