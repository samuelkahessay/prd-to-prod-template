import {
  Activity,
  FileText,
  FolderOpen,
  GitPullRequest,
  Package,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateVariant =
  | "no-repo"
  | "no-pipeline"
  | "no-issues"
  | "no-prs"
  | "no-activity"
  | "no-workflows";

interface EmptyStateProps {
  variant: EmptyStateVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

interface VariantConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  defaultAction?: {
    label: string;
  };
}

const variantConfig: Record<EmptyStateVariant, VariantConfig> = {
  "no-repo": {
    icon: Package,
    title: "No repository connected",
    description: "Connect a repository to get started",
    defaultAction: {
      label: "Go to Settings",
    },
  },
  "no-pipeline": {
    icon: FileText,
    title: "No active pipeline",
    description: "Submit a PRD to start a pipeline run",
    defaultAction: {
      label: "Create PRD",
    },
  },
  "no-issues": {
    icon: FolderOpen,
    title: "No pipeline issues",
    description: "Issues will appear when a PRD is decomposed",
  },
  "no-prs": {
    icon: GitPullRequest,
    title: "No pull requests",
    description: "PRs will appear when issues are being implemented",
  },
  "no-activity": {
    icon: Activity,
    title: "No recent activity",
    description: "Events will stream in as the pipeline progresses",
  },
  "no-workflows": {
    icon: Workflow,
    title: "No workflow runs",
    description: "Workflows trigger automatically during pipeline execution",
  },
};

export function EmptyState({ variant, action, className }: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      data-testid="empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{config.title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{config.description}</p>
      {action && (
        <Button
          variant="outline"
          onClick={action.onClick}
          data-testid="empty-state-action"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
