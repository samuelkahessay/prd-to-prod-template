/**
 * Core TypeScript types for the prd-to-prod pipeline.
 * These types represent all pipeline entities and their relationships.
 */

/**
 * Represents a GitHub issue in the pipeline.
 * Issues are created by the prd-decomposer and tracked throughout their lifecycle.
 */
export interface PipelineIssue {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  /** Array of issue numbers this issue depends on (parsed from labels/description) */
  dependencies: number[];
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a GitHub Pull Request in the pipeline.
 * PRs are created by repo-assist to implement issues.
 */
export interface PipelinePR {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  /** Issue number this PR is linked to (from "Closes #N") */
  linked_issue: number | null;
  reviews: ReviewStatus[];
  checks: CheckRun[];
  mergeable: boolean;
  auto_merge: boolean;
}

/**
 * Represents a review status on a PR.
 */
export interface ReviewStatus {
  reviewer: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
  submitted_at: string | null;
}

/**
 * Represents a CI/CD check run result.
 */
export interface CheckRun {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | null;
  completed_at: string | null;
}

/**
 * Represents a GitHub Actions workflow run.
 * Used to track decomposer, repo-assist, review, and deploy jobs.
 */
export interface PipelineWorkflowRun {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | null;
  started_at: string;
  completed_at: string | null;
  url: string;
}

/**
 * Represents a deployment to an environment.
 * Created when a PR is merged or when manual deployment is triggered.
 */
export interface PipelineDeployment {
  id: string;
  environment: string;
  status: 'pending' | 'in_progress' | 'success' | 'failure';
  url: string;
  created_at: string;
}

/**
 * Pipeline lifecycle stage enum.
 * Represents where a PRD/run is in the prd-to-deploy cycle.
 */
export type PipelineStage =
  | 'planning'
  | 'decomposing'
  | 'implementing'
  | 'reviewing'
  | 'deploying'
  | 'complete'
  | 'failed'
  | 'idle';

/**
 * Union type for activity feed events.
 * Represents any significant action in the pipeline.
 */
export type PipelineEvent =
  | { type: 'issue_created'; issue: PipelineIssue; timestamp: string }
  | {
      type: 'issue_updated';
      issue: PipelineIssue;
      changes: Partial<PipelineIssue>;
      timestamp: string;
    }
  | { type: 'issue_closed'; issue: PipelineIssue; timestamp: string }
  | { type: 'pr_created'; pr: PipelinePR; timestamp: string }
  | {
      type: 'pr_updated';
      pr: PipelinePR;
      changes: Partial<PipelinePR>;
      timestamp: string;
    }
  | { type: 'pr_merged'; pr: PipelinePR; timestamp: string }
  | { type: 'workflow_started'; workflow: PipelineWorkflowRun; timestamp: string }
  | {
      type: 'workflow_completed';
      workflow: PipelineWorkflowRun;
      timestamp: string;
    }
  | { type: 'deployment_started'; deployment: PipelineDeployment; timestamp: string }
  | {
      type: 'deployment_completed';
      deployment: PipelineDeployment;
      timestamp: string;
    };

/**
 * Represents a full PRD-to-deploy cycle.
 * Aggregates all entities involved in implementing a single PRD.
 */
export interface PipelineRun {
  id: string;
  prd_number: number | null;
  stage: PipelineStage;
  issues: PipelineIssue[];
  pull_requests: PipelinePR[];
  workflows: PipelineWorkflowRun[];
  deployments: PipelineDeployment[];
  created_at: string;
  updated_at: string;
}

/**
 * Represents a completed pipeline run archived in showcase/.
 * Created by scripts/archive-run.sh after completing a PRD cycle.
 */
export interface ShowcaseEntry {
  /** Directory name (e.g., "01-user-auth-system") */
  slug: string;
  /** Run number (e.g., "01") */
  runNumber: string;
  /** Project name extracted from slug (e.g., "user-auth-system") */
  projectName: string;
  /** Title from README.md */
  title: string;
  /** Git tag (e.g., "v1.0.0") */
  tag: string;
  /** Date string (e.g., "March 2026") */
  date: string;
  /** Deployment URL if available */
  deploymentUrl?: string;
  /** Number of pipeline issues */
  issueCount?: string;
  /** Number of PRs merged */
  prCount?: string;
  /** Brief summary/description */
  summary?: string;
}
