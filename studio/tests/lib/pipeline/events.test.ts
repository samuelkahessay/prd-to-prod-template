import { describe, it, expect } from "vitest";
import { buildEventTimeline } from "@/lib/pipeline/events";
import type {
  PipelineEvent,
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
  PipelineDeployment,
} from "@/lib/pipeline/types";

describe("buildEventTimeline", () => {
  it("returns empty array when all inputs are empty", () => {
    const result = buildEventTimeline([], [], [], []);
    expect(result).toEqual([]);
  });

  it("creates issue_created events from issues", () => {
    const issues: PipelineIssue[] = [
      {
        id: "1",
        number: 42,
        title: "Implement feature",
        state: "open",
        labels: ["feature"],
        dependencies: [],
        assignee: "bot",
        created_at: "2026-03-03T10:00:00Z",
        updated_at: "2026-03-03T10:00:00Z",
      },
    ];

    const result = buildEventTimeline(issues, [], [], []);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "issue_created",
      issue: issues[0],
      timestamp: "2026-03-03T10:00:00Z",
    });
  });

  it("creates pr_created events from pull requests", () => {
    const prs: PipelinePR[] = [
      {
        id: "1",
        number: 10,
        title: "Add login page",
        state: "open",
        linked_issue: 42,
        reviews: [],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
    ];

    const result = buildEventTimeline([], prs, [], []);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "pr_created",
      pr: prs[0],
    });
  });

  it("creates issue_closed events for closed issues", () => {
    const issues: PipelineIssue[] = [
      {
        id: "1",
        number: 42,
        title: "Implement feature",
        state: "closed",
        labels: ["feature"],
        dependencies: [],
        assignee: "bot",
        created_at: "2026-03-03T10:00:00Z",
        updated_at: "2026-03-03T11:00:00Z",
      },
    ];

    const result = buildEventTimeline(issues, [], [], []);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      type: "issue_closed",
      issue: issues[0],
      timestamp: "2026-03-03T11:00:00Z",
    });
    expect(result[1]).toMatchObject({
      type: "issue_created",
      issue: issues[0],
      timestamp: "2026-03-03T10:00:00Z",
    });
  });

  it("creates pr_merged events for merged pull requests", () => {
    const issues: PipelineIssue[] = [
      {
        id: "1",
        number: 42,
        title: "Implement feature",
        state: "open",
        labels: ["feature"],
        dependencies: [],
        assignee: "bot",
        created_at: "2026-03-03T10:00:00Z",
        updated_at: "2026-03-03T10:00:00Z",
      },
    ];

    const prs: PipelinePR[] = [
      {
        id: "1",
        number: 10,
        title: "Add login page",
        state: "merged",
        linked_issue: 42,
        reviews: [],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
    ];

    const result = buildEventTimeline(issues, prs, [], []);

    expect(result).toHaveLength(3);
    const types = result.map((e) => e.type);
    expect(types).toContain("issue_created");
    expect(types).toContain("pr_created");
    expect(types).toContain("pr_merged");
  });

  it("creates workflow_started and workflow_completed events", () => {
    const workflows: PipelineWorkflowRun[] = [
      {
        id: "1",
        name: "CI Build",
        status: "completed",
        conclusion: "success",
        started_at: "2026-03-03T10:10:00Z",
        completed_at: "2026-03-03T10:15:00Z",
        url: "https://github.com/owner/repo/actions/runs/1",
      },
    ];

    const result = buildEventTimeline([], [], workflows, []);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("workflow_completed");
    expect(result[1].type).toBe("workflow_started");
    expect((result[0] as Extract<PipelineEvent, { type: "workflow_completed" }>).workflow).toEqual(workflows[0]);
    expect((result[1] as Extract<PipelineEvent, { type: "workflow_started" }>).workflow).toEqual(workflows[0]);
  });

  it("creates deployment_started and deployment_completed events for completed deployments", () => {
    const deployments: PipelineDeployment[] = [
      {
        id: "1",
        environment: "production",
        status: "success",
        url: "https://app.vercel.app",
        created_at: "2026-03-03T10:20:00Z",
      },
    ];

    const result = buildEventTimeline([], [], [], deployments);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("deployment_completed");
    expect(result[1].type).toBe("deployment_started");
  });

  it("creates only deployment_started for in-progress deployments", () => {
    const deployments: PipelineDeployment[] = [
      {
        id: "1",
        environment: "staging",
        status: "in_progress",
        url: "https://staging.vercel.app",
        created_at: "2026-03-03T10:25:00Z",
      },
    ];

    const result = buildEventTimeline([], [], [], deployments);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("deployment_started");
  });

  it("sorts events by timestamp descending (newest first)", () => {
    const issues: PipelineIssue[] = [
      {
        id: "1",
        number: 1,
        title: "First",
        state: "open",
        labels: [],
        dependencies: [],
        assignee: null,
        created_at: "2026-03-03T08:00:00Z",
        updated_at: "2026-03-03T08:00:00Z",
      },
    ];

    const prs: PipelinePR[] = [
      {
        id: "2",
        number: 2,
        title: "Second",
        state: "open",
        linked_issue: null,
        reviews: [],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
    ];

    const workflows: PipelineWorkflowRun[] = [
      {
        id: "3",
        name: "Latest",
        status: "in_progress",
        conclusion: null,
        started_at: "2026-03-03T10:00:00Z",
        completed_at: null,
        url: "https://github.com/owner/repo/actions/runs/3",
      },
    ];

    const result = buildEventTimeline(issues, prs, workflows, []);

    // Most recent should be first
    expect(result[0].timestamp).toBe("2026-03-03T10:00:00Z");
    expect(result[result.length - 1].timestamp).toBe("2026-03-03T08:00:00Z");
  });

  it("handles null and missing timestamps gracefully", () => {
    const workflows: PipelineWorkflowRun[] = [
      {
        id: "1",
        name: "Incomplete",
        status: "in_progress",
        conclusion: null,
        started_at: "2026-03-03T10:00:00Z",
        completed_at: null,
        url: "https://github.com/owner/repo/actions/runs/1",
      },
    ];

    const result = buildEventTimeline([], [], workflows, []);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("workflow_started");
  });

  it("merges all entity types into single sorted timeline", () => {
    const issues: PipelineIssue[] = [
      {
        id: "1",
        number: 1,
        title: "Issue",
        state: "open",
        labels: [],
        dependencies: [],
        assignee: null,
        created_at: "2026-03-03T09:00:00Z",
        updated_at: "2026-03-03T09:00:00Z",
      },
    ];

    const prs: PipelinePR[] = [
      {
        id: "2",
        number: 2,
        title: "PR",
        state: "open",
        linked_issue: 1,
        reviews: [],
        checks: [],
        mergeable: true,
        auto_merge: false,
      },
    ];

    const workflows: PipelineWorkflowRun[] = [
      {
        id: "3",
        name: "Workflow",
        status: "completed",
        conclusion: "success",
        started_at: "2026-03-03T09:30:00Z",
        completed_at: "2026-03-03T09:35:00Z",
        url: "https://github.com/owner/repo/actions/runs/3",
      },
    ];

    const deployments: PipelineDeployment[] = [
      {
        id: "4",
        environment: "production",
        status: "success",
        url: "https://prod.app",
        created_at: "2026-03-03T09:40:00Z",
      },
    ];

    const result = buildEventTimeline(issues, prs, workflows, deployments);

    // Should have: 1 issue_created, 1 pr_created, 2 workflow events, 2 deployment events = 6 total
    expect(result).toHaveLength(6);

    // Verify types are mixed
    const types = result.map((e) => e.type);
    expect(types).toContain("issue_created");
    expect(types).toContain("pr_created");
    expect(types).toContain("workflow_started");
    expect(types).toContain("workflow_completed");
    expect(types).toContain("deployment_started");
    expect(types).toContain("deployment_completed");
  });
});
