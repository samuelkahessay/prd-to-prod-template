import dagre from 'dagre';
import { Edge, Node, Position } from '@xyflow/react';
import { classifyIssueStage } from '@/lib/pipeline/labels';
import type { PipelineIssue, PipelinePR, PipelineStage, PipelineWorkflowRun } from '@/lib/pipeline/types';

const PRD_NODE_ID = 'prd-root';

const NODE_DIMENSIONS: Record<PipelineDAGNodeType, { width: number; height: number }> = {
  'prd-node': { width: 300, height: 96 },
  'issue-node': { width: 320, height: 120 },
  'pr-node': { width: 320, height: 120 },
  'deploy-node': { width: 280, height: 104 },
};

const STATUS_COLORS = {
  neutral: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  progress: '#2563eb',
  info: '#0891b2',
  danger: '#dc2626',
};

export type PipelineDAGNodeType = 'prd-node' | 'issue-node' | 'pr-node' | 'deploy-node';
export type PipelineDAGEdgeType = 'dependency' | 'implementation' | 'deployment';

export interface PipelineDAGNodeData extends Record<string, unknown> {
  title: string;
  number: number | null;
  stage: PipelineStage;
  statusColor: string;
}

export type PipelineDAGNode = Node<PipelineDAGNodeData, PipelineDAGNodeType>;
export type PipelineDAGEdge = Edge<Record<string, never>, PipelineDAGEdgeType>;

