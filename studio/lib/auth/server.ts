import type { Octokit } from '@octokit/rest';

import { resolveAuthToken } from '@/lib/auth/provider';
import { createOctokit } from '@/lib/github/client';

export function getAuthenticatedClient(): Octokit {
  const authResult = resolveAuthToken();

  if (!authResult) {
    throw new Error('No GitHub authentication token found');
  }

  return createOctokit(authResult.token);
}
