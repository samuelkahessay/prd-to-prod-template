import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type {
  PipelineDeployment,
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
} from "@/lib/pipeline/types";
import { usePipelineOverview } from "@/lib/queries/pipeline";
import { useRepo } from "@/lib/repo/context";

const state = {
  throwMetricsBarError: false,
};

vi.mock("@/lib/repo/context", () => ({
  useRepo: vi.fn(),
}));

vi.mock("@/lib/queries/pipeline", () => ({
  usePipelineOverview: vi.fn(),
}));

vi.mock("@/components/welcome/WelcomeScreen", () => ({
  WelcomeScreen: ({ owner, repo }: { owner: string; repo: string }) => (
    <div data-testid="welcome-screen">Welcome {owner}/{repo}</div>
  ),
}));

vi.mock("@/components/dashboard/MetricsBar", () => ({
  MetricsBar: () => {
    if (state.throwMetricsBarError) {
      throw new Error("metrics blew up");
    }
    return <div data-testid="metrics-bar" />;
  },
}));

vi.mock("@/components/dashboard/StatusCards", () => ({
  StatusCards: () => <div data-testid="status-cards" />,
}));

vi.mock("@/components/pipeline/PipelineFlowWrapper", () => ({
  PipelineFlowWrapper: ({
    onNodeClick,
  }: {
    onNodeClick?: (payload: {
      id: string;
      type: "issue-node";
      data: { title: string; number: number; stage: "implementing"; statusColor: string; nodeType: "issue-node" };
    }) => void;
  }) => (
    <div data-testid="pipeline-flow-wrapper">
      <button
        data-testid="pipeline-node-trigger"
        onClick={() => {
          onNodeClick?.({
            id: "issue-42",
            type: "issue-node",
            data: {
              title: "Issue",
              number: 42,
              stage: "implementing",
              statusColor: "#2563eb",
              nodeType: "issue-node",
            },
          });
        }}
        type="button"
      >
        Click node
      </button>
    </div>
  ),
}));

vi.mock("@/components/controls/ControlPanel", () => ({
  ControlPanel: ({ selectedNode }: { selectedNode: { id: string } | null }) => (
    <div data-testid="control-panel">Control panel for {selectedNode?.id}</div>
  ),
}));

vi.mock("@/components/activity/ActivityFeed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

const mockUseRepo = vi.mocked(useRepo);
const mockUsePipelineOverview = vi.mocked(usePipelineOverview);

function createOverviewData(overrides?: {
  issues?: PipelineIssue[];
  pull_requests?: PipelinePR[];
  workflows?: PipelineWorkflowRun[];
  deployments?: PipelineDeployment[];
}) {
  return {
    issues: [
      {
        id: "issue-1",
        number: 1,
        title: "Implement dashboard",
        state: "open" as const,
        labels: ["in-progress"],
        dependencies: [],
        assignee: null,
        created_at: "2026-03-03T10:00:00Z",
        updated_at: "2026-03-03T10:00:00Z",
      },
    ],
    pull_requests: [
      {
        id: "pr-1",
        number: 5,
        title: "Add dashboard shell",
        state: "open" as const,
        linked_issue: 1,
        reviews: [{ reviewer: "octo", state: "PENDING" as const, submitted_at: null }],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
    ],
    workflows: [
      {
        id: "wf-1",
        name: "repo-assist",
        status: "in_progress" as const,
        conclusion: null,
        started_at: "2026-03-03T10:05:00Z",
        completed_at: null,
        url: "https://example.com/workflow/1",
      },
    ],
    deployments: [],
    ...overrides,
  };
}

describe("DashboardShell", () => {
  beforeEach(() => {
    state.throwMetricsBarError = false;
    vi.clearAllMocks();

    mockUseRepo.mockReturnValue({
      currentRepo: { owner: "octocat", repo: "hello-world" },
      setRepo: vi.fn(),
      clearRepo: vi.fn(),
    });

    mockUsePipelineOverview.mockReturnValue({
      data: createOverviewData(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePipelineOverview>);
  });

  it("renders WelcomeScreen when no repo is connected", () => {
    mockUseRepo.mockReturnValue({
      currentRepo: null,
      setRepo: vi.fn(),
      clearRepo: vi.fn(),
    });

    render(<DashboardShell />);

    expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("metrics-bar")).not.toBeInTheDocument();
  });

  it("renders WelcomeScreen when repo is connected but no issues exist", () => {
    mockUsePipelineOverview.mockReturnValue({
      data: createOverviewData({ issues: [] }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof usePipelineOverview>);

    render(<DashboardShell />);

    expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
    expect(screen.getByText("Welcome octocat/hello-world")).toBeInTheDocument();
  });

  it("renders all dashboard widgets when pipeline is active", () => {
    render(<DashboardShell />);

    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-bar")).toBeInTheDocument();
    expect(screen.getByTestId("status-cards")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-flow-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
    expect(screen.queryByTestId("control-panel")).not.toBeInTheDocument();
  });

  it("shows control panel after clicking a pipeline node", () => {
    render(<DashboardShell />);

    fireEvent.click(screen.getByTestId("pipeline-node-trigger"));

    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByText("Control panel for issue-42")).toBeInTheDocument();
  });

  it("catches render errors in dashboard error boundary", () => {
    state.throwMetricsBarError = true;

    render(<DashboardShell />);

    expect(screen.getByTestId("dashboard-error-boundary")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
