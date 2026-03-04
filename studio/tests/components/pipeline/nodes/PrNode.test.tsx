import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PrNode } from "@/components/pipeline/nodes/PrNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => <div data-testid="pipeline-handle" />,
  Position: { Top: "top", Bottom: "bottom" },
}));

describe("PrNode", () => {
  it("renders review status and emits click payload", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <PrNode
        {...({
          id: "pr-21",
          data: {
            title: "Add pipeline view",
            number: 21,
            stage: "implementing",
            statusColor: "#2563eb",
            nodeType: "pr-node",
            reviewStatus: "Approved",
            onClick,
          },
        } as unknown as React.ComponentProps<typeof PrNode>)}
      />
    );

    expect(screen.getByTestId("pipeline-node-pr")).toHaveTextContent("Approved");

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: "pr-21", type: "pr-node" }));
  });
});
