import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkflowActions } from "@/components/controls/WorkflowActions";

describe("WorkflowActions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders re-run and cancel buttons", () => {
    render(<WorkflowActions owner="test-owner" repo="test-repo" runId={123} />);

    expect(screen.getByTestId("action-rerun-workflow")).toBeInTheDocument();
    expect(screen.getByTestId("action-cancel-workflow")).toBeInTheDocument();
  });

  it("calls API to re-run workflow", async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "rerun" }),
    });

    render(
      <WorkflowActions
        owner="test-owner"
        repo="test-repo"
        runId={123}
        onActionComplete={onActionComplete}
      />
    );

    await user.click(screen.getByTestId("action-rerun-workflow"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/workflow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            runId: 123,
            action: "rerun",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalled();
    });
  });

  it("calls API to cancel workflow", async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "cancel" }),
    });

    render(
      <WorkflowActions
        owner="test-owner"
        repo="test-repo"
        runId={123}
        onActionComplete={onActionComplete}
      />
    );

    await user.click(screen.getByTestId("action-cancel-workflow"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/workflow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            runId: 123,
            action: "cancel",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalled();
    });
  });

  it("displays error on API failure", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Workflow not found" }),
    });

    render(<WorkflowActions owner="test-owner" repo="test-repo" runId={123} />);

    await user.click(screen.getByTestId("action-rerun-workflow"));

    await waitFor(() => {
      expect(screen.getByText(/workflow not found/i)).toBeInTheDocument();
    });
  });
});
