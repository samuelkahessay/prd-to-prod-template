export interface StudioSettings {
  pollingInterval: number;
  adaptivePolling: boolean;
  recentRepos: Array<{ owner: string; repo: string }>;
  theme: 'light' | 'dark' | 'system';
}

const STORAGE_KEY = 'prd-to-prod-studio-settings';
const DEFAULT_SETTINGS: StudioSettings = {
  pollingInterval: 10000,
  adaptivePolling: true,
  recentRepos: [],
  theme: 'system',
};

export function getSettings(): StudioSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<StudioSettings>;
    
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to read settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(partial: Partial<StudioSettings>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getSettings();
    const updated = {
      ...current,
      ...partial,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    window.dispatchEvent(new CustomEvent('studio-settings-changed'));
  } catch (error) {
    console.error('Failed to update settings in localStorage:', error);
  }
}

export function addRecentRepo(owner: string, repo: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const settings = getSettings();
    
    const filtered = settings.recentRepos.filter(
      (r) => !(r.owner === owner && r.repo === repo)
    );
    
    const updated = [{ owner, repo }, ...filtered].slice(0, 5);
    
    updateSettings({ recentRepos: updated });
  } catch (error) {
    console.error('Failed to add recent repo:', error);
  }
}
