import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getRecentRepos,
  addRecentRepo,
  removeRecentRepo,
  clearRecentRepos,
  type RecentRepo,
} from "@/lib/repo/storage";

const STORAGE_KEY = "prd-to-prod-studio:recent-repos";

describe("repo/storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("getRecentRepos", () => {
    it("returns empty array when no repos stored", () => {
      expect(getRecentRepos()).toEqual([]);
    });

    it("returns stored repos sorted by lastAccessed desc", () => {
      const repos: RecentRepo[] = [
        { owner: "user1", repo: "repo1", lastAccessed: 1000 },
        { owner: "user2", repo: "repo2", lastAccessed: 3000 },
        { owner: "user3", repo: "repo3", lastAccessed: 2000 },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));

      const result = getRecentRepos();
      expect(result).toHaveLength(3);
      expect(result[0].owner).toBe("user2");
      expect(result[1].owner).toBe("user3");
      expect(result[2].owner).toBe("user1");
    });

    it("handles invalid JSON gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "invalid json");
      expect(getRecentRepos()).toEqual([]);
    });
  });

  describe("addRecentRepo", () => {
    it("adds new repo to empty list", () => {
      addRecentRepo("owner", "repo");

      const repos = getRecentRepos();
      expect(repos).toHaveLength(1);
      expect(repos[0]).toMatchObject({ owner: "owner", repo: "repo" });
      expect(repos[0].lastAccessed).toBeGreaterThan(0);
    });

    it("moves existing repo to front with updated timestamp", () => {
      addRecentRepo("owner1", "repo1");
      const firstTimestamp = getRecentRepos()[0].lastAccessed;

      addRecentRepo("owner2", "repo2");
      addRecentRepo("owner1", "repo1");

      const repos = getRecentRepos();
      expect(repos).toHaveLength(2);
      expect(repos[0]).toMatchObject({ owner: "owner1", repo: "repo1" });
      expect(repos[0].lastAccessed).toBeGreaterThanOrEqual(firstTimestamp);
      expect(repos[1]).toMatchObject({ owner: "owner2", repo: "repo2" });
    });

    it("limits to 10 most recent repos", () => {
      for (let i = 1; i <= 12; i++) {
        addRecentRepo(`owner${i}`, `repo${i}`);
      }

      const repos = getRecentRepos();
      expect(repos).toHaveLength(10);
      expect(repos[0]).toMatchObject({ owner: "owner12", repo: "repo12" });
      expect(repos[9]).toMatchObject({ owner: "owner3", repo: "repo3" });
    });
  });

  describe("removeRecentRepo", () => {
    it("removes specified repo from list", () => {
      addRecentRepo("owner1", "repo1");
      addRecentRepo("owner2", "repo2");
      addRecentRepo("owner3", "repo3");

      removeRecentRepo("owner2", "repo2");

      const repos = getRecentRepos();
      expect(repos).toHaveLength(2);
      expect(repos.find((r) => r.owner === "owner2")).toBeUndefined();
    });

    it("does nothing if repo not found", () => {
      addRecentRepo("owner1", "repo1");
      removeRecentRepo("nonexistent", "repo");

      const repos = getRecentRepos();
      expect(repos).toHaveLength(1);
    });
  });

  describe("clearRecentRepos", () => {
    it("removes all stored repos", () => {
      addRecentRepo("owner1", "repo1");
      addRecentRepo("owner2", "repo2");

      clearRecentRepos();

      expect(getRecentRepos()).toEqual([]);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
