export interface RecentRepo {
  owner: string;
  repo: string;
  lastAccessed: number;
}

const STORAGE_KEY = "prd-to-prod-studio:recent-repos";
const MAX_RECENT_REPOS = 10;

/**
 * Get recently accessed repositories from localStorage
 */
export function getRecentRepos(): RecentRepo[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const repos = JSON.parse(stored) as RecentRepo[];
    return repos.sort((a, b) => b.lastAccessed - a.lastAccessed);
  } catch (error) {
    console.error("Failed to read recent repos from localStorage:", error);
    return [];
  }
}

/**
 * Add a repository to the recent repos list
 */
export function addRecentRepo(owner: string, repo: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getRecentRepos();
    
    const filtered = existing.filter(
      (r) => !(r.owner === owner && r.repo === repo)
    );
    
    const updated: RecentRepo[] = [
      { owner, repo, lastAccessed: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_REPOS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save recent repo to localStorage:", error);
  }
}

/**
 * Remove a repository from the recent repos list
 */
export function removeRecentRepo(owner: string, repo: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getRecentRepos();
    const filtered = existing.filter(
      (r) => !(r.owner === owner && r.repo === repo)
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove recent repo from localStorage:", error);
  }
}

/**
 * Clear all recent repos
 */
export function clearRecentRepos(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear recent repos from localStorage:", error);
  }
}
