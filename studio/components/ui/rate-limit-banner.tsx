"use client";

import { useState, useEffect } from 'react';
import { useRateLimit } from '@/lib/rate-limit/context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, AlertTriangle, AlertCircle, OctagonX } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTimeRemaining(resetAt: Date): string {
  const now = new Date();
  const diff = resetAt.getTime() - now.getTime();
  
  if (diff <= 0) return '0s';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function RateLimitBanner() {
  const { level, resetAt } = useRateLimit();
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Update countdown every second for exhausted state
  useEffect(() => {
    if (level === 'exhausted' && resetAt) {
      const updateCountdown = () => {
        setCountdown(formatTimeRemaining(resetAt));
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(interval);
    }
  }, [level, resetAt]);

  // Reset dismissal when level changes to critical or exhausted
  useEffect(() => {
    if (level === 'critical' || level === 'exhausted') {
      setDismissed(false);
    }
  }, [level]);

  // Don't show banner for normal level or if dismissed
  if (level === 'normal' || (dismissed && level === 'warning')) {
    return null;
  }

  // Configuration for each level
  const config = {
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
      textColor: 'text-yellow-900 dark:text-yellow-200',
      message: 'API rate limit getting low. Polling has been slowed.',
      dismissible: true,
    },
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-500',
      textColor: 'text-orange-900 dark:text-orange-200',
      message: 'API rate limit critically low. Polling significantly reduced.',
      dismissible: false,
    },
    exhausted: {
      icon: OctagonX,
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-900',
      iconColor: 'text-red-600 dark:text-red-500',
      textColor: 'text-red-900 dark:text-red-200',
      message: `API rate limit exceeded. Polling paused. Resets in ${countdown}.`,
      dismissible: false,
    },
  };

  const current = config[level as keyof typeof config];
  if (!current) return null;

  const Icon = current.icon;

  return (
    <Card 
      className={cn(
        "w-full rounded-lg border p-4",
        current.bgColor,
        current.borderColor
      )}
      data-testid="rate-limit-banner"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", current.iconColor)} />
        <div className="flex-1">
          <p className={cn("text-sm font-medium", current.textColor)}>
            {current.message}
          </p>
        </div>
        {current.dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 w-6 p-0", current.iconColor)}
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
