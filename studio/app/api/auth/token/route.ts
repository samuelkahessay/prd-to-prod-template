import { NextResponse } from 'next/server';

import { clearBrowserPatToken, setBrowserPatToken } from '@/lib/auth/provider';
import { validateToken } from '@/lib/auth/validate';

export const dynamic = 'force-dynamic';

interface TokenBody {
  token?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TokenBody | null;
  const token = typeof body?.token === 'string' ? body.token.trim() : '';

  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'A Personal Access Token is required.',
      },
      { status: 400 }
    );
  }

  try {
    const validatedAuth = await validateToken(token, 'pat');
    setBrowserPatToken(token);

    const { token: _token, ...auth } = validatedAuth;

    return NextResponse.json({
      authenticated: true,
      auth,
      warning:
        auth.missingScopes.length > 0
          ? `Missing scopes: ${auth.missingScopes.join(', ')}`
          : null,
    });
  } catch {
    clearBrowserPatToken();
    return NextResponse.json(
      {
        authenticated: false,
        error: 'GitHub rejected this token. Check token scopes and try again.',
      },
      { status: 401 }
    );
  }
}
