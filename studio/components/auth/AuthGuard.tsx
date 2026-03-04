'use client';

import { useEffect, useState } from 'react';

import { TokenInput } from '@/components/auth/TokenInput';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PublicAuthState } from '@/lib/auth/types';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface StatusApiResponse {
  authenticated: boolean;
  auth?: PublicAuthState;
  error?: string;
  message?: string;
  warning?: string | null;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<PublicAuthState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true);

      try {
        const response = await fetch('/api/auth/status', { cache: 'no-store' });
        const payload = (await response.json()) as StatusApiResponse;

        if (response.ok && payload.authenticated && payload.auth) {
          setAuth(payload.auth);
          setWarning(payload.warning ?? null);
          setMessage(null);
          return;
        }

        setAuth(null);
        setWarning(null);
        setMessage(payload.message ?? payload.error ?? null);
      } catch {
        setAuth(null);
        setWarning(null);
        setMessage('Failed to load auth status.');
      } finally {
        setLoading(false);
      }
    };

    void loadStatus();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Checking GitHub authentication...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Connect GitHub</CardTitle>
            <CardDescription>
              Studio tries `gh auth token` first, then `GITHUB_TOKEN`, then a
              Personal Access Token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TokenInput
              onAuthenticated={(nextAuth) => {
                setAuth(nextAuth);
                setMessage(null);
                setWarning(
                  nextAuth.missingScopes.length > 0
                    ? `Missing scopes: ${nextAuth.missingScopes.join(', ')}`
                    : null
                );
              }}
            />
            {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warning ? (
        <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
          {warning}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Authenticated as <span className="font-medium">{auth.user.login}</span>{' '}
        via {auth.method}.
      </p>
      {children}
    </div>
  );
}
