'use client';

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Creates a new QueryClient instance with default configuration for the Studio.
 * 
 * Default settings:
 * - staleTime: 10s — Data considered fresh for 10 seconds
 * - refetchInterval: 10s — Auto-refetch every 10 seconds (can be overridden per query)
 * - refetchOnWindowFocus: true — Refetch when window regains focus
 * - retry: 1 — Retry failed queries once before giving up
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000, // 10 seconds
        refetchInterval: 10_000, // 10 seconds (default for most queries)
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}

/**
 * QueryClientProvider wrapper for the Studio app.
 * 
 * Provides TanStack Query client to all child components.
 * Each client instance is created once per render tree to prevent state sharing issues.
 */
export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}
