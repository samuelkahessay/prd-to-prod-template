import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateToken } from '@/lib/auth/validate';

describe('validateToken', () => {
  const mockedFetch = vi.fn();

  beforeEach(() => {
    mockedFetch.mockReset();
    vi.stubGlobal('fetch', mockedFetch);
  });

  it('returns user and scopes when token is valid', async () => {
    mockedFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          login: 'octocat',
          name: 'Mona',
          avatar_url: 'https://avatars.githubusercontent.com/u/1',
          html_url: 'https://github.com/octocat',
        }),
        {
          status: 200,
          headers: { 'x-oauth-scopes': 'repo, workflow' },
        }
      )
    );

    const result = await validateToken('token-123', 'pat');

    expect(result.user.login).toBe('octocat');
    expect(result.scopes).toEqual(['repo', 'workflow']);
    expect(result.missingScopes).toEqual([]);
  });

  it('warns when workflow scope is missing', async () => {
    mockedFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 2,
          login: 'maintainer',
          name: null,
          avatar_url: 'https://avatars.githubusercontent.com/u/2',
          html_url: 'https://github.com/maintainer',
        }),
        {
          status: 200,
          headers: { 'x-oauth-scopes': 'repo, read:org' },
        }
      )
    );

    const result = await validateToken('token-123', 'env');

    expect(result.missingScopes).toEqual(['workflow']);
  });

  it('throws when GitHub rejects the token', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 401 }));

    await expect(validateToken('bad-token', 'pat')).rejects.toThrow(
      'GitHub auth validation failed (401)'
    );
  });
});
