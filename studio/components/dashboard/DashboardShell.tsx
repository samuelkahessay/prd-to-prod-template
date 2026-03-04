"use client";

import React, { type ReactNode, useMemo, useState } from "react";

import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { PipelineFlowWrapper } from "@/components/pipeline/PipelineFlowWrapper";
import type { PipelineFlowNode, PipelineNodeClickPayload } from "@/components/pipeline/types";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { buildEventTimeline } from "@/lib/pipeline/events";
import { computePipelineMetrics } from "@/lib/pipeline/metrics";
import { usePipelineOverview } from "@/lib/queries/pipeline";
import { useRepo } from "@/lib/repo/context";

interface DashboardErrorBoundaryProps {
  children: ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  state: DashboardErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Dashboard failed to render", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          data-testid="dashboard-error-boundary"
        >
          <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error?.message ?? "Unexpected dashboard error."}
          </p>
          <button
            className="button-pressable mt-4 rounded-md border px-3 py-2 text-sm font-medium"
            onClick={this.handleRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function toSelectedNode(payload: PipelineNodeClickPayload): PipelineFlowNode {
  return {
    id: payload.id,
    type: payload.type,
    data: payload.data,
    position: { x: 0, y: 0 },
  };
}

function DashboardShellContent() {
  const { currentRepo } = useRepo();
  const owner = currentRepo?.owner ?? null;
  const repo = currentRepo?.repo ?? null;
  const [selectedNode, setSelectedNode] = useState<PipelineFlowNode | null>(null);

  const overviewQuery = usePipelineOverview(owner, repo);

  const overview = overviewQuery.data;
  const issues = overview?.issues ?? [];
  const prs = overview?.pull_requests ?? [];
  const workflows = overview?.workflows ?? [];
  const deployments = overview?.deployments ?? [];

  const metrics = useMemo(
    () => computePipelineMetrics(issues, prs, workflows, deployments),
    [deployments, issues, prs, workflows]
  );

  const events = useMemo(
    () => buildEventTimeline(issues, prs, workflows, deployments),
    [deployments, issues, prs, workflows]
  );

  if (!currentRepo) {
    return <WelcomeScreen showcaseEntries={[]} owner="" repo="" />;
  }

  if (overviewQuery.error) {
    throw overviewQuery.error;
  }

  if (!overviewQuery.isLoading && issues.length === 0) {
    return <WelcomeScreen showcaseEntries={[]} owner={currentRepo.owner} repo={currentRepo.repo} />;
  }

  return (
    <div className="page-fade-in space-y-6" data-testid="dashboard-shell">
      <MetricsBar metrics={metrics} />

      <StatusCards metrics={metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <PipelineFlowWrapper
          issues={issues}
          prs={prs}
          workflows={workflows}
          isLoading={overviewQuery.isLoading}
          onNodeClick={(payload) => {
            setSelectedNode(toSelectedNode(payload));
          }}
        />

        {selectedNode ? (
          <div data-testid="dashboard-control-panel-slot">
            <ControlPanel
              selectedNode={selectedNode}
              owner={currentRepo.owner}
              repo={currentRepo.repo}
              onActionComplete={() => {
                void overviewQuery.refetch();
              }}
            />
          </div>
        ) : null}
      </div>

      <section className="rounded-xl border bg-card p-4" data-testid="dashboard-activity-section">
        <ActivityFeed
          events={events}
          isLoading={overviewQuery.isLoading}
          owner={currentRepo.owner}
          repo={currentRepo.repo}
        />
      </section>
    </div>
  );
}

export function DashboardShell() {
  return (
    <DashboardErrorBoundary>
      <DashboardShellContent />
    </DashboardErrorBoundary>
  );
}
