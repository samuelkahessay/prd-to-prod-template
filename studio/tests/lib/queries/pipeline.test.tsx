import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  usePipelineIssues,
  usePipelinePRs,
  usePipelineWorkflows,
  usePipelineDeployments,
  usePipelineOverview,
  useIssueDetail,
  usePRDetail,
} from '@/lib/queries/pipeline';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePipelineIssues', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches issues successfully', async () => {
    const mockIssues = [
      {
        id: '1',
        number: 1,
        title: 'Test Issue',
        state: 'open',
        labels: [],
        dependencies: [],
        assignee: null,
        created_at: '2026-03-03T00:00:00Z',
        updated_at: '2026-03-03T00:00:00Z',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ issues: mockIssues, rateLimitRemaining: 5000 }),
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => usePipelineIssues('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ issues: mockIssues, rateLimitRemaining: 5000 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/pipeline/issues?owner=test-owner&repo=test-repo')
    );
  });

  it('does not fetch when owner or repo is null', () => {
    const { result } = renderHook(() => usePipelineIssues(null, null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles fetch errors', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => usePipelineIssues('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('usePipelinePRs', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches PRs successfully', async () => {
    const mockPRs = [
      {
        id: '1',
        number: 1,
        title: 'Test PR',
        state: 'open',
        linked_issue: null,
        reviews: [],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ pull_requests: mockPRs, rateLimitRemaining: 5000 }),
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => usePipelinePRs('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ pull_requests: mockPRs, rateLimitRemaining: 5000 });
  });

  it('does not fetch when owner or repo is null', () => {
    const { result } = renderHook(() => usePipelinePRs(null, 'test-repo'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('usePipelineWorkflows', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches workflows successfully', async () => {
    const mockWorkflows = [
      {
        id: '1',
        name: 'Test Workflow',
        status: 'completed',
        conclusion: 'success',
        started_at: '2026-03-03T00:00:00Z',
        completed_at: '2026-03-03T00:05:00Z',
        url: 'https://github.com/test-owner/test-repo/actions/runs/1',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ workflows: mockWorkflows, rateLimitRemaining: 5000 }),
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => usePipelineWorkflows('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ workflows: mockWorkflows, rateLimitRemaining: 5000 });
  });
});

describe('usePipelineDeployments', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches deployments successfully', async () => {
    const mockDeployments = [
      {
        id: '1',
        environment: 'production',
        status: 'success',
        url: 'https://example.com',
        created_at: '2026-03-03T00:00:00Z',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ deployments: mockDeployments, rateLimitRemaining: 5000 }),
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => usePipelineDeployments('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ deployments: mockDeployments, rateLimitRemaining: 5000 });
  });
});

describe('usePipelineOverview', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches overview data successfully', async () => {
    const mockOverview = {
      issues: [],
      pull_requests: [],
      workflows: [],
      deployments: [],
      rateLimitRemaining: 5000,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockOverview,
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => usePipelineOverview('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockOverview);
  });
});

describe('useIssueDetail', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches issue detail successfully', async () => {
    const mockDetail = {
      issue: {
        id: '1',
        number: 1,
        title: 'Test Issue',
        state: 'open',
        labels: [],
        dependencies: [],
        assignee: null,
        created_at: '2026-03-03T00:00:00Z',
        updated_at: '2026-03-03T00:00:00Z',
      },
      comments: [
        {
          id: '1',
          author: 'test-user',
          body: 'Test comment',
          created_at: '2026-03-03T00:01:00Z',
        },
      ],
      rateLimitRemaining: 5000,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => useIssueDetail('test-owner', 'test-repo', 1),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDetail);
  });

  it('does not fetch when number is null', () => {
    const { result } = renderHook(
      () => useIssueDetail('test-owner', 'test-repo', null),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
  });
});

describe('usePRDetail', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches PR detail successfully', async () => {
    const mockDetail = {
      pull: {
        id: '1',
        number: 1,
        title: 'Test PR',
        state: 'open',
        linked_issue: null,
        reviews: [],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
      reviews: [
        {
          id: '1',
          reviewer: 'test-reviewer',
          state: 'APPROVED',
          submitted_at: '2026-03-03T00:01:00Z',
        },
      ],
      rateLimitRemaining: 5000,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
      headers: new Map([['X-RateLimit-Remaining', '5000']]),
    });

    const { result } = renderHook(
      () => usePRDetail('test-owner', 'test-repo', 1),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDetail);
  });

  it('does not fetch when number is null', () => {
    const { result } = renderHook(
      () => usePRDetail('test-owner', 'test-repo', null),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
  });
});
