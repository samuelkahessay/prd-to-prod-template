import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useRepoValidation } from '@/lib/queries/repo';

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

describe('useRepoValidation', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates repo successfully when valid', async () => {
    const mockValidation = {
      valid: true,
      missingWorkflows: [],
      hasWorkflows: true,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockValidation,
    });

    const { result } = renderHook(
      () => useRepoValidation('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockValidation);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/repo/validate'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: 'test-owner', repo: 'test-repo' }),
      })
    );
  });

  it('validates repo when missing workflows', async () => {
    const mockValidation = {
      valid: false,
      missingWorkflows: ['prd-decomposer', 'repo-assist'],
      hasWorkflows: true,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockValidation,
    });

    const { result } = renderHook(
      () => useRepoValidation('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockValidation);
    expect(result.current.data?.valid).toBe(false);
    expect(result.current.data?.missingWorkflows).toHaveLength(2);
  });

  it('does not fetch when owner or repo is null', () => {
    const { result } = renderHook(() => useRepoValidation(null, null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles fetch errors', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useRepoValidation('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('caches data with 5 minute stale time', async () => {
    const mockValidation = {
      valid: true,
      missingWorkflows: [],
      hasWorkflows: true,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockValidation,
    });

    const { result } = renderHook(
      () => useRepoValidation('test-owner', 'test-repo'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
  });
});
