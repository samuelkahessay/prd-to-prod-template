"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface RateLimitState {
  remaining: number;
  limit: number;
  resetAt: Date | null;
  usagePercent: number;   // 0-100
  level: 'normal' | 'warning' | 'critical' | 'exhausted';
}

interface RateLimitContextValue extends RateLimitState {
  updateRateLimit: (remaining: number, limit: number, reset: number) => void;
}

const RateLimitContext = createContext<RateLimitContextValue | null>(null);

function calculateLevel(usagePercent: number): RateLimitState['level'] {
  const remainingPercent = 100 - usagePercent;
  
  if (remainingPercent === 0) return 'exhausted';
  if (remainingPercent <= 10) return 'critical';
  if (remainingPercent <= 20) return 'warning';
  return 'normal';
}

interface RateLimitProviderProps {
  children: ReactNode;
}

export function RateLimitProvider({ children }: RateLimitProviderProps) {
  const [state, setState] = useState<RateLimitState>({
    remaining: 5000,
    limit: 5000,
    resetAt: null,
    usagePercent: 0,
    level: 'normal',
  });

  const updateRateLimit = useCallback((remaining: number, limit: number, reset: number) => {
    const usagePercent = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
    const level = calculateLevel(usagePercent);
    const resetAt = new Date(reset * 1000);

    setState({
      remaining,
      limit,
      resetAt,
      usagePercent,
      level,
    });
  }, []);

  const value: RateLimitContextValue = {
    ...state,
    updateRateLimit,
  };

  return (
    <RateLimitContext.Provider value={value}>
      {children}
    </RateLimitContext.Provider>
  );
}

export function useRateLimit(): RateLimitContextValue {
  const context = useContext(RateLimitContext);
  
  if (!context) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  
  return context;
}
