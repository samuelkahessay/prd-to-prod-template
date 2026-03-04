import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import type { PipelineEvent } from "@/lib/pipeline/types";

const mockEvents: PipelineEvent[] = [
  {
    type: "issue_created",
    issue: {
      id: "6",
      number: 6,
      title: "Sixth issue",
      state: "open",
      labels: [],
      dependencies: [],
      assignee: null,
      created_at: "2026-03-03T10:05:00Z",
      updated_at: "2026-03-03T10:05:00Z",
    },
    timestamp: "2026-03-03T10:05:00Z",
  },
  {
    type: "issue_created",
    issue: {
      id: "5",
      number: 5,
      title: "Fifth issue",
      state: "open",
      labels: [],
      dependencies: [],
      assignee: null,
      created_at: "2026-03-03T10:04:00Z",
      updated_at: "2026-03-03T10:04:00Z",
    },
    timestamp: "2026-03-03T10:04:00Z",
  },
  {
    type: "issue_created",
    issue: {
      id: "4",
      number: 4,
      title: "Fourth issue",
      state: "open",
      labels: [],
      dependencies: [],
      assignee: null,
      created_at: "2026-03-03T10:03:00Z",
      updated_at: "2026-03-03T10:03:00Z",
    },
    timestamp: "2026-03-03T10:03:00Z",
  },
  {
    type: "issue_created",
    issue: {
      id: "3",
      number: 3,
      title: "Third issue",
      state: "open",
      labels: [],
      dependencies: [],
      assignee: null,
      created_at: "2026-03-03T10:02:00Z",
      updated_at: "2026-03-03T10:02:00Z",
    },
    timestamp: "2026-03-03T10:02:00Z",
  },
  {
    type: "issue_created",
    issue: {
      id: "2",
      number: 2,
      title: "Second issue",
      state: "open",
      labels: [],
      dependencies: [],
      assignee: null,
      created_at: "2026-03-03T10:01:00Z",
      updated_at: "2026-03-03T10:01:00Z",
    },
    timestamp: "2026-03-03T10:01:00Z",
  },
  {
    type: "issue_created",
    issue: {
      id: "1",
      number: 1,
      title: "First issue",
      state: "open",
      labels: [],
      dependencies: [],
      assignee: null,
      created_at: "2026-03-03T10:00:00Z",
      updated_at: "2026-03-03T10:00:00Z",
    },
    timestamp: "2026-03-03T10:00:00Z",
  },
];

describe("ActivityFeed", () => {
  it("renders feed with events", () => {
    render(<ActivityFeed events={mockEvents} />);

    expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
  });

  it("shows only last 5 events when collapsed", () => {
    render(<ActivityFeed events={mockEvents} />);

    expect(screen.getByText("Sixth issue")).toBeInTheDocument();
    expect(screen.getByText("Fifth issue")).toBeInTheDocument();
    expect(screen.getByText("Fourth issue")).toBeInTheDocument();
    expect(screen.getByText("Third issue")).toBeInTheDocument();
    expect(screen.getByText("Second issue")).toBeInTheDocument();
    expect(screen.queryByText("First issue")).not.toBeInTheDocument();
  });

  it("expands to show all events when expand button clicked", async () => {
    const user = userEvent.setup();
    render(<ActivityFeed events={mockEvents} />);

    const expandButton = screen.getByRole("button", { name: /show more/i });
    await user.click(expandButton);

    expect(screen.getByText("First issue")).toBeInTheDocument();
    expect(screen.getByText("Sixth issue")).toBeInTheDocument();
  });

  it("collapses back to 5 events when collapse button clicked", async () => {
    const user = userEvent.setup();
    render(<ActivityFeed events={mockEvents} />);

    const expandButton = screen.getByRole("button", { name: /show more/i });
    await user.click(expandButton);

    const collapseButton = screen.getByRole("button", { name: /show less/i });
    await user.click(collapseButton);

    expect(screen.queryByText("First issue")).not.toBeInTheDocument();
    expect(screen.getByText("Sixth issue")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    render(<ActivityFeed events={[]} isLoading={true} />);

    const skeletons = screen.getAllByTestId("activity-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error state when error is provided", () => {
    const error = new Error("Failed to load events");
    render(<ActivityFeed events={[]} error={error} />);

    expect(screen.getByText("Failed to load activity feed")).toBeInTheDocument();
    expect(screen.getByText("Failed to load events")).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(<ActivityFeed events={[]} />);

    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });

  it("does not show expand button when 5 or fewer events", () => {
    const fewEvents = mockEvents.slice(0, 5);
    render(<ActivityFeed events={fewEvents} />);

    expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
  });
});
