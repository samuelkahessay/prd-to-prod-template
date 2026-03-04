import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SlashCommandMenu } from "@/components/controls/SlashCommandMenu";

describe("SlashCommandMenu", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders dropdown trigger", () => {
    render(<SlashCommandMenu owner="test-owner" repo="test-repo" issueNumber={42} />);

    expect(screen.getByTestId("slash-command-menu")).toBeInTheDocument();
  });

  it("displays all slash commands in dropdown", async () => {
    const user = userEvent.setup();

    render(<SlashCommandMenu owner="test-owner" repo="test-repo" issueNumber={42} />);

    await user.click(screen.getByTestId("slash-command-menu"));

    await waitFor(() => {
      expect(screen.getByText("/plan")).toBeInTheDocument();
      expect(screen.getByText("/decompose")).toBeInTheDocument();
      expect(screen.getByText("/repo-assist")).toBeInTheDocument();
      expect(screen.getByText("/approve-architecture")).toBeInTheDocument();
      expect(screen.getByText("/approve-sensitive")).toBeInTheDocument();
    });
  });

  it("posts selected slash command to API", async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, action: "slash-command", command: "/decompose" }),
    });

    render(
      <SlashCommandMenu
        owner="test-owner"
        repo="test-repo"
        issueNumber={42}
        onActionComplete={onActionComplete}
      />
    );

    await user.click(screen.getByTestId("slash-command-menu"));

    await waitFor(() => {
      expect(screen.getByText("/decompose")).toBeInTheDocument();
    });

    await user.click(screen.getByText("/decompose"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/actions/slash-command",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            owner: "test-owner",
            repo: "test-repo",
            issueNumber: 42,
            command: "/decompose",
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
      json: async () => ({ ok: false, error: "Invalid command" }),
    });

    render(<SlashCommandMenu owner="test-owner" repo="test-repo" issueNumber={42} />);

    await user.click(screen.getByTestId("slash-command-menu"));

    await waitFor(() => {
      expect(screen.getByText("/decompose")).toBeInTheDocument();
    });

    await user.click(screen.getByText("/decompose"));

    await waitFor(() => {
      expect(screen.getByText(/invalid command/i)).toBeInTheDocument();
    });
  });
});
