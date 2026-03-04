"use client";

import {
  FileText,
  FileEdit,
  GitPullRequest,
  GitPullRequestDraft,
  Play,
  CheckCircle,
  XCircle,
  Rocket,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { PipelineEvent } from "@/lib/pipeline/types";
import { formatRelativeTime } from "@/lib/utils/time";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  event: PipelineEvent;
  index?: number;
  owner?: string;
  repo?: string;
}

function getEventIcon(event: PipelineEvent) {
  switch (event.type) {
    case "issue_created":
      return <FileText className="size-4 text-blue-500" />;
    case "issue_updated":
      return <FileEdit className="size-4 text-blue-400" />;
    case "pr_created":
      return <GitPullRequest className="size-4 text-purple-500" />;
    case "pr_updated":
      return <GitPullRequestDraft className="size-4 text-purple-400" />;
    case "workflow_started":
      return <Play className="size-4 text-amber-500" />;
    case "workflow_completed":
      return event.workflow.conclusion === "success" ? (
        <CheckCircle className="size-4 text-green-500" />
      ) : (
        <XCircle className="size-4 text-red-500" />
      );
    case "deployment_started":
      return <Rocket className="size-4 text-violet-500" />;
    case "deployment_completed":
      return event.deployment.status === "success" ? (
        <CheckCircle2 className="size-4 text-green-500" />
      ) : (
        <AlertCircle className="size-4 text-red-500" />
      );
  }
}

function getEventTitle(event: PipelineEvent) {
  switch (event.type) {
    case "issue_created":
      return event.issue.title;
    case "issue_updated":
      return event.issue.title;
    case "pr_created":
      return event.pr.title;
    case "pr_updated":
      return event.pr.title;
    case "workflow_started":
    case "workflow_completed":
      return event.workflow.name;
    case "deployment_started":
    case "deployment_completed":
      return `Deployment to ${event.deployment.environment}`;
  }
}

function getEventDescription(event: PipelineEvent) {
  switch (event.type) {
    case "issue_created":
      return `Issue #${event.issue.number} created`;
    case "issue_updated":
      return `Issue #${event.issue.number} updated`;
    case "pr_created":
      return `PR #${event.pr.number} opened`;
    case "pr_updated":
      return `PR #${event.pr.number} updated`;
    case "workflow_started":
      return "Workflow started";
    case "workflow_completed":
      return event.workflow.conclusion === "success"
        ? "Workflow completed"
        : "Workflow failed";
    case "deployment_started":
      return "Deploying";
    case "deployment_completed":
      return event.deployment.status === "success"
        ? "Deployed successfully"
        : "Deployment failed";
  }
}

function getEventLink(event: PipelineEvent, owner?: string, repo?: string) {
  if (!owner || !repo) return null;

  switch (event.type) {
    case "issue_created":
    case "issue_updated":
      return `https://github.com/${owner}/${repo}/issues/${event.issue.number}`;
    case "pr_created":
    case "pr_updated":
      return `https://github.com/${owner}/${repo}/pull/${event.pr.number}`;
    case "workflow_started":
    case "workflow_completed":
      return event.workflow.url;
    case "deployment_started":
    case "deployment_completed":
      return event.deployment.url;
  }
}

export function ActivityItem({ event, index = 0, owner, repo }: ActivityItemProps) {
  const icon = getEventIcon(event);
  const title = getEventTitle(event);
  const description = getEventDescription(event);
  const link = getEventLink(event, owner, repo);
  const relativeTime = formatRelativeTime(event.timestamp);

  const content = (
    <div className="flex items-start gap-3 group">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/30 transition-colors group-hover:bg-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {title}
          </p>
          <time
            className="text-xs text-muted-foreground shrink-0 tabular-nums"
            dateTime={event.timestamp}
          >
            {relativeTime}
          </time>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="activity-item-stagger block rounded-md px-4 py-3 transition-colors hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ animationDelay: `${Math.min(index, 9) * 55}ms` }}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className="activity-item-stagger px-4 py-3"
      style={{ animationDelay: `${Math.min(index, 9) * 55}ms` }}
    >
      {content}
    </div>
  );
}
