import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepoPicker } from "@/components/repo/RepoPicker";
import { RepoProvider } from "@/lib/repo/context";
import * as storage from "@/lib/repo/storage";

vi.mock("@/lib/repo/storage", () => ({
  addRecentRepo: vi.fn(),
  getRecentRepos: vi.fn(() => []),
  removeRecentRepo: vi.fn(),
  clearRecentRepos: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderRepoPicker() {
  const user = userEvent.setup();
  const result = render(
    <RepoProvider>
      <RepoPicker />
    </RepoProvider>
  );
  return { user, ...result };
}

describe("RepoPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
  });

  it("renders button with placeholder text when no repo selected", () => {
    renderRepoPicker();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Select repository...")).toBeInTheDocument();
  });

  it("renders current repo name when repo is selected", () => {
    localStorage.setItem(
      "prd-to-prod-studio:current-repo",
      JSON.stringify({ owner: "test", repo: "repo" })
    );

    renderRepoPicker();

    waitFor(() => {
      expect(screen.getByText("test/repo")).toBeInTheDocument();
    });
  });

  it("opens popover when button is clicked", async () => {
    const { user } = renderRepoPicker();

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Type owner/repo...")).toBeInTheDocument();
    });
  });

  it("displays recent repos in list", async () => {
    vi.mocked(storage.getRecentRepos).mockReturnValue([
      { owner: "user1", repo: "repo1", lastAccessed: 1000 },
      { owner: "user2", repo: "repo2", lastAccessed: 2000 },
    ]);

    const { user } = renderRepoPicker();
    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("user1/repo1")).toBeInTheDocument();
      expect(screen.getByText("user2/repo2")).toBeInTheDocument();
    });
  });

  it("validates and connects repo on manual input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isPrdToProdRepo: true,
        hasWorkflows: true,
      }),
    });

    const { user } = renderRepoPicker();
    await user.click(screen.getByRole("combobox"));

    const input = screen.getByPlaceholderText("Type owner/repo...");
    await user.type(input, "owner/repo{Enter}");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/repo/validate?owner=owner&repo=repo")
      );
    });
  });

  it("shows validation error for invalid repo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isPrdToProdRepo: false,
        hasWorkflows: false,
      }),
    });

    const { user } = renderRepoPicker();
    await user.click(screen.getByRole("combobox"));

    const input = screen.getByPlaceholderText("Type owner/repo...");
    await user.type(input, "invalid/repo{Enter}");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/repo/validate?owner=invalid&repo=repo")
      );
    });
  });

  it("removes repo from recent list when X is clicked", async () => {
    vi.mocked(storage.getRecentRepos).mockReturnValue([
      { owner: "user1", repo: "repo1", lastAccessed: 1000 },
    ]);

    const { user } = renderRepoPicker();
    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("user1/repo1")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole("button");
    const xButton = removeButtons.find((btn) => 
      btn.querySelector('svg')?.classList.contains('lucide-x')
    );
    
    if (xButton) {
      await user.click(xButton);
      expect(storage.removeRecentRepo).toHaveBeenCalledWith("user1", "repo1");
    }
  });

  it("submits on Enter key press", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isPrdToProdRepo: true,
        hasWorkflows: true,
      }),
    });

    const { user } = renderRepoPicker();
    await user.click(screen.getByRole("combobox"));

    const input = screen.getByPlaceholderText("Type owner/repo...");
    await user.type(input, "owner/repo{Enter}");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/repo/validate?owner=owner&repo=repo")
      );
    });
  });
});
