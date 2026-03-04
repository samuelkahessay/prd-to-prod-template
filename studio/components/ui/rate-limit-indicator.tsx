"use client";

import { useRateLimit } from '@/lib/rate-limit/context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function RateLimitIndicator() {
  const { remaining, limit, usagePercent } = useRateLimit();

  // Don't show anything if we don't have rate limit data yet
  if (limit === 5000 && remaining === 5000) {
    return null;
  }

  const remainingPercent = 100 - usagePercent;

  // Determine color based on remaining percentage
  const colorClass = 
    remainingPercent > 50 ? 'text-green-500' :
    remainingPercent > 20 ? 'text-yellow-500' :
    remainingPercent > 10 ? 'text-orange-500' :
    'text-red-500';

  return (
    <Badge 
      variant="outline" 
      className={cn("font-mono tabular-nums", colorClass)}
      data-testid="rate-limit-indicator"
    >
      {remaining} / {limit}
    </Badge>
  );
}
