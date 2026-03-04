import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthSettings } from '@/components/settings/AuthSettings';

const mockUseAuthStatus = vi.fn();

vi.mock('@/lib/queries/auth', () => ({
  useAuthStatus: () => mockUseAuthStatus(),
}));

describe('AuthSettings', () => {
  it('shows loading state', () => {
    mockUseAuthStatus.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText('Loading authentication status...')).toBeInTheDocument();
  });

  it('shows token input when not authenticated', () => {
    mockUseAuthStatus.mockReturnValue({
      data: { authenticated: false },
      isLoading: false,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText('Connect GitHub')).toBeInTheDocument();
    expect(
      screen.getByText(/Studio tries GitHub CLI first, then GITHUB_TOKEN/)
    ).toBeInTheDocument();
  });

  it('shows auth method when authenticated via GitHub CLI', () => {
    mockUseAuthStatus.mockReturnValue({
      data: {
        authenticated: true,
        user: {
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        method: 'gh-cli',
        warnings: [],
      },
      isLoading: false,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('GitHub CLI')).toBeInTheDocument();
    expect(screen.getByText('All required scopes present')).toBeInTheDocument();
  });

  it('shows auth method when authenticated via environment variable', () => {
    mockUseAuthStatus.mockReturnValue({
      data: {
        authenticated: true,
        user: {
          login: 'envuser',
          name: null,
          avatar_url: '',
        },
        method: 'env',
        warnings: [],
      },
      isLoading: false,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText('envuser')).toBeInTheDocument();
    expect(screen.getByText('Environment Variable (.env)')).toBeInTheDocument();
    expect(screen.getByText(/Authenticated via Environment Variable/)).toBeInTheDocument();
  });

  it('shows token input for browser PAT method', () => {
    mockUseAuthStatus.mockReturnValue({
      data: {
        authenticated: true,
        user: {
          login: 'patuser',
          name: 'PAT User',
          avatar_url: 'https://example.com/pat-avatar.jpg',
        },
        method: 'pat',
        warnings: [],
      },
      isLoading: false,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText('patuser')).toBeInTheDocument();
    expect(screen.getByText('Browser Token (PAT)')).toBeInTheDocument();
    expect(screen.getByText('Update your token below:')).toBeInTheDocument();
  });

  it('shows warning when scopes are missing', () => {
    mockUseAuthStatus.mockReturnValue({
      data: {
        authenticated: true,
        user: {
          login: 'warnuser',
          name: 'Warning User',
          avatar_url: 'https://example.com/warn-avatar.jpg',
        },
        method: 'gh-cli',
        warnings: ['workflow'],
      },
      isLoading: false,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText(/Missing scopes: workflow/)).toBeInTheDocument();
  });

  it('handles user without name', () => {
    mockUseAuthStatus.mockReturnValue({
      data: {
        authenticated: true,
        user: {
          login: 'noname',
          name: null,
          avatar_url: '',
        },
        method: 'gh-cli',
        warnings: [],
      },
      isLoading: false,
      error: null,
    });

    render(<AuthSettings />);
    expect(screen.getByText('noname')).toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });
});
