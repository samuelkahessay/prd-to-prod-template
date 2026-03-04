import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/provider', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('@/lib/github/client', () => ({
  createGitHubClient: vi.fn(),
}));

import { POST } from '@/app/api/repo/validate/route';
import { resolveAuthToken } from '@/lib/auth/provider';
import { createGitHubClient } from '@/lib/github/client';

const mockedResolveAuthToken = vi.mocked(resolveAuthToken);
const mockedCreateOctokit = vi.mocked(createGitHubClient);

describe('POST /api/repo/validate', () => {
  beforeEach(() => {
    mockedResolveAuthToken.mockReset();
    mockedCreateOctokit.mockReset();
  });

  it('returns 401 when no auth token is found', async () => {
    mockedResolveAuthToken.mockReturnValue(null);

    const request = new Request('http://localhost/api/repo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: 'test', repo: 'repo' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain('authentication');
  });

  it('returns 400 when owner or repo is missing', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const request = new Request('http://localhost/api/repo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: 'test' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('owner, repo');
  });

  it('validates a prd-to-prod repo successfully', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const mockClient = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            status: 200,
            data: { type: 'file' },
          }),
        },
      },
    };

    mockedCreateOctokit.mockReturnValue(mockClient as never);

    const request = new Request('http://localhost/api/repo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: 'test', repo: 'prd-to-prod' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.valid).toBe(true);
    expect(payload.owner).toBe('test');
    expect(payload.repo).toBe('prd-to-prod');
    expect(payload.missing_workflows).toEqual([]);
    expect(payload.message).toContain('valid');

    expect(mockClient.rest.repos.getContent).toHaveBeenCalledTimes(3);
    expect(mockClient.rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'prd-to-prod',
      path: '.github/workflows/prd-decomposer.lock.yml',
    });
  });

  it('identifies missing workflow files', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const mockClient = {
      rest: {
        repos: {
          getContent: vi
            .fn()
            .mockResolvedValueOnce({ status: 200, data: { type: 'file' } })
            .mockRejectedValueOnce(new Error('Not Found'))
            .mockRejectedValueOnce(new Error('Not Found')),
        },
      },
    };

    mockedCreateOctokit.mockReturnValue(mockClient as never);

    const request = new Request('http://localhost/api/repo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: 'test', repo: 'incomplete' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.valid).toBe(false);
    expect(payload.missing_workflows).toContain('repo-assist.lock.yml');
    expect(payload.missing_workflows).toContain('review.lock.yml');
    expect(payload.message).toContain('Missing required workflow files');
  });

  it('returns 200 with invalid when all workflows are missing', async () => {
    mockedResolveAuthToken.mockReturnValue({
      token: 'test-token',
      method: 'env',
    });

    const mockClient = {
      rest: {
        repos: {
          getContent: vi.fn().mockRejectedValue(new Error('Not Found')),
        },
      },
    };

    mockedCreateOctokit.mockReturnValue(mockClient as never);

    const request = new Request('http://localhost/api/repo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: 'test', repo: 'nonexistent' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.valid).toBe(false);
    expect(payload.missing_workflows).toHaveLength(3);
  });
});
