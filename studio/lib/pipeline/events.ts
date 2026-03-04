import type {
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
  PipelineDeployment,
  PipelineEvent,
} from "@/lib/pipeline/types";

function inferPRTimestamp(
  pr: PipelinePR,
  issues: PipelineIssue[],
  workflows: PipelineWorkflowRun[]
): string {
  if (pr.linked_issue !== null) {
    const linkedIssue = issues.find((i) => i.number === pr.linked_issue);
    if (linkedIssue) {
      const issueTime = new Date(linkedIssue.created_at).getTime();
      return new Date(issueTime + 60000).toISOString();
    }
  }
  
  const firstWorkflow = workflows.find((w) => w.name.includes("repo-assist"));
  if (firstWorkflow) {
    return firstWorkflow.started_at;
  }

  const allTimestamps: string[] = [];
  for (const issue of issues) {
    allTimestamps.push(issue.created_at);
  }
  for (const workflow of workflows) {
    allTimestamps.push(workflow.started_at);
  }

  if (allTimestamps.length > 0) {
    const sorted = allTimestamps
      .map(t => ({ str: t, ms: new Date(t).getTime() }))
      .sort((a, b) => a.ms - b.ms);
    const middleIndex = Math.floor(sorted.length / 2);
    return sorted[middleIndex].str;
  }

  return new Date().toISOString();
}

function inferDeploymentCompletedTimestamp(deployment: PipelineDeployment): string {
  const created = new Date(deployment.created_at);
  const completed = new Date(created.getTime() + 5 * 60 * 1000);
  return completed.toISOString();
}

type EventWithOrder = PipelineEvent & { _order: number };

export function buildEventTimeline(
  issues: PipelineIssue[],
  prs: PipelinePR[],
  workflows: PipelineWorkflowRun[],
  deployments: PipelineDeployment[],
  _comments?: unknown[]
): PipelineEvent[] {
  const events: EventWithOrder[] = [];
  let order = 0;

  for (const issue of issues) {
    events.push({
      type: "issue_created",
      issue,
      timestamp: issue.created_at,
      _order: order++,
    });

    if (issue.state === 'closed') {
      events.push({
        type: "issue_closed",
        issue,
        timestamp: issue.updated_at,
        _order: order++,
      });
    }
  }

  for (const pr of prs) {
    events.push({
      type: "pr_created",
      pr,
      timestamp: inferPRTimestamp(pr, issues, workflows),
      _order: order++,
    });

    if (pr.state === 'merged') {
      events.push({
        type: "pr_merged",
        pr,
        timestamp: inferPRTimestamp(pr, issues, workflows),
        _order: order++,
      });
    }
  }

  for (const workflow of workflows) {
    events.push({
      type: "workflow_started",
      workflow,
      timestamp: workflow.started_at,
      _order: order++,
    });

    if (workflow.completed_at && workflow.status === "completed") {
      events.push({
        type: "workflow_completed",
        workflow,
        timestamp: workflow.completed_at,
        _order: order++,
      });
    }
  }

  for (const deployment of deployments) {
    events.push({
      type: "deployment_started",
      deployment,
      timestamp: deployment.created_at,
      _order: order++,
    });

    if (deployment.status === "success" || deployment.status === "failure") {
      events.push({
        type: "deployment_completed",
        deployment,
        timestamp: inferDeploymentCompletedTimestamp(deployment),
        _order: order++,
      });
    }
  }

  events.sort((a, b) => {
    const timeB = new Date(b.timestamp).getTime();
    const timeA = new Date(a.timestamp).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return a._order - b._order;
  });

  return events.map(({ _order, ...event }) => event);
}
