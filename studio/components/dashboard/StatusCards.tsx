"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  GitPullRequest,
  Layers,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineMetrics } from '@/lib/pipeline/metrics';
import { PIPELINE_STATUS_COLORS } from '@/lib/theme';

interface StatusCardsProps {
  metrics: PipelineMetrics;
}

const SHOULD_ANIMATE_COUNTS = process.env.NODE_ENV !== "test";

function useAnimatedNumber(value: number, duration = 650): number {
  const [displayValue, setDisplayValue] = useState(() =>
    SHOULD_ANIMATE_COUNTS ? 0 : Math.round(value)
  );
  const displayRef = useRef(displayValue);

  useEffect(() => {
    displayRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    if (!SHOULD_ANIMATE_COUNTS) {
      setDisplayValue(Math.round(value));
      return;
    }

    const startValue = displayRef.current;
    const targetValue = Math.round(value);
    const startedAt = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startValue + (targetValue - startValue) * eased);
      setDisplayValue(next);

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return displayValue;
}

function getStageColor(
  stage: PipelineMetrics['currentStage']
): keyof typeof PIPELINE_STATUS_COLORS {
  switch (stage) {
    case 'complete':
      return 'success';
    case 'failed':
      return 'failed';
    case 'deploying':
    case 'implementing':
    case 'decomposing':
    case 'reviewing':
      return 'in_progress';
    case 'planning':
      return 'pending';
    case 'idle':
    default:
      return 'idle';
  }
}

function getDeploymentColor(
  status: 'pending' | 'in_progress' | 'success' | 'failure'
): keyof typeof PIPELINE_STATUS_COLORS {
  switch (status) {
    case 'success':
      return 'success';
    case 'failure':
      return 'failed';
    case 'in_progress':
      return 'in_progress';
    case 'pending':
      return 'pending';
  }
}

function getWorkflowColor(
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | null
): keyof typeof PIPELINE_STATUS_COLORS {
  switch (conclusion) {
    case 'success':
      return 'success';
    case 'failure':
      return 'failed';
    case null:
      return 'in_progress';
    default:
      return 'idle';
  }
}

export function StatusCards({ metrics }: StatusCardsProps) {
  const stageColor = PIPELINE_STATUS_COLORS[getStageColor(metrics.currentStage)];
  const animatedIssueTotal = useAnimatedNumber(metrics.issueCounts.total);
  const animatedPrOpen = useAnimatedNumber(metrics.prCounts.open);
  const animatedWorkflowTotal = useAnimatedNumber(metrics.workflowCounts.total);

  return (
    <div
      data-testid="status-cards"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5"
    >
      <Card
        data-testid="card-issues"
        className={`border-l-4 ${stageColor.border}`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            <Badge variant="outline" className={stageColor.text}>
              {metrics.issueProgress.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardTitle className="text-4xl font-bold">
            {animatedIssueTotal}
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">Issues</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>{metrics.issueCounts.open} open</div>
            <div>{metrics.issueCounts.inProgress} in progress</div>
            <div>{metrics.issueCounts.completed} completed</div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-prs">
        <CardHeader>
          <div className="flex items-start justify-between">
            <GitPullRequest className="h-10 w-10 text-muted-foreground" />
            <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
              {metrics.prMergeRate.toFixed(0)}% merged
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardTitle className="text-4xl font-bold">
            {animatedPrOpen}
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">Pull Requests</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>{metrics.prCounts.open} open</div>
            <div>{metrics.prCounts.approved} approved</div>
            <div>{metrics.prCounts.merged} merged</div>
            <div>{metrics.prCounts.awaitingReview} awaiting review</div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-workflows">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Activity className="h-10 w-10 text-muted-foreground" />
            <Badge
              variant="outline"
              className={
                metrics.workflowSuccessRate >= 80
                  ? 'text-green-600 dark:text-green-400'
                  : metrics.workflowSuccessRate >= 60
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }
            >
              {metrics.workflowSuccessRate.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardTitle className="text-4xl font-bold">
            {animatedWorkflowTotal}
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">Workflow Runs</p>
          {metrics.lastWorkflowRun ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Last: {metrics.lastWorkflowRun.name}</div>
              <div
                className={
                  PIPELINE_STATUS_COLORS[
                    getWorkflowColor(metrics.lastWorkflowRun.conclusion)
                  ].text
                }
              >
                {metrics.lastWorkflowRun.conclusion || metrics.lastWorkflowRun.status}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No runs</div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-deployments">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Rocket className="h-10 w-10 text-muted-foreground" />
            {metrics.deploymentStatus && (
              <Badge
                variant="outline"
                className={
                  PIPELINE_STATUS_COLORS[
                    getDeploymentColor(metrics.deploymentStatus.status)
                  ].text
                }
              >
                {metrics.deploymentStatus.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.deploymentStatus ? (
            <>
              <CardTitle className="text-2xl font-bold capitalize">
                {metrics.deploymentStatus.environment}
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground">
                Latest Deployment
              </p>
              <Link
                href={metrics.deploymentStatus.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
              >
                View deployment
              </Link>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold">—</CardTitle>
              <p className="text-sm font-medium text-muted-foreground">
                No deployments
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card
        data-testid="card-stage"
        className={`border-l-4 ${stageColor.border}`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <Layers className="h-10 w-10 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardTitle className="text-2xl font-bold capitalize">
            {metrics.currentStage}
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Pipeline Stage
          </p>
          <div className="pt-2">
            <Badge variant="outline" className={stageColor.text}>
              Health: {metrics.healthScore}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
