import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from '@/app/(dashboard)/settings/page';
import { getSettings, updateSettings, addRecentRepo } from '@/lib/settings/storage';

const mockRepoContext = {
  currentRepo: null,
  setRepo: () => {},
  clearRepo: () => {},
};

vi.mock('@/lib/repo/context', () => ({
  useRepo: () => mockRepoContext,
}));

vi.mock('@/lib/queries/auth', () => ({
  useAuthStatus: () => ({
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
  }),
}));

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all sections', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Connected Repository')).toBeInTheDocument();
    expect(screen.getByText('Polling')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('displays version information', () => {
    render(<SettingsPage />);
    expect(screen.getByText('0.1.0')).toBeInTheDocument();
  });
});

describe('Settings Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when localStorage is empty', () => {
    const settings = getSettings();
    expect(settings).toEqual({
      pollingInterval: 10000,
      adaptivePolling: true,
      recentRepos: [],
      theme: 'system',
    });
  });

  it('updates settings in localStorage', () => {
    updateSettings({ pollingInterval: 15000 });
    const settings = getSettings();
    expect(settings.pollingInterval).toBe(15000);
  });

  it('persists settings across function calls', () => {
    updateSettings({ pollingInterval: 20000, adaptivePolling: false });
    const settings = getSettings();
    expect(settings.pollingInterval).toBe(20000);
    expect(settings.adaptivePolling).toBe(false);
  });

  it('merges partial updates with existing settings', () => {
    updateSettings({ pollingInterval: 15000 });
    updateSettings({ adaptivePolling: false });
    const settings = getSettings();
    expect(settings.pollingInterval).toBe(15000);
    expect(settings.adaptivePolling).toBe(false);
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('prd-to-prod-studio-settings', 'invalid json');
    const settings = getSettings();
    expect(settings).toEqual({
      pollingInterval: 10000,
      adaptivePolling: true,
      recentRepos: [],
      theme: 'system',
    });
  });
});

describe('Recent Repos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds repo to recent list', () => {
    addRecentRepo('owner1', 'repo1');
    const settings = getSettings();
    expect(settings.recentRepos).toHaveLength(1);
    expect(settings.recentRepos[0]).toEqual({ owner: 'owner1', repo: 'repo1' });
  });

  it('deduplicates repos', () => {
    addRecentRepo('owner1', 'repo1');
    addRecentRepo('owner2', 'repo2');
    addRecentRepo('owner1', 'repo1');
    const settings = getSettings();
    expect(settings.recentRepos).toHaveLength(2);
    expect(settings.recentRepos[0]).toEqual({ owner: 'owner1', repo: 'repo1' });
  });

  it('caps recent repos at 5', () => {
    for (let i = 1; i <= 7; i++) {
      addRecentRepo(`owner${i}`, `repo${i}`);
    }
    const settings = getSettings();
    expect(settings.recentRepos).toHaveLength(5);
    expect(settings.recentRepos[0]).toEqual({ owner: 'owner7', repo: 'repo7' });
    expect(settings.recentRepos[4]).toEqual({ owner: 'owner3', repo: 'repo3' });
  });

  it('moves existing repo to front when re-added', () => {
    addRecentRepo('owner1', 'repo1');
    addRecentRepo('owner2', 'repo2');
    addRecentRepo('owner3', 'repo3');
    addRecentRepo('owner1', 'repo1');
    const settings = getSettings();
    expect(settings.recentRepos).toHaveLength(3);
    expect(settings.recentRepos[0]).toEqual({ owner: 'owner1', repo: 'repo1' });
  });
});
