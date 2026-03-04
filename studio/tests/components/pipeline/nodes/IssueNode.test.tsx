import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { IssueNode } from "@/components/pipeline/nodes/IssueNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => <div data-testid="pipeline-handle" />,
  Position: { Top: "top", Bottom: "bottom" },
}));

describe("IssueNode", () => {
  it("renders issue metadata and stage badge", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <IssueNode
        {...({
          id: "issue-42",
          data: {
            title: "Implement feature",
            number: 42,
            stage: "reviewing",
            statusColor: "#f59e0b",
            nodeType: "issue-node",
            onClick,
          },
        } as unknown as React.ComponentProps<typeof IssueNode>)}
      />
    );

    expect(screen.getByTestId("pipeline-node-issue")).toHaveTextContent("#42");
    expect(screen.getByTestId("pipeline-node-issue")).toHaveTextContent("reviewing");

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: "issue-42", type: "issue-node" }));
  });
});
