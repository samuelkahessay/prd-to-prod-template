import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdaptivePolling } from '@/lib/hooks/use-polling';
import * as rateLimitContext from '@/lib/rate-limit/context';

vi.mock('@/lib/rate-limit/context', () => ({
  useRateLimit: vi.fn(),
}));

describe('useAdaptivePolling', () => {
  const baseInterval = 10000;

  it('returns baseInterval when rate limit is normal', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 4000,
      limit: 5000,
      resetAt: null,
      usagePercent: 20,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    const { result } = renderHook(() => useAdaptivePolling(baseInterval));
    expect(result.current).toBe(baseInterval);
  });

  it('returns baseInterval * 2 when rate limit is warning', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 750,
      limit: 5000,
      resetAt: null,
      usagePercent: 85,
      level: 'warning',
      updateRateLimit: vi.fn(),
    });

    const { result } = renderHook(() => useAdaptivePolling(baseInterval));
    expect(result.current).toBe(baseInterval * 2);
  });

  it('returns baseInterval * 4 when rate limit is critical', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 250,
      limit: 5000,
      resetAt: null,
      usagePercent: 95,
      level: 'critical',
      updateRateLimit: vi.fn(),
    });

    const { result } = renderHook(() => useAdaptivePolling(baseInterval));
    expect(result.current).toBe(baseInterval * 4);
  });

  it('returns false when rate limit is exhausted', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 0,
      limit: 5000,
      resetAt: null,
      usagePercent: 100,
      level: 'exhausted',
      updateRateLimit: vi.fn(),
    });

    const { result } = renderHook(() => useAdaptivePolling(baseInterval));
    expect(result.current).toBe(false);
  });

  it('resumes normal interval when rate limit recovers', () => {
    const mockUseRateLimit = vi.mocked(rateLimitContext.useRateLimit);
    
    mockUseRateLimit.mockReturnValue({
      remaining: 0,
      limit: 5000,
      resetAt: null,
      usagePercent: 100,
      level: 'exhausted',
      updateRateLimit: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useAdaptivePolling(baseInterval));
    expect(result.current).toBe(false);

    mockUseRateLimit.mockReturnValue({
      remaining: 4000,
      limit: 5000,
      resetAt: null,
      usagePercent: 20,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    rerender();
    expect(result.current).toBe(baseInterval);
  });
});
