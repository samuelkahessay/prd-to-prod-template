import { Octokit } from '@octokit/rest';

export function createGitHubClient(token: string): Octokit {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    throw new Error('GitHub token is required');
  }

  return new Octokit({ auth: trimmedToken });
}
