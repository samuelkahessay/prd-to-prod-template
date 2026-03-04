import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { IssueActions } from "@/components/controls/IssueActions";

describe("IssueActions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders close issue button", () => {
    render(<IssueActions owner="test-owner" repo="test-repo" issueNumber={42} />);

    expect(screen.getByTestId("action-close-issue")).toBeInTheDocument();
  });

  it("renders add label button", () => {
    render(<IssueActions owner="test-owner" repo="test-repo" issueNumber={42} />);

    expect(screen.getByTestId("action-add-label")).toBeInTheDocument();
  });

  it("renders slash command menu trigger", () => {
    render(<IssueActions owner="test-owner" repo="test-repo" issueNumber={42} />);

    expect(screen.getByTestId("slash-command-menu")).toBeInTheDocument();
  });

  it("calls API to close issue", async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "close" }),
    });

    render(
      <IssueActions
        owner="test-owner"
        repo="test-repo"
        issueNumber={42}
        onActionComplete={onActionComplete}
      />
    );

    await user.click(screen.getByTestId("action-close-issue"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/issue",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            issueNumber: 42,
            action: "close",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalled();
    });
  });

  it("shows loading state during action execution", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<IssueActions owner="test-owner" repo="test-repo" issueNumber={42} />);

    await user.click(screen.getByTestId("action-close-issue"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("action-loading")).toBeInTheDocument();
    });
  });

  it("displays error message on API failure", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "API Error" }),
    });

    render(<IssueActions owner="test-owner" repo="test-repo" issueNumber={42} />);

    await user.click(screen.getByTestId("action-close-issue"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
