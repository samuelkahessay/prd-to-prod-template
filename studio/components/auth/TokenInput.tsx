'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { PublicAuthState } from '@/lib/auth/types';

interface TokenInputProps {
  onAuthenticated: (auth: PublicAuthState) => void;
}

interface TokenApiResponse {
  authenticated: boolean;
  auth?: PublicAuthState;
  error?: string;
  warning?: string | null;
}

const TOKEN_PATTERN = /^(ghp_|github_pat_).+/;

export function TokenInput({ onAuthenticated }: TokenInputProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenFormatHint = useMemo(() => {
    if (!token) {
      return null;
    }

    return TOKEN_PATTERN.test(token.trim())
      ? null
      : 'Token should start with ghp_ or github_pat_.';
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setWarning(null);

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Paste a Personal Access Token to continue.');
      return;
    }

    if (!TOKEN_PATTERN.test(trimmedToken)) {
      setError('Token format looks invalid.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: trimmedToken }),
      });

      const payload = (await response.json()) as TokenApiResponse;
      if (!response.ok || !payload.authenticated || !payload.auth) {
        setError(payload.error ?? 'Unable to authenticate with this token.');
        return;
      }

      setToken('');
      setWarning(payload.warning ?? null);
      onAuthenticated(payload.auth);
    } catch {
      setError('Unable to submit token right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium" htmlFor="pat-input">
        GitHub Personal Access Token
      </label>
      <input
        id="pat-input"
        data-testid="pat-input"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        placeholder="github_pat_..."
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Validating token...' : 'Use this token'}
      </Button>
      {tokenFormatHint ? (
        <p className="text-xs text-muted-foreground">{tokenFormatHint}</p>
      ) : null}
      {warning ? <p className="text-xs text-amber-600">{warning}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
