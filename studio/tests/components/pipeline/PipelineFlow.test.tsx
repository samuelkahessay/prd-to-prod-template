import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { PipelineFlow } from "@/components/pipeline/PipelineFlow";
import { PipelineFlowWrapper } from "@/components/pipeline/PipelineFlowWrapper";
import { mapStageToStatus } from "@/components/pipeline/types";
import type { PipelineIssue, PipelinePR, PipelineWorkflowRun } from "@/lib/pipeline/types";

let capturedFlowProps: Record<string, unknown> | null = null;

vi.mock("next/dynamic", () => ({
  default: () => {
    return (props: Record<string, unknown>) => {
      capturedFlowProps = props;
      return <div data-testid="react-flow-mock">{props.children as unknown as JSX.Element}</div>;
    };
  },
}));

vi.mock("@xyflow/react", () => ({
  Background: () => <div data-testid="pipeline-background" />,
  Controls: () => <div data-testid="pipeline-controls" />,
  MiniMap: () => <div data-testid="pipeline-minimap" />,
  Handle: () => <div data-testid="pipeline-handle" />,
  Position: {
    Top: "top",
    Bottom: "bottom",
    Left: "left",
    Right: "right",
  },
}));

function createIssue(overrides: Partial<PipelineIssue> = {}): PipelineIssue {
  return {
    id: "issue-1",
    number: 1,
    title: "Issue",
    state: "open",
    labels: ["in-progress"],
    dependencies: [],
    assignee: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createPr(overrides: Partial<PipelinePR> = {}): PipelinePR {
  return {
    id: "pr-1",
    number: 11,
    title: "PR",
    state: "open",
    linked_issue: 1,
    reviews: [{ reviewer: "alex", state: "APPROVED", submitted_at: "2026-01-01T00:00:00Z" }],
    checks: [],
    mergeable: true,
    auto_merge: false,
    ...overrides,
  };
}

function createWorkflow(overrides: Partial<PipelineWorkflowRun> = {}): PipelineWorkflowRun {
  return {
    id: "wf-1",
    name: "Deploy Production",
    status: "in_progress",
    conclusion: null,
    started_at: "2026-01-01T00:00:00Z",
    completed_at: null,
    url: "https://example.com/workflow/1",
    ...overrides,
  };
}

describe("PipelineFlow", () => {
  beforeEach(() => {
    capturedFlowProps = null;
  });

  it("configures a read-only React Flow graph with minimap", () => {
    render(<PipelineFlow issues={[createIssue()]} prs={[createPr()]} workflows={[createWorkflow()]} />);

    expect(screen.getByTestId("pipeline-flow-container")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-minimap")).toBeInTheDocument();
    expect(capturedFlowProps).not.toBeNull();
    expect(capturedFlowProps?.nodesDraggable).toBe(false);
    expect(capturedFlowProps?.nodesConnectable).toBe(false);
    expect(capturedFlowProps?.fitView).toBe(true);
    expect(capturedFlowProps?.nodeTypes).toMatchObject({
      "prd-node": expect.any(Function),
      "issue-node": expect.any(Function),
      "pr-node": expect.any(Function),
      "deploy-node": expect.any(Function),
    });
  });

  it("flags active stages for pulse animation", () => {
    render(<PipelineFlow issues={[createIssue()]} prs={[]} workflows={[]} />);

    const nodes = (capturedFlowProps?.nodes as Array<{ className?: string }>) ?? [];
    expect(nodes.some((node) => node.className?.includes("pipeline-node-pulse"))).toBe(true);
  });

  it("maps stage colors to design-system statuses", () => {
    expect(mapStageToStatus("complete")).toBe("success");
    expect(mapStageToStatus("reviewing")).toBe("pending");
    expect(mapStageToStatus("failed")).toBe("failed");
    expect(mapStageToStatus("idle")).toBe("idle");
    expect(mapStageToStatus("implementing")).toBe("in_progress");
  });
});

describe("PipelineFlowWrapper", () => {
  it("renders loading, error, and empty states", () => {
    const { rerender } = render(
      <PipelineFlowWrapper issues={[]} prs={[]} workflows={[]} isLoading />
    );
    expect(screen.getByTestId("pipeline-flow-loading")).toBeInTheDocument();

    rerender(<PipelineFlowWrapper issues={[]} prs={[]} workflows={[]} error="Request failed" />);
    expect(screen.getByTestId("pipeline-flow-error")).toHaveTextContent("Request failed");

    rerender(<PipelineFlowWrapper issues={[]} prs={[]} workflows={[]} />);
    expect(screen.getByTestId("pipeline-flow-empty")).toBeInTheDocument();
  });
});
