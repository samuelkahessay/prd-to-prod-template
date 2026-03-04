import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  setBrowserPatToken: vi.fn(),
  clearBrowserPatToken: vi.fn(),
}));

vi.mock('@/lib/auth/validate', () => ({
  validateToken: vi.fn(),
}));

import { POST } from '@/app/api/auth/token/route';
import { clearBrowserPatToken, setBrowserPatToken } from '@/lib/auth/provider';
import { validateToken } from '@/lib/auth/validate';

const mockedValidateToken = vi.mocked(validateToken);
const mockedSetBrowserPatToken = vi.mocked(setBrowserPatToken);
const mockedClearBrowserPatToken = vi.mocked(clearBrowserPatToken);

describe('POST /api/auth/token', () => {
  beforeEach(() => {
    mockedValidateToken.mockReset();
    mockedSetBrowserPatToken.mockReset();
    mockedClearBrowserPatToken.mockReset();
  });

  it('returns 400 for missing token payload', async () => {
    const request = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.authenticated).toBe(false);
    expect(mockedValidateToken).not.toHaveBeenCalled();
  });

  it('stores token after successful validation', async () => {
    mockedValidateToken.mockResolvedValue({
      token: 'good-token',
      method: 'pat',
      user: {
        id: 1,
        login: 'octocat',
        name: null,
        avatar_url: 'https://avatars.githubusercontent.com/u/1',
        html_url: 'https://github.com/octocat',
      },
      scopes: ['repo', 'workflow'],
      missingScopes: [],
    });

    const request = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'good-token' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.authenticated).toBe(true);
    expect(payload.auth.token).toBeUndefined();
    expect(mockedSetBrowserPatToken).toHaveBeenCalledWith('good-token');
  });

  it('returns 401 and clears cached token when validation fails', async () => {
    mockedValidateToken.mockRejectedValue(new Error('Invalid token'));

    const request = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'bad-token' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.authenticated).toBe(false);
    expect(mockedClearBrowserPatToken).toHaveBeenCalledTimes(1);
  });
});
