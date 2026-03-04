import { Octokit } from '@octokit/rest';
import { describe, expect, it, vi } from 'vitest';

import { createGitHubClient } from '@/lib/github/client';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(function MockOctokit() {
    return { request: vi.fn() };
  }),
}));

describe('createGitHubClient', () => {
  it('creates an Octokit instance with a token', () => {
    const mockedOctokit = vi.mocked(Octokit);

    const client = createGitHubClient('ghp_token');

    expect(client).toBeTruthy();
    expect(mockedOctokit).toHaveBeenCalledWith({ auth: 'ghp_token' });
  });

  it('throws when token is empty', () => {
    expect(() => createGitHubClient('   ')).toThrow('GitHub token is required');
  });
});
