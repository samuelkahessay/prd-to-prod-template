import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, renderHook, act, waitFor } from "@testing-library/react";
import { RepoProvider, useRepo } from "@/lib/repo/context";
import * as storage from "@/lib/repo/storage";

vi.mock("@/lib/repo/storage", () => ({
  addRecentRepo: vi.fn(),
  getRecentRepos: vi.fn(() => []),
  removeRecentRepo: vi.fn(),
  clearRecentRepos: vi.fn(),
}));

describe("repo/context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("RepoProvider", () => {
    it("provides repo context to children", () => {
      render(
        <RepoProvider>
          <div>Test content</div>
        </RepoProvider>
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("restores current repo from localStorage on mount", async () => {
      const storedRepo = { owner: "test-owner", repo: "test-repo" };
      localStorage.setItem(
        "prd-to-prod-studio:current-repo",
        JSON.stringify(storedRepo)
      );

      const { result } = renderHook(() => useRepo(), {
        wrapper: RepoProvider,
      });

      await waitFor(() => {
        expect(result.current.currentRepo).toEqual(storedRepo);
      });
    });

    it("starts with null when no stored repo", () => {
      const { result } = renderHook(() => useRepo(), {
        wrapper: RepoProvider,
      });

      expect(result.current.currentRepo).toBeNull();
    });
  });

  describe("useRepo", () => {
    it("throws error when used outside RepoProvider", () => {
      expect(() => {
        renderHook(() => useRepo());
      }).toThrow("useRepo must be used within a RepoProvider");
    });

    it("setRepo updates current repo and stores in localStorage", () => {
      const { result } = renderHook(() => useRepo(), {
        wrapper: RepoProvider,
      });

      act(() => {
        result.current.setRepo("new-owner", "new-repo");
      });

      expect(result.current.currentRepo).toEqual({
        owner: "new-owner",
        repo: "new-repo",
      });

      const stored = localStorage.getItem("prd-to-prod-studio:current-repo");
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual({
        owner: "new-owner",
        repo: "new-repo",
      });

      expect(storage.addRecentRepo).toHaveBeenCalledWith("new-owner", "new-repo");
    });

    it("clearRepo removes current repo and clears localStorage", () => {
      const { result } = renderHook(() => useRepo(), {
        wrapper: RepoProvider,
      });

      act(() => {
        result.current.setRepo("owner", "repo");
      });

      act(() => {
        result.current.clearRepo();
      });

      expect(result.current.currentRepo).toBeNull();
      expect(localStorage.getItem("prd-to-prod-studio:current-repo")).toBeNull();
    });
  });
});
