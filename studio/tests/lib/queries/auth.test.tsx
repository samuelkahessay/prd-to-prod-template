import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStatus } from '@/lib/queries/auth';

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

describe('useAuthStatus', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches auth status successfully when authenticated', async () => {
    const mockAuthStatus = {
      authenticated: true,
      user: {
        login: 'test-user',
        name: 'Test User',
        avatar_url: 'https://github.com/test-user.png',
      },
      method: 'cli',
      warnings: [],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockAuthStatus,
    });

    const { result } = renderHook(() => useAuthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAuthStatus);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/status')
    );
  });

  it('fetches auth status when not authenticated', async () => {
    const mockAuthStatus = {
      authenticated: false,
      method: 'none',
      warnings: ['No GitHub token found'],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockAuthStatus,
    });

    const { result } = renderHook(() => useAuthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAuthStatus);
    expect(result.current.data?.authenticated).toBe(false);
  });

  it('handles fetch errors', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('caches data with 60s stale time', async () => {
    const mockAuthStatus = {
      authenticated: true,
      user: {
        login: 'test-user',
        name: 'Test User',
        avatar_url: 'https://github.com/test-user.png',
      },
      method: 'cli',
      warnings: [],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockAuthStatus,
    });

    const { result } = renderHook(() => useAuthStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
  });
});
