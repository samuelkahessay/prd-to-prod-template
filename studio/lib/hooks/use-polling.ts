import { useRateLimit } from '@/lib/rate-limit/context';

/**
 * Adaptive polling hook that adjusts refetch intervals based on GitHub rate limit status.
 * 
 * Returns an adjusted interval or false to stop polling entirely:
 * - normal (>20% remaining): baseInterval
 * - warning (10-20% remaining): baseInterval * 2
 * - critical (1-10% remaining): baseInterval * 4
 * - exhausted (0% remaining): false (stops polling)
 * 
 * @param baseInterval - The default polling interval in milliseconds
 * @returns Adjusted interval in milliseconds, or false to stop polling
 */
export function useAdaptivePolling(baseInterval: number): number | false {
  const { level } = useRateLimit();

  switch (level) {
    case 'normal':
      return baseInterval;
    case 'warning':
      return baseInterval * 2;
    case 'critical':
      return baseInterval * 4;
    case 'exhausted':
      return false;
    default:
      return baseInterval;
  }
}
