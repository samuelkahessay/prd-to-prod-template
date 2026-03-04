import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { GET } from '@/app/api/showcase/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';
import { listDirectory, readFile } from '@/lib/github/contents';

vi.mock('@/lib/auth/provider');
vi.mock('@/lib/github/client');
vi.mock('@/lib/github/contents');

const mockResolveAuthToken = resolveAuthToken as Mock;
const mockCreateOctokit = createGitHubClient as Mock;
const mockListDirectory = listDirectory as Mock;
const mockReadFile = readFile as Mock;

describe('GET /api/showcase', () => {
  const mockClient = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no auth token is found', async () => {
    mockResolveAuthToken.mockReturnValue(null);

    const request = new Request('http://localhost/api/showcase?owner=test&repo=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No GitHub authentication token found');
  });

  it('returns 400 when owner is missing', async () => {
    mockResolveAuthToken.mockReturnValue({ token: 'token123', method: 'gh-cli' });

    const request = new Request('http://localhost/api/showcase?repo=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required query params: owner, repo');
  });

  it('returns 400 when repo is missing', async () => {
    mockResolveAuthToken.mockReturnValue({ token: 'token123', method: 'gh-cli' });

    const request = new Request('http://localhost/api/showcase?owner=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required query params: owner, repo');
  });

  it('returns empty array when showcase directory does not exist', async () => {
    mockResolveAuthToken.mockReturnValue({ token: 'token123', method: 'gh-cli' });
    mockCreateOctokit.mockReturnValue(mockClient);
    mockListDirectory.mockRejectedValue({ status: 404 });

    const request = new Request('http://localhost/api/showcase?owner=test&repo=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entries).toEqual([]);
  });

  it('returns showcase entries when showcase directory exists', async () => {
    mockResolveAuthToken.mockReturnValue({ token: 'token123', method: 'gh-cli' });
    mockCreateOctokit.mockReturnValue(mockClient);

    mockListDirectory.mockResolvedValue([
      { name: '01-user-auth', type: 'dir' },
      { name: '02-payment-flow', type: 'dir' },
      { name: 'README.md', type: 'file' },
    ]);

    mockReadFile.mockImplementation((params) => {
      if (params.path === 'showcase/01-user-auth/README.md') {
        return Promise.resolve({
          type: 'file',
          content: Buffer.from(
            '# Run 01 — user-auth\n\n' +
              '**Tag**: [`v1.0.0`](https://github.com/test/test/tree/v1.0.0)\n' +
              '**Deployment**: [https://app.com](https://app.com)\n' +
              '**Date**: March 2026\n\n' +
              '## Stats\n\n' +
              '| Metric | Value |\n' +
              '|--------|-------|\n' +
              '| Pipeline issues | 5 |\n' +
              '| PRs merged | 4 |\n'
          ).toString('base64'),
        });
      }
      if (params.path === 'showcase/02-payment-flow/README.md') {
        return Promise.resolve({
          type: 'file',
          content: Buffer.from(
            '# Run 02 — payment-flow\n\n' +
              '**Tag**: [`v2.0.0`](https://github.com/test/test/tree/v2.0.0)\n' +
              '**Date**: April 2026\n\n' +
              '## Stats\n\n' +
              '| Metric | Value |\n' +
              '|--------|-------|\n' +
              '| Pipeline issues | 8 |\n' +
              '| PRs merged | 7 |\n'
          ).toString('base64'),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    const request = new Request('http://localhost/api/showcase?owner=test&repo=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entries).toHaveLength(2);

    expect(data.entries[0]).toEqual({
      slug: '01-user-auth',
      runNumber: '01',
      projectName: 'user-auth',
      title: 'Run 01 — user-auth',
      tag: 'v1.0.0',
      date: 'March 2026',
      deploymentUrl: 'https://app.com',
      issueCount: '5',
      prCount: '4',
    });

    expect(data.entries[1]).toEqual({
      slug: '02-payment-flow',
      runNumber: '02',
      projectName: 'payment-flow',
      title: 'Run 02 — payment-flow',
      tag: 'v2.0.0',
      date: 'April 2026',
      issueCount: '8',
      prCount: '7',
    });
  });

  it('skips entries with missing or invalid README.md', async () => {
    mockResolveAuthToken.mockReturnValue({ token: 'token123', method: 'gh-cli' });
    mockCreateOctokit.mockReturnValue(mockClient);

    mockListDirectory.mockResolvedValue([
      { name: '01-valid', type: 'dir' },
      { name: '02-invalid', type: 'dir' },
    ]);

    mockReadFile.mockImplementation((params) => {
      if (params.path === 'showcase/01-valid/README.md') {
        return Promise.resolve({
          type: 'file',
          content: Buffer.from(
            '# Run 01 — valid\n\n' +
              '**Tag**: [`v1.0.0`](https://github.com/test/test/tree/v1.0.0)\n' +
              '**Date**: March 2026\n'
          ).toString('base64'),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    const request = new Request('http://localhost/api/showcase?owner=test&repo=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].slug).toBe('01-valid');
  });

  it('returns 500 when GitHub API fails', async () => {
    mockResolveAuthToken.mockReturnValue({ token: 'token123', method: 'gh-cli' });
    mockCreateOctokit.mockReturnValue(mockClient);
    mockListDirectory.mockRejectedValue(new Error('API rate limit exceeded'));

    const request = new Request('http://localhost/api/showcase?owner=test&repo=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch showcase entries');
  });
});
