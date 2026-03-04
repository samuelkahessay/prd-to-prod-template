import type {
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
  PipelineDeployment,
  PipelineStage,
} from './types';

export interface IssueCounts {
  total: number;
  open: number;
  closed: number;
  inProgress: number;
  completed: number;
}

export interface PRCounts {
  total: number;
  open: number;
  merged: number;
  approved: number;
  awaitingReview: number;
}

export interface WorkflowCounts {
  total: number;
  success: number;
  failed: number;
  inProgress: number;
}

export interface DeploymentStatus {
  environment: string;
  status: 'pending' | 'in_progress' | 'success' | 'failure';
  url: string;
  timestamp: string;
}

export interface LastWorkflowRun {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | null;
  timestamp: string;
  url: string;
}

export interface PipelineMetrics {
  issueCounts: IssueCounts;
  prCounts: PRCounts;
  workflowCounts: WorkflowCounts;
  deploymentStatus: DeploymentStatus | null;
  issueProgress: number;
  prMergeRate: number;
  workflowSuccessRate: number;
  currentStage: PipelineStage;
  healthScore: number;
  lastWorkflowRun: LastWorkflowRun | null;
}

function computeIssueCounts(issues: PipelineIssue[]): IssueCounts {
  const open = issues.filter((i) => i.state === 'open').length;
  const closed = issues.filter((i) => i.state === 'closed').length;
  const inProgress = issues.filter((i) => i.labels.includes('in-progress')).length;

  return {
    total: issues.length,
    open,
    closed,
    inProgress,
    completed: closed,
  };
}

function computePRCounts(prs: PipelinePR[]): PRCounts {
  const open = prs.filter((pr) => pr.state === 'open').length;
  const merged = prs.filter((pr) => pr.state === 'merged').length;
  const approved = prs.filter(
    (pr) =>
      pr.state === 'open' &&
      pr.reviews.some((r) => r.state === 'APPROVED')
  ).length;
  const awaitingReview = prs.filter(
    (pr) =>
      pr.state === 'open' &&
      pr.reviews.every((r) => r.state === 'PENDING' || r.state === 'COMMENTED')
  ).length;

  return {
    total: prs.length,
    open,
    merged,
    approved,
    awaitingReview,
  };
}

function computeWorkflowCounts(workflows: PipelineWorkflowRun[]): WorkflowCounts {
  const completed = workflows.filter((w) => w.status === 'completed');
  const success = completed.filter((w) => w.conclusion === 'success').length;
  const failed = completed.filter((w) => w.conclusion === 'failure').length;
  const inProgress = workflows.filter(
    (w) => w.status === 'in_progress' || w.status === 'queued'
  ).length;

  return {
    total: workflows.length,
    success,
    failed,
    inProgress,
  };
}

function getLatestDeployment(
  deployments: PipelineDeployment[]
): DeploymentStatus | null {
  if (deployments.length === 0) return null;

  const sorted = [...deployments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const latest = sorted[0];
  return {
    environment: latest.environment,
    status: latest.status,
    url: latest.url,
    timestamp: latest.created_at,
  };
}

function getLastWorkflowRun(
  workflows: PipelineWorkflowRun[]
): LastWorkflowRun | null {
  if (workflows.length === 0) return null;

  const sorted = [...workflows].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  const latest = sorted[0];
  return {
    name: latest.name,
    status: latest.status,
    conclusion: latest.conclusion,
    timestamp: latest.started_at,
    url: latest.url,
  };
}

function inferCurrentStage(
  issues: PipelineIssue[],
  prs: PipelinePR[],
  workflows: PipelineWorkflowRun[],
  deployments: PipelineDeployment[]
): PipelineStage {
  const activeWorkflow = workflows.find((w) => w.status === 'in_progress');
  if (activeWorkflow) {
    if (activeWorkflow.name.includes('decomposer')) return 'decomposing';
    if (activeWorkflow.name.includes('assist')) return 'implementing';
    if (activeWorkflow.name.includes('review')) return 'reviewing';
    if (activeWorkflow.name.includes('deploy')) return 'deploying';
  }

  const activeDeployment = deployments.find(
    (d) => d.status === 'in_progress' || d.status === 'pending'
  );
  if (activeDeployment) return 'deploying';

  const recentFailure = workflows
    .filter((w) => w.status === 'completed' && w.conclusion === 'failure')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
  if (recentFailure) {
    const recentSuccess = workflows
      .filter((w) => w.status === 'completed' && w.conclusion === 'success')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
    
    if (
      !recentSuccess ||
      new Date(recentFailure.started_at) > new Date(recentSuccess.started_at)
    ) {
      return 'failed';
    }
  }

  const hasOpenIssues = issues.some((i) => i.state === 'open');
  const hasOpenPRs = prs.some((pr) => pr.state === 'open');

  if (hasOpenIssues && hasOpenPRs) return 'implementing';
  if (hasOpenPRs) return 'reviewing';
  if (hasOpenIssues) return 'planning';

  const hasClosedIssues = issues.some((i) => i.state === 'closed');
  if (hasClosedIssues && !hasOpenIssues && !hasOpenPRs) return 'complete';

  return 'idle';
}

export function computePipelineMetrics(
  issues: PipelineIssue[],
  prs: PipelinePR[],
  workflows: PipelineWorkflowRun[],
  deployments: PipelineDeployment[]
): PipelineMetrics {
  const issueCounts = computeIssueCounts(issues);
  const prCounts = computePRCounts(prs);
  const workflowCounts = computeWorkflowCounts(workflows);
  const deploymentStatus = getLatestDeployment(deployments);
  const lastWorkflowRun = getLastWorkflowRun(workflows);

  const issueProgress =
    issueCounts.total > 0 ? (issueCounts.completed / issueCounts.total) * 100 : 0;

  const prMergeRate =
    prCounts.total > 0 ? (prCounts.merged / prCounts.total) * 100 : 0;

  const workflowSuccessRate =
    workflowCounts.success + workflowCounts.failed > 0
      ? (workflowCounts.success / (workflowCounts.success + workflowCounts.failed)) *
        100
      : 0;

  const currentStage = inferCurrentStage(issues, prs, workflows, deployments);

  const healthScore =
    workflows.length > 0 ? Math.round(workflowSuccessRate) : 100;

  return {
    issueCounts,
    prCounts,
    workflowCounts,
    deploymentStatus,
    issueProgress,
    prMergeRate,
    workflowSuccessRate,
    currentStage,
    healthScore,
    lastWorkflowRun,
  };
}
