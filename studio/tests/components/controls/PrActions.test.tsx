import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PrActions } from "@/components/controls/PrActions";

describe("PrActions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders all PR action buttons", () => {
    render(<PrActions owner="test-owner" repo="test-repo" prNumber={21} />);

    expect(screen.getByTestId("action-approve-pr")).toBeInTheDocument();
    expect(screen.getByTestId("action-request-changes-pr")).toBeInTheDocument();
    expect(screen.getByTestId("action-merge-pr")).toBeInTheDocument();
    expect(screen.getByTestId("action-close-pr")).toBeInTheDocument();
  });

  it("calls API to approve PR", async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "approve" }),
    });

    render(
      <PrActions
        owner="test-owner"
        repo="test-repo"
        prNumber={21}
        onActionComplete={onActionComplete}
      />
    );

    await user.click(screen.getByTestId("action-approve-pr"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/pr",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            prNumber: 21,
            action: "approve",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalled();
    });
  });

  it("requires reason for request changes", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "reject" }),
    });

    render(<PrActions owner="test-owner" repo="test-repo" prNumber={21} />);

    await user.click(screen.getByTestId("action-request-changes-pr"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /reason/i });
    await user.type(textarea, "Needs tests");

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/pr",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            prNumber: 21,
            action: "reject",
            reason: "Needs tests",
          }),
        })
      );
    });
  });

  it("allows merge method selection", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "merge" }),
    });

    render(<PrActions owner="test-owner" repo="test-repo" prNumber={21} />);

    await user.click(screen.getByTestId("action-merge-pr"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const methodSelect = screen.getByRole("combobox", { name: /method/i });
    await user.click(methodSelect);
    await user.click(screen.getByRole("option", { name: /squash/i }));

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/pr",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            prNumber: 21,
            action: "merge",
            method: "squash",
          }),
        })
      );
    });
  });

  it("displays error on API failure", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Merge conflict" }),
    });

    render(<PrActions owner="test-owner" repo="test-repo" prNumber={21} />);

    await user.click(screen.getByTestId("action-merge-pr"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/merge conflict/i)).toBeInTheDocument();
    });
  });
});
