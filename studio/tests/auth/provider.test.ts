import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearBrowserPatToken,
  resolveAuthToken,
  setBrowserPatToken,
} from '@/lib/auth/provider';

vi.mock(import('node:child_process'), async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();

  return {
    ...actual,
    default: actual,
    execSync: vi.fn(),
  };
});

import { execSync } from 'node:child_process';

const mockedExecSync = vi.mocked(execSync);

describe('resolveAuthToken', () => {
  const originalEnvToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    mockedExecSync.mockReset();
    clearBrowserPatToken();
    delete process.env.GITHUB_TOKEN;
  });

  it('prefers gh auth token over env and PAT', () => {
    mockedExecSync.mockReturnValue('gh-cli-token\n' as never);
    process.env.GITHUB_TOKEN = 'env-token';
    setBrowserPatToken('pat-token');

    expect(resolveAuthToken()).toEqual({ token: 'gh-cli-token', method: 'gh-cli' });
  });

  it('falls back to GITHUB_TOKEN when gh auth token fails', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('gh unavailable');
    });
    process.env.GITHUB_TOKEN = 'env-token';

    expect(resolveAuthToken()).toEqual({ token: 'env-token', method: 'env' });
  });

  it('falls back to browser PAT when gh and env are unavailable', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('gh unavailable');
    });
    setBrowserPatToken('pat-token');

    expect(resolveAuthToken()).toEqual({ token: 'pat-token', method: 'pat' });
  });

  it('returns null when no auth source is available', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('gh unavailable');
    });

    expect(resolveAuthToken()).toBeNull();
  });

  it('clears PAT when empty token is set', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('gh unavailable');
    });
    setBrowserPatToken('pat-token');
    setBrowserPatToken('   ');

    expect(resolveAuthToken()).toBeNull();
  });

  afterAll(() => {
    if (originalEnvToken === undefined) {
      delete process.env.GITHUB_TOKEN;
      return;
    }

    process.env.GITHUB_TOKEN = originalEnvToken;
  });
});
