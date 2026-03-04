import type { AuthState, AuthMethod, GitHubUser } from '@/lib/auth/types';

const REQUIRED_SCOPES = ['workflow'] as const;

function parseScopes(rawScopes: string | null): string[] {
  if (!rawScopes) {
    return [];
  }

  return rawScopes
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export async function validateToken(
  token: string,
  method: AuthMethod
): Promise<AuthState> {
  const response = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GitHub auth validation failed (${response.status})`);
  }

  const user = (await response.json()) as GitHubUser;
  const scopes = parseScopes(response.headers.get('x-oauth-scopes'));
  const missingScopes = REQUIRED_SCOPES.filter(
    (requiredScope) => !scopes.includes(requiredScope)
  );

  return {
    token,
    method,
    user,
    scopes,
    missingScopes,
  };
}
