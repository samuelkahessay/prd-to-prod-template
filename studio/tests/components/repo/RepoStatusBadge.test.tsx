import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RepoStatusBadge } from "@/components/repo/RepoStatusBadge";
import { RepoProvider } from "@/lib/repo/context";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderWithRepo(currentRepo: { owner: string; repo: string } | null) {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return <RepoProvider>{children}</RepoProvider>;
  };

  if (currentRepo) {
    localStorage.setItem(
      "prd-to-prod-studio:current-repo",
      JSON.stringify(currentRepo)
    );
  }

  return render(<RepoStatusBadge />, { wrapper: TestWrapper });
}

describe("RepoStatusBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders nothing when no repo selected", () => {
    const { container } = renderWithRepo(null);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state while validating", async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
        )
    );

    renderWithRepo({ owner: "test", repo: "repo" });

    await waitFor(() => {
      expect(screen.getByText("test/repo")).toBeInTheDocument();
    });
  });

  it("shows valid status for valid prd-to-prod repo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isPrdToProdRepo: true,
        hasWorkflows: true,
      }),
    });

    renderWithRepo({ owner: "test", repo: "repo" });

    await waitFor(
      () => {
        const badge = screen.getByTestId("repo-status-badge");
        expect(badge).toHaveAttribute("data-variant", "default");
      },
      { timeout: 2000 }
    );
  });

  it("shows warning status for repo missing workflows", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isPrdToProdRepo: true,
        hasWorkflows: false,
      }),
    });

    renderWithRepo({ owner: "test", repo: "repo" });

    await waitFor(
      () => {
        const badge = screen.getByTestId("repo-status-badge");
        expect(badge).toHaveAttribute("data-variant", "secondary");
      },
      { timeout: 2000 }
    );
  });

  it("shows error status for invalid repo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isPrdToProdRepo: false,
        hasWorkflows: false,
      }),
    });

    renderWithRepo({ owner: "test", repo: "repo" });

    await waitFor(
      () => {
        const badge = screen.getByTestId("repo-status-badge");
        expect(badge).toHaveAttribute("data-variant", "destructive");
      },
      { timeout: 2000 }
    );
  });

  it("shows error status on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    renderWithRepo({ owner: "test", repo: "repo" });

    await waitFor(
      () => {
        const badge = screen.getByTestId("repo-status-badge");
        expect(badge).toHaveAttribute("data-variant", "destructive");
      },
      { timeout: 2000 }
    );
  });
});
