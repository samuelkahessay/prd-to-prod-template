import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
  clearBrowserPatToken: vi.fn(),
}));

vi.mock('@/lib/auth/validate', () => ({
  validateToken: vi.fn(),
}));

import { GET } from '@/app/api/auth/status/route';
import {
  clearBrowserPatToken,
  resolveAuthToken,
} from '@/lib/auth/provider';
import { validateToken } from '@/lib/auth/validate';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedValidateToken = vi.mocked(validateToken);
const mockedClearBrowserPatToken = vi.mocked(clearBrowserPatToken);

describe('GET /api/auth/status', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedValidateToken.mockReset();
    mockedClearBrowserPatToken.mockReset();
  });

  it('returns unauthenticated response when no token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.authenticated).toBe(false);
  });

  it('returns auth details when token is valid', async () => {
    mockedResolveAuthToken.mockReturnValue({ token: 'abc', method: 'env' });
    mockedValidateToken.mockResolvedValue({
      token: 'abc',
      method: 'env',
      user: {
        id: 1,
        login: 'octocat',
        name: 'Mona',
        avatar_url: 'https://avatars.githubusercontent.com/u/1',
        html_url: 'https://github.com/octocat',
      },
      scopes: ['repo'],
      missingScopes: ['workflow'],
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.authenticated).toBe(true);
    expect(payload.auth.token).toBeUndefined();
    expect(payload.auth.user.login).toBe('octocat');
    expect(payload.warning).toContain('workflow');
  });

  it('clears stored PAT when PAT validation fails', async () => {
    mockedResolveAuthToken.mockReturnValue({ token: 'abc', method: 'pat' });
    mockedValidateToken.mockRejectedValue(new Error('Invalid token'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.authenticated).toBe(false);
    expect(mockedClearBrowserPatToken).toHaveBeenCalledTimes(1);
  });
});
