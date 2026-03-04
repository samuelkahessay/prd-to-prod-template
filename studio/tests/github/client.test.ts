import { Octokit } from '@octokit/rest';
import { describe, expect, it, vi } from 'vitest';

import { createOctokit } from '@/lib/github/client';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(function MockOctokit() {
    return { request: vi.fn() };
  }),
}));

describe('createOctokit', () => {
  it('creates an Octokit instance with a token', () => {
    const mockedOctokit = vi.mocked(Octokit);

    const client = createOctokit('ghp_token');

    expect(client).toBeTruthy();
    expect(mockedOctokit).toHaveBeenCalledWith({ auth: 'ghp_token' });
  });

  it('throws when token is empty', () => {
    expect(() => createOctokit('   ')).toThrow('GitHub token is required');
  });
});
