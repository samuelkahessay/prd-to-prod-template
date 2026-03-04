import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeployNode } from "@/components/pipeline/nodes/DeployNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => <div data-testid="pipeline-handle" />,
  Position: { Top: "top", Bottom: "bottom" },
}));

describe("DeployNode", () => {
  it("renders environment and status", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <DeployNode
        {...({
          id: "deploy-wf-1",
          data: {
            title: "Deploy Production",
            number: null,
            stage: "deploying",
            statusColor: "#2563eb",
            nodeType: "deploy-node",
            environment: "production",
            onClick,
          },
        } as unknown as React.ComponentProps<typeof DeployNode>)}
      />
    );

    expect(screen.getByTestId("pipeline-node-deploy")).toHaveTextContent("production");

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: "deploy-wf-1", type: "deploy-node" }));
  });
});
