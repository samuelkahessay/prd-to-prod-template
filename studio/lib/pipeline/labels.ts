import type { PipelineIssue, PipelineStage } from './types';

// Label constants for issue classification
export const LABEL_TYPES = {
  feature: 'feature',
  test: 'test',
  infra: 'infra',
  docs: 'docs',
  bug: 'bug',
} as const;

export const LABEL_STATE = {
  pipeline: 'pipeline',
  inProgress: 'in-progress',
  blocked: 'blocked',
  ready: 'ready',
  completed: 'completed',
} as const;

export const LABEL_ARCHITECTURE = {
  draft: 'architecture-draft',
  approved: 'architecture-approved',
} as const;

export const LABEL_REPAIR = {
  ciFailure: 'ci-failure',
  repairInProgress: 'repair-in-progress',
  repairEscalated: 'repair-escalated',
} as const;

/**
 * Type guard to check if a label is a type label
 */
export function isTypeLabel(label: string): label is keyof typeof LABEL_TYPES {
  return (Object.values(LABEL_TYPES) as string[]).includes(label);
}

/**
 * Type guard to check if a label is a state label
 */
export function isStateLabel(label: string): label is keyof typeof LABEL_STATE {
  return (Object.values(LABEL_STATE) as string[]).includes(label);
}

/**
 * Type guard to check if a label is an architecture label
 */
export function isArchitectureLabel(label: string): label is typeof LABEL_ARCHITECTURE[keyof typeof LABEL_ARCHITECTURE] {
  return (Object.values(LABEL_ARCHITECTURE) as string[]).includes(label);
}

/**
 * Type guard to check if a label is a repair label
 */
export function isRepairLabel(label: string): label is typeof LABEL_REPAIR[keyof typeof LABEL_REPAIR] {
  return (Object.values(LABEL_REPAIR) as string[]).includes(label);
}

/**
 * Classifies an issue into its current pipeline stage based on labels.
 *
 * Stage determination logic:
 * - If 'completed' label: complete
 * - If 'ci-failure' or ('repair-in-progress' or 'repair-escalated'): failed
 * - If 'architecture-draft' and not 'architecture-approved': planning
 * - If 'in-progress' label: implementing
 * - If 'ready' label: reviewing
 * - If 'blocked' label: deploying (awaiting deployment or blocked on deployment)
 * - Otherwise: idle
 *
 * @param issue - The pipeline issue to classify
 * @returns The current stage of the issue
 */
export function classifyIssueStage(issue: PipelineIssue): PipelineStage {
  const labels = issue.labels.map((l) => l.toLowerCase());

  // Completed takes highest priority
  if (labels.includes(LABEL_STATE.completed)) {
    return 'complete';
  }

  // Repair/failure state
  if (
    labels.includes(LABEL_REPAIR.ciFailure) ||
    labels.includes(LABEL_REPAIR.repairInProgress) ||
    labels.includes(LABEL_REPAIR.repairEscalated)
  ) {
    return 'failed';
  }

  // Planning/architecture phase
  if (
    labels.includes(LABEL_ARCHITECTURE.draft) &&
    !labels.includes(LABEL_ARCHITECTURE.approved)
  ) {
    return 'planning';
  }

  // In-progress: issue is being implemented
  if (labels.includes(LABEL_STATE.inProgress)) {
    return 'implementing';
  }

  // Ready for review
  if (labels.includes(LABEL_STATE.ready)) {
    return 'reviewing';
  }

  // Blocked (could be on review, deployment, or other gates)
  if (labels.includes(LABEL_STATE.blocked)) {
    return 'deploying';
  }

  // Default to idle if no state label
  return 'idle';
}

/**
 * Get all state labels for an issue
 */
export function getStateLabels(issue: PipelineIssue): string[] {
  return issue.labels.filter((label) => isStateLabel(label));
}

/**
 * Get all type labels for an issue
 */
export function getTypeLabels(issue: PipelineIssue): string[] {
  return issue.labels.filter((label) => isTypeLabel(label));
}

/**
 * Get all repair labels for an issue
 */
export function getRepairLabels(issue: PipelineIssue): string[] {
  return issue.labels.filter((label) => isRepairLabel(label));
}

/**
 * Check if issue is in a failed/repair state
 */
export function isInRepair(issue: PipelineIssue): boolean {
  const labels = issue.labels.map((l) => l.toLowerCase());
  return labels.some((label) => isRepairLabel(label));
}

/**
 * Check if issue has completed
 */
export function isCompleted(issue: PipelineIssue): boolean {
  return issue.labels.map((l) => l.toLowerCase()).includes(LABEL_STATE.completed);
}
