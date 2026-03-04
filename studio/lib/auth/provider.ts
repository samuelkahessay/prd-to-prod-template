import * as childProcess from 'node:child_process';

import type { ResolvedAuthToken } from '@/lib/auth/types';

const BROWSER_PAT_KEY = 'browser-pat';
const browserTokenStore = new Map<string, string>();

function sanitizeToken(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const token = value.trim();
  return token.length > 0 ? token : null;
}

function resolveGhCliToken(): string | null {
  if (typeof window !== 'undefined' && process.env.VITEST !== 'true') {
    return null;
  }

  try {
    const token = childProcess.execSync('gh auth token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1500,
      maxBuffer: 16 * 1024,
    });

    return sanitizeToken(token);
  } catch {
    return null;
  }
}

function resolveEnvToken(): string | null {
  return sanitizeToken(process.env.GITHUB_TOKEN);
}

function resolvePatToken(): string | null {
  return sanitizeToken(browserTokenStore.get(BROWSER_PAT_KEY));
}

export function setBrowserPatToken(token: string): void {
  const sanitized = sanitizeToken(token);

  if (!sanitized) {
    browserTokenStore.delete(BROWSER_PAT_KEY);
    return;
  }

  browserTokenStore.set(BROWSER_PAT_KEY, sanitized);
}

export function clearBrowserPatToken(): void {
  browserTokenStore.delete(BROWSER_PAT_KEY);
}

export function resolveAuthToken(): ResolvedAuthToken | null {
  const ghCliToken = resolveGhCliToken();
  if (ghCliToken) {
    return { token: ghCliToken, method: 'gh-cli' };
  }

  const envToken = resolveEnvToken();
  if (envToken) {
    return { token: envToken, method: 'env' };
  }

  const patToken = resolvePatToken();
  if (patToken) {
    return { token: patToken, method: 'pat' };
  }

  return null;
}
