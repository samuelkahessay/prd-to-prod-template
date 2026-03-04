import { Activity, CheckCircle2, GitPullRequest, Layers, Rocket } from 'lucide-react';

import type { PipelineMetrics } from '@/lib/pipeline/metrics';
import { cn } from '@/lib/utils';

interface MetricsBarProps {
  metrics: PipelineMetrics;
  className?: string;
}

export function MetricsBar({ metrics, className }: MetricsBarProps) {
  return (
    <div
      data-testid="metrics-bar"
      className={cn(
        'flex items-center gap-6 overflow-x-auto rounded-lg border bg-card px-6 py-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <div
        data-testid="metrics-bar-issues"
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-lg font-bold">{metrics.issueCounts.total}</div>
          <div className="text-xs text-muted-foreground">
            {metrics.issueProgress.toFixed(0)}% done
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div
        data-testid="metrics-bar-prs"
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <GitPullRequest className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-lg font-bold">{metrics.prCounts.open}</div>
          <div className="text-xs text-muted-foreground">
            {metrics.prCounts.merged} merged
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div
        data-testid="metrics-bar-workflows"
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <Activity className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-lg font-bold">{metrics.workflowCounts.total}</div>
          <div className="text-xs text-muted-foreground">
            {metrics.workflowSuccessRate.toFixed(0)}% success
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div
        data-testid="metrics-bar-deployments"
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <Rocket className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-lg font-bold">
            {metrics.deploymentStatus?.environment || '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.deploymentStatus?.status || 'none'}
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div
        data-testid="metrics-bar-stage"
        className="flex items-center gap-2 whitespace-nowrap"
      >
        <Layers className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-lg font-bold capitalize">{metrics.currentStage}</div>
          <div className="text-xs text-muted-foreground">
            {metrics.healthScore}% health
          </div>
        </div>
      </div>
    </div>
  );
}
