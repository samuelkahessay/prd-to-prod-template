import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityItem } from "@/components/activity/ActivityItem";
import type { PipelineEvent } from "@/lib/pipeline/types";

const mockIssue = {
  id: "1",
  number: 42,
  title: "Add login feature",
  state: "open" as const,
  labels: ["feature"],
  dependencies: [],
  assignee: "bot",
  created_at: "2026-03-03T10:00:00Z",
  updated_at: "2026-03-03T10:00:00Z",
};

const mockPR = {
  id: "1",
  number: 10,
  title: "Implement login page",
  state: "open" as const,
  linked_issue: 42,
  reviews: [],
  checks: [],
  mergeable: true,
  auto_merge: false,
};

const mockWorkflow = {
  id: "1",
  name: "CI Build",
  status: "completed" as const,
  conclusion: "success" as const,
  started_at: "2026-03-03T10:10:00Z",
  completed_at: "2026-03-03T10:15:00Z",
  url: "https://github.com/owner/repo/actions/runs/1",
};

const mockDeployment = {
  id: "1",
  environment: "production",
  status: "success" as const,
  url: "https://app.vercel.app",
  created_at: "2026-03-03T10:20:00Z",
};

describe("ActivityItem", () => {
  it("renders issue_created event", () => {
    const event: PipelineEvent = {
      type: "issue_created",
      issue: mockIssue,
      timestamp: "2026-03-03T10:00:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText("Add login feature")).toBeInTheDocument();
    expect(screen.getByText(/#42/)).toBeInTheDocument();
  });

  it("renders pr_created event", () => {
    const event: PipelineEvent = {
      type: "pr_created",
      pr: mockPR,
      timestamp: "2026-03-03T10:05:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText("Implement login page")).toBeInTheDocument();
    expect(screen.getByText(/#10/)).toBeInTheDocument();
  });

  it("renders workflow_started event", () => {
    const event: PipelineEvent = {
      type: "workflow_started",
      workflow: mockWorkflow,
      timestamp: "2026-03-03T10:10:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText("CI Build")).toBeInTheDocument();
    expect(screen.getByText(/started/i)).toBeInTheDocument();
  });

  it("renders workflow_completed event with success", () => {
    const event: PipelineEvent = {
      type: "workflow_completed",
      workflow: mockWorkflow,
      timestamp: "2026-03-03T10:15:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText("CI Build")).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it("renders workflow_completed event with failure", () => {
    const failedWorkflow = {
      ...mockWorkflow,
      conclusion: "failure" as const,
    };

    const event: PipelineEvent = {
      type: "workflow_completed",
      workflow: failedWorkflow,
      timestamp: "2026-03-03T10:15:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText("CI Build")).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it("renders deployment_started event", () => {
    const event: PipelineEvent = {
      type: "deployment_started",
      deployment: mockDeployment,
      timestamp: "2026-03-03T10:20:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText(/production/i)).toBeInTheDocument();
    expect(screen.getByText(/deploying/i)).toBeInTheDocument();
  });

  it("renders deployment_completed event with success", () => {
    const event: PipelineEvent = {
      type: "deployment_completed",
      deployment: mockDeployment,
      timestamp: "2026-03-03T10:25:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText(/production/i)).toBeInTheDocument();
    expect(screen.getByText(/deployed/i)).toBeInTheDocument();
  });

  it("renders deployment_completed event with failure", () => {
    const failedDeployment = {
      ...mockDeployment,
      status: "failure" as const,
    };

    const event: PipelineEvent = {
      type: "deployment_completed",
      deployment: failedDeployment,
      timestamp: "2026-03-03T10:25:00Z",
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText(/production/i)).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it("includes link to GitHub for issue", () => {
    const event: PipelineEvent = {
      type: "issue_created",
      issue: mockIssue,
      timestamp: "2026-03-03T10:00:00Z",
    };

    render(<ActivityItem event={event} owner="test-owner" repo="test-repo" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/test-owner/test-repo/issues/42"
    );
  });

  it("includes link to GitHub for PR", () => {
    const event: PipelineEvent = {
      type: "pr_created",
      pr: mockPR,
      timestamp: "2026-03-03T10:05:00Z",
    };

    render(<ActivityItem event={event} owner="test-owner" repo="test-repo" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/test-owner/test-repo/pull/10"
    );
  });

  it("includes link to GitHub for workflow", () => {
    const event: PipelineEvent = {
      type: "workflow_started",
      workflow: mockWorkflow,
      timestamp: "2026-03-03T10:10:00Z",
    };

    render(<ActivityItem event={event} owner="test-owner" repo="test-repo" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", mockWorkflow.url);
  });

  it("displays relative timestamp", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const event: PipelineEvent = {
      type: "issue_created",
      issue: mockIssue,
      timestamp: twoMinutesAgo,
    };

    render(<ActivityItem event={event} />);

    expect(screen.getByText(/2\s*m(in)?\s*ago/i)).toBeInTheDocument();
  });
});
