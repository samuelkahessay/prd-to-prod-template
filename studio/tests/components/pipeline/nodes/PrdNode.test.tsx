import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PrdNode } from "@/components/pipeline/nodes/PrdNode";
import type { PipelineFlowNode } from "@/components/pipeline/types";

vi.mock("@xyflow/react", () => ({
  Handle: () => <div data-testid="pipeline-handle" />,
  Position: { Top: "top", Bottom: "bottom" },
}));

describe("PrdNode", () => {
  it("renders the PRD node and handles clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const node = {
      id: "prd-root",
      type: "prd-node",
      position: { x: 0, y: 0 },
      data: {
        title: "PRD",
        number: null,
        stage: "planning",
        statusColor: "#2563eb",
        nodeType: "prd-node",
        onClick,
      },
    } as unknown as PipelineFlowNode;

    render(<PrdNode {...({ id: node.id, data: node.data } as unknown as React.ComponentProps<typeof PrdNode>)} />);

    expect(screen.getByTestId("pipeline-node-prd")).toHaveTextContent("PRD Root");
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: "prd-root", type: "prd-node" }));
  });
});
