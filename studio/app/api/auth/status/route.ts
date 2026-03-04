import { NextResponse } from 'next/server';

import { clearBrowserPatToken, resolveAuthToken } from '@/lib/auth/provider';
import { validateToken } from '@/lib/auth/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const resolvedAuth = resolveAuthToken();

  if (!resolvedAuth) {
    return NextResponse.json({
      authenticated: false,
      message:
        'No GitHub token found. Authenticate with gh CLI, set GITHUB_TOKEN, or provide a PAT.',
    });
  }

  try {
    const validatedAuth = await validateToken(
      resolvedAuth.token,
      resolvedAuth.method
    );
    const { token, ...auth } = validatedAuth;

    return NextResponse.json({
      authenticated: true,
      auth,
      warning:
        auth.missingScopes.length > 0
          ? `Missing scopes: ${auth.missingScopes.join(', ')}`
          : null,
    });
  } catch {
    if (resolvedAuth.method === 'pat') {
      clearBrowserPatToken();
    }

    return NextResponse.json(
      {
        authenticated: false,
        error: 'Unable to validate GitHub token.',
      },
      { status: 401 }
    );
  }
}
