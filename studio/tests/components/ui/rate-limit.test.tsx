import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RateLimitIndicator } from '@/components/ui/rate-limit-indicator';
import { RateLimitBanner } from '@/components/ui/rate-limit-banner';
import * as rateLimitContext from '@/lib/rate-limit/context';

vi.mock('@/lib/rate-limit/context', () => ({
  useRateLimit: vi.fn(),
}));

describe('RateLimitIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows green for >50% remaining', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 4000,
      limit: 5000,
      resetAt: null,
      usagePercent: 20,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitIndicator />);
    const indicator = screen.getByTestId('rate-limit-indicator');
    
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-green-500');
    expect(indicator).toHaveTextContent('4000 / 5000');
  });

  it('shows red for <10% remaining', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 250,
      limit: 5000,
      resetAt: null,
      usagePercent: 95,
      level: 'critical',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitIndicator />);
    const indicator = screen.getByTestId('rate-limit-indicator');
    
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-red-500');
    expect(indicator).toHaveTextContent('250 / 5000');
  });

  it('shows yellow for 20-50% remaining', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 1500,
      limit: 5000,
      resetAt: null,
      usagePercent: 70,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitIndicator />);
    const indicator = screen.getByTestId('rate-limit-indicator');
    
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-yellow-500');
  });

  it('shows orange for 10-20% remaining', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 750,
      limit: 5000,
      resetAt: null,
      usagePercent: 85,
      level: 'warning',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitIndicator />);
    const indicator = screen.getByTestId('rate-limit-indicator');
    
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-orange-500');
  });

  it('shows correct format "{remaining} / {limit}"', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 1234,
      limit: 5678,
      resetAt: null,
      usagePercent: 78,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitIndicator />);
    expect(screen.getByText('1234 / 5678')).toBeInTheDocument();
  });

  it('does not render when no rate limit data available', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 5000,
      limit: 5000,
      resetAt: null,
      usagePercent: 0,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    const { container } = render(<RateLimitIndicator />);
    expect(container.firstChild).toBeNull();
  });
});

describe('RateLimitBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show banner for normal level', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 4000,
      limit: 5000,
      resetAt: null,
      usagePercent: 20,
      level: 'normal',
      updateRateLimit: vi.fn(),
    });

    const { container } = render(<RateLimitBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows warning banner at warning threshold', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 750,
      limit: 5000,
      resetAt: null,
      usagePercent: 85,
      level: 'warning',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitBanner />);
    const banner = screen.getByTestId('rate-limit-banner');
    
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('API rate limit getting low. Polling has been slowed.');
  });

  it('shows critical banner at critical threshold', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 250,
      limit: 5000,
      resetAt: null,
      usagePercent: 95,
      level: 'critical',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitBanner />);
    const banner = screen.getByTestId('rate-limit-banner');
    
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('API rate limit critically low. Polling significantly reduced.');
  });

  it('shows countdown when exhausted', async () => {
    const resetAt = new Date(Date.now() + 3600000);
    
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 0,
      limit: 5000,
      resetAt,
      usagePercent: 100,
      level: 'exhausted',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitBanner />);
    const banner = screen.getByTestId('rate-limit-banner');
    
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/API rate limit exceeded. Polling paused. Resets in/);
  });

  it('dismiss button works on warning banner', async () => {
    const user = userEvent.setup();
    
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 750,
      limit: 5000,
      resetAt: null,
      usagePercent: 85,
      level: 'warning',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitBanner />);
    
    const banner = screen.getByTestId('rate-limit-banner');
    expect(banner).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /dismiss banner/i });
    await user.click(dismissButton);

    expect(screen.queryByTestId('rate-limit-banner')).not.toBeInTheDocument();
  });

  it('banner persists without dismiss button on critical level', () => {
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 250,
      limit: 5000,
      resetAt: null,
      usagePercent: 95,
      level: 'critical',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitBanner />);
    
    const banner = screen.getByTestId('rate-limit-banner');
    expect(banner).toBeInTheDocument();
    
    expect(screen.queryByRole('button', { name: /dismiss banner/i })).not.toBeInTheDocument();
  });

  it('banner persists without dismiss button on exhausted level', () => {
    const resetAt = new Date(Date.now() + 3600000);
    
    vi.mocked(rateLimitContext.useRateLimit).mockReturnValue({
      remaining: 0,
      limit: 5000,
      resetAt,
      usagePercent: 100,
      level: 'exhausted',
      updateRateLimit: vi.fn(),
    });

    render(<RateLimitBanner />);
    
    const banner = screen.getByTestId('rate-limit-banner');
    expect(banner).toBeInTheDocument();
    
    expect(screen.queryByRole('button', { name: /dismiss banner/i })).not.toBeInTheDocument();
  });
});