export function parseDependencies(issueBody: string): number[] {
  if (!issueBody.trim()) {
    return [];
  }

  const dependencies: number[] = [];
  const seen = new Set<number>();
  const lines = issueBody.split(/\r?\n/);

  for (const line of lines) {
    if (!/\bdepends\s+on\b/i.test(line)) {
      continue;
    }

    const matches = line.matchAll(/#(\d+)/g);
    for (const match of matches) {
      const dependencyNumber = Number.parseInt(match[1], 10);
      if (!seen.has(dependencyNumber)) {
        seen.add(dependencyNumber);
        dependencies.push(dependencyNumber);
      }
    }
  }

  return dependencies;
}

export function buildPipelineDAG(
  issues: PipelineIssue[],
  prs: PipelinePR[],
  workflows: PipelineWorkflowRun[]
): { nodes: PipelineDAGNode[]; edges: PipelineDAGEdge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 72,
    ranksep: 88,
    marginx: 24,
    marginy: 24,
  });

  const nodes: PipelineDAGNode[] = [];
  const edges: PipelineDAGEdge[] = [];

  const issueByNumber = new Map(issues.map((issue) => [issue.number, issue]));

  const prdNode: PipelineDAGNode = {
    id: PRD_NODE_ID,
    type: 'prd-node',
    position: { x: 0, y: 0 },
    data: {
      title: 'PRD',
      number: null,
      stage: inferRootStage(workflows),
      statusColor: inferRootStatusColor(workflows),
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };
  nodes.push(prdNode);

  for (const issue of issues) {
    const issueNodeId = getIssueNodeId(issue.number);
    const issueStage = classifyIssueStage(issue);

    nodes.push({
      id: issueNodeId,
      type: 'issue-node',
      position: { x: 0, y: 0 },
      data: {
        title: issue.title,
        number: issue.number,
        stage: issueStage,
        statusColor: getIssueStatusColor(issue.labels),
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    const validDependencies = issue.dependencies.filter((dependencyNumber) =>
      issueByNumber.has(dependencyNumber)
    );

    if (validDependencies.length === 0) {
      edges.push({
        id: `dependency-${PRD_NODE_ID}-${issueNodeId}`,
        source: PRD_NODE_ID,
        target: issueNodeId,
        type: 'dependency',
      });
      continue;
    }

    for (const dependencyNumber of validDependencies) {
      const sourceId = getIssueNodeId(dependencyNumber);
      edges.push({
        id: `dependency-${sourceId}-${issueNodeId}`,
        source: sourceId,
        target: issueNodeId,
        type: 'dependency',
      });
    }
  }

  for (const pr of prs) {
    const prNodeId = getPRNodeId(pr.number);
    nodes.push({
      id: prNodeId,
      type: 'pr-node',
      position: { x: 0, y: 0 },
      data: {
        title: pr.title,
        number: pr.number,
        stage: getPRStage(pr),
        statusColor: getPRStatusColor(pr),
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    if (pr.linked_issue === null) {
      continue;
    }

    if (!issueByNumber.has(pr.linked_issue)) {
      continue;
    }

    edges.push({
      id: `implementation-${getIssueNodeId(pr.linked_issue)}-${prNodeId}`,
      source: getIssueNodeId(pr.linked_issue),
      target: prNodeId,
      type: 'implementation',
    });
  }

  const deploymentWorkflows = workflows.filter((workflow) =>
    /deploy|deployment|release/i.test(workflow.name)
  );

  const deploymentSourcePRs = prs.filter((pr) => pr.state === 'merged');

  for (const workflow of deploymentWorkflows) {
    const deployNodeId = getDeployNodeId(workflow.id);

    nodes.push({
      id: deployNodeId,
      type: 'deploy-node',
      position: { x: 0, y: 0 },
      data: {
        title: workflow.name,
        number: null,
        stage: getWorkflowStage(workflow),
        statusColor: getWorkflowStatusColor(workflow),
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    for (const pr of deploymentSourcePRs) {
      edges.push({
        id: `deployment-${getPRNodeId(pr.number)}-${deployNodeId}`,
        source: getPRNodeId(pr.number),
        target: deployNodeId,
        type: 'deployment',
      });
    }
  }

  for (const node of nodes) {
    const dimensions = NODE_DIMENSIONS[node.type ?? 'issue-node'];
    graph.setNode(node.id, dimensions);
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const laidOutNodes = nodes.map((node) => {
    const positionedNode = graph.node(node.id);
    const dimensions = NODE_DIMENSIONS[node.type ?? 'issue-node'];

    return {
      ...node,
      position: {
        x: positionedNode.x - dimensions.width / 2,
        y: positionedNode.y - dimensions.height / 2,
      },
    };
  });

  return {
    nodes: laidOutNodes,
    edges,
  };
}

function getIssueNodeId(issueNumber: number): string {
  return `issue-${issueNumber}`;
}

function getPRNodeId(prNumber: number): string {
  return `pr-${prNumber}`;
}

function getDeployNodeId(workflowId: string): string {
  return `deploy-${workflowId}`;
}

function getIssueStatusColor(labels: string[]): string {
  const normalizedLabels = labels.map((label) => label.toLowerCase());

  if (normalizedLabels.includes('completed')) {
    return STATUS_COLORS.success;
  }

  if (
    normalizedLabels.includes('ci-failure') ||
    normalizedLabels.includes('repair-in-progress') ||
    normalizedLabels.includes('repair-escalated')
  ) {
    return STATUS_COLORS.danger;
  }

  if (normalizedLabels.includes('blocked')) {
    return STATUS_COLORS.warning;
  }

  if (normalizedLabels.includes('in-progress')) {
    return STATUS_COLORS.progress;
  }

  if (normalizedLabels.includes('ready')) {
    return STATUS_COLORS.info;
  }

  return STATUS_COLORS.neutral;
}

function getPRStage(pr: PipelinePR): PipelineStage {
  if (pr.state === 'merged') {
    return 'complete';
  }

  if (pr.state === 'closed') {
    return 'failed';
  }

  return 'reviewing';
}

function getPRStatusColor(pr: PipelinePR): string {
  if (pr.state === 'merged') {
    return STATUS_COLORS.success;
  }

  if (pr.state === 'closed') {
    return STATUS_COLORS.danger;
  }

  if (pr.reviews.some((review) => review.state === 'CHANGES_REQUESTED')) {
    return STATUS_COLORS.warning;
  }

  if (pr.checks.some((check) => check.status === 'in_progress')) {
    return STATUS_COLORS.progress;
  }

  return STATUS_COLORS.info;
}

function getWorkflowStage(workflow: PipelineWorkflowRun): PipelineStage {
  if (workflow.status === 'in_progress' || workflow.status === 'queued') {
    return 'deploying';
  }

  if (workflow.conclusion === 'success') {
    return 'complete';
  }

  if (workflow.conclusion === 'failure' || workflow.conclusion === 'cancelled') {
    return 'failed';
  }

  return 'idle';
}

function getWorkflowStatusColor(workflow: PipelineWorkflowRun): string {
  if (workflow.status === 'in_progress' || workflow.status === 'queued') {
    return STATUS_COLORS.progress;
  }

  if (workflow.conclusion === 'success') {
    return STATUS_COLORS.success;
  }

  if (workflow.conclusion === 'failure' || workflow.conclusion === 'cancelled') {
    return STATUS_COLORS.danger;
  }

  return STATUS_COLORS.neutral;
}

function inferRootStage(workflows: PipelineWorkflowRun[]): PipelineStage {
  if (workflows.some((workflow) => workflow.status === 'in_progress' || workflow.status === 'queued')) {
    return 'decomposing';
  }

  if (workflows.some((workflow) => workflow.conclusion === 'failure' || workflow.conclusion === 'cancelled')) {
    return 'failed';
  }

  if (workflows.length > 0 && workflows.every((workflow) => workflow.conclusion === 'success')) {
    return 'complete';
  }

  return 'idle';
}

function inferRootStatusColor(workflows: PipelineWorkflowRun[]): string {
  if (workflows.some((workflow) => workflow.status === 'in_progress' || workflow.status === 'queued')) {
    return STATUS_COLORS.progress;
  }

  if (workflows.some((workflow) => workflow.conclusion === 'failure' || workflow.conclusion === 'cancelled')) {
    return STATUS_COLORS.danger;
  }

  if (workflows.length > 0 && workflows.every((workflow) => workflow.conclusion === 'success')) {
    return STATUS_COLORS.success;
  }

  return STATUS_COLORS.neutral;
}
