import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ControlPanel } from "@/components/controls/ControlPanel";
import type { PipelineFlowNode } from "@/components/pipeline/types";

describe("ControlPanel", () => {
  it("renders nothing when no node is selected", () => {
    const { container } = render(
      <ControlPanel selectedNode={null} owner="test-owner" repo="test-repo" />
    );

    expect(container.querySelector('[data-testid="control-panel"]')).toBeNull();
  });

  it("renders IssueActions for issue-node", () => {
    const node: PipelineFlowNode = {
      id: "issue-42",
      type: "issue-node",
      position: { x: 0, y: 0 },
      data: {
        title: "Test Issue",
        number: 42,
        stage: "implementing",
        statusColor: "#2563eb",
        nodeType: "issue-node",
      },
    };

    render(<ControlPanel selectedNode={node} owner="test-owner" repo="test-repo" />);

    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByTestId("issue-actions")).toBeInTheDocument();
  });

  it("renders PrActions for pr-node", () => {
    const node: PipelineFlowNode = {
      id: "pr-21",
      type: "pr-node",
      position: { x: 0, y: 0 },
      data: {
        title: "Test PR",
        number: 21,
        stage: "reviewing",
        statusColor: "#2563eb",
        nodeType: "pr-node",
      },
    };

    render(<ControlPanel selectedNode={node} owner="test-owner" repo="test-repo" />);

    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByTestId("pr-actions")).toBeInTheDocument();
  });

  it("renders WorkflowActions for deploy-node", () => {
    const node: PipelineFlowNode = {
      id: "deploy-123",
      type: "deploy-node",
      position: { x: 0, y: 0 },
      data: {
        title: "Deploy to Production",
        number: null,
        stage: "deploying",
        statusColor: "#2563eb",
        nodeType: "deploy-node",
      },
    };

    render(<ControlPanel selectedNode={node} owner="test-owner" repo="test-repo" />);

    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByTestId("workflow-actions")).toBeInTheDocument();
  });

  it("renders slash command trigger for prd-node", () => {
    const node: PipelineFlowNode = {
      id: "prd-root",
      type: "prd-node",
      position: { x: 0, y: 0 },
      data: {
        title: "PRD",
        number: null,
        stage: "idle",
        statusColor: "#64748b",
        nodeType: "prd-node",
      },
    };

    render(<ControlPanel selectedNode={node} owner="test-owner" repo="test-repo" />);

    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByText("Trigger /decompose")).toBeInTheDocument();
  });

  it("calls onActionComplete after action execution", async () => {
    const onActionComplete = vi.fn();
    const node: PipelineFlowNode = {
      id: "issue-42",
      type: "issue-node",
      position: { x: 0, y: 0 },
      data: {
        title: "Test Issue",
        number: 42,
        stage: "implementing",
        statusColor: "#2563eb",
        nodeType: "issue-node",
      },
    };

    render(
      <ControlPanel
        selectedNode={node}
        owner="test-owner"
        repo="test-repo"
        onActionComplete={onActionComplete}
      />
    );

    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
  });
});
