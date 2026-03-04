import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityFilter } from "@/components/activity/ActivityFilter";

describe("ActivityFilter", () => {
  it("renders filter trigger button", () => {
    const onToggleType = vi.fn();
    const selectedTypes = new Set<string>();

    render(
      <ActivityFilter
        selectedTypes={selectedTypes}
        onToggleType={onToggleType}
      />
    );

    expect(screen.getByTestId("activity-filter-trigger")).toBeInTheDocument();
  });

  it("toggles event type when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggleType = vi.fn();
    const selectedTypes = new Set<string>(["issues", "prs"]);

    render(
      <ActivityFilter
        selectedTypes={selectedTypes}
        onToggleType={onToggleType}
      />
    );

    const trigger = screen.getByTestId("activity-filter-trigger");
    await user.click(trigger);

    const workflowsCheckbox = screen.getByRole("checkbox", {
      name: /workflows/i,
    });
    await user.click(workflowsCheckbox);

    expect(onToggleType).toHaveBeenCalledWith("workflows");
  });
});
