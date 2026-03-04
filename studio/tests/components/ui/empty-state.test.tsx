import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  describe("variant content", () => {
    it("renders correct content for no-repo variant", () => {
      render(<EmptyState variant="no-repo" />);
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("No repository connected")).toBeInTheDocument();
      expect(screen.getByText("Connect a repository to get started")).toBeInTheDocument();
    });

    it("renders correct content for no-pipeline variant", () => {
      render(<EmptyState variant="no-pipeline" />);
      expect(screen.getByText("No active pipeline")).toBeInTheDocument();
      expect(screen.getByText("Submit a PRD to start a pipeline run")).toBeInTheDocument();
    });

    it("renders correct content for no-issues variant", () => {
      render(<EmptyState variant="no-issues" />);
      expect(screen.getByText("No pipeline issues")).toBeInTheDocument();
      expect(screen.getByText("Issues will appear when a PRD is decomposed")).toBeInTheDocument();
    });

    it("renders correct content for no-prs variant", () => {
      render(<EmptyState variant="no-prs" />);
      expect(screen.getByText("No pull requests")).toBeInTheDocument();
      expect(screen.getByText("PRs will appear when issues are being implemented")).toBeInTheDocument();
    });

    it("renders correct content for no-activity variant", () => {
      render(<EmptyState variant="no-activity" />);
      expect(screen.getByText("No recent activity")).toBeInTheDocument();
      expect(screen.getByText("Events will stream in as the pipeline progresses")).toBeInTheDocument();
    });

    it("renders correct content for no-workflows variant", () => {
      render(<EmptyState variant="no-workflows" />);
      expect(screen.getByText("No workflow runs")).toBeInTheDocument();
      expect(screen.getByText("Workflows trigger automatically during pipeline execution")).toBeInTheDocument();
    });
  });

  describe("action button", () => {
    it("renders CTA button when action prop is provided", () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          variant="no-repo"
          action={{ label: "Go to Settings", onClick }}
        />
      );
      const button = screen.getByTestId("empty-state-action");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Go to Settings");
    });

    it("CTA onClick fires correctly", () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          variant="no-pipeline"
          action={{ label: "Create PRD", onClick }}
        />
      );
      fireEvent.click(screen.getByTestId("empty-state-action"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not render CTA when action is not provided", () => {
      render(<EmptyState variant="no-issues" />);
      expect(screen.queryByTestId("empty-state-action")).not.toBeInTheDocument();
    });
  });
});
