import { PipelineFlow } from "@/components/pipeline/PipelineFlow";
import type { PipelineNodeClickPayload } from "@/components/pipeline/types";
import type { PipelineIssue, PipelinePR, PipelineWorkflowRun } from "@/lib/pipeline/types";

interface PipelineFlowWrapperProps {
  issues: PipelineIssue[];
  prs: PipelinePR[];
  workflows: PipelineWorkflowRun[];
  isLoading?: boolean;
  error?: string | null;
  onNodeClick?: (payload: PipelineNodeClickPayload) => void;
}

export function PipelineFlowWrapper({
  issues,
  prs,
  workflows,
  isLoading = false,
  error,
  onNodeClick,
}: PipelineFlowWrapperProps) {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <div
          className="h-[560px] min-w-[640px] w-full animate-pulse rounded-xl border bg-muted/30 sm:min-w-0"
          data-testid="pipeline-flow-loading"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full overflow-x-auto">
        <div
          className="flex h-[560px] min-w-[640px] w-full items-center justify-center rounded-xl border bg-card px-6 text-sm text-destructive sm:min-w-0"
          data-testid="pipeline-flow-error"
        >
          {error}
        </div>
      </div>
    );
  }

  if (issues.length === 0 && prs.length === 0 && workflows.length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <div
          className="flex h-[560px] min-w-[640px] w-full items-center justify-center rounded-xl border bg-card px-6 text-sm text-muted-foreground sm:min-w-0"
          data-testid="pipeline-flow-empty"
        >
          No pipeline activity yet.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <PipelineFlow
        className="min-w-[640px] sm:min-w-0"
        issues={issues}
        prs={prs}
        workflows={workflows}
        onNodeClick={onNodeClick}
      />
    </div>
  );
}
