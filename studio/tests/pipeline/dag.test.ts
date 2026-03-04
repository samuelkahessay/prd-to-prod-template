import { describe, expect, it } from 'vitest';
import type { PipelineIssue, PipelinePR, PipelineWorkflowRun } from '@/lib/pipeline/types';
import { buildPipelineDAG, parseDependencies } from '@/lib/pipeline/dag';

function createIssue(overrides: Partial<PipelineIssue> = {}): PipelineIssue {
  return {
    id: 'issue-1',
    number: 1,
    title: 'Issue 1',
    state: 'open',
    labels: [],
    dependencies: [],
    assignee: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function createPR(overrides: Partial<PipelinePR> = {}): PipelinePR {
  return {
    id: 'pr-1',
    number: 1,
    title: 'PR 1',
    state: 'open',
    linked_issue: null,
    reviews: [],
    checks: [],
    mergeable: true,
    auto_merge: false,
    ...overrides,
  };
}

function createWorkflow(overrides: Partial<PipelineWorkflowRun> = {}): PipelineWorkflowRun {
  return {
    id: 'workflow-1',
    name: 'deploy',
    status: 'completed',
    conclusion: 'success',
    started_at: '2026-01-01T00:00:00Z',
    completed_at: '2026-01-01T00:10:00Z',
    url: 'https://example.com/workflow',
    ...overrides,
  };
}

describe('parseDependencies', () => {
  it('extracts all dependency issue numbers from dependency lines', () => {
    const body = [
      '## Plan',
      'Depends on #12',
      'depends on #7, #24',
      'Depends on #12 and #34',
      'Related to #99',
    ].join('\n');

    expect(parseDependencies(body)).toEqual([12, 7, 24, 34]);
  });

  it('returns an empty array for empty body or without dependency declarations', () => {
    expect(parseDependencies('')).toEqual([]);
    expect(parseDependencies('Related to #11')).toEqual([]);
  });
});

describe('buildPipelineDAG', () => {
  it('builds prd, issue, pr, and deploy nodes with typed edges and coordinates', () => {
    const issues: PipelineIssue[] = [
      createIssue({ number: 1, title: 'Initial issue', labels: ['in-progress'] }),
      createIssue({ number: 2, title: 'Depends on 1', dependencies: [1], labels: ['ready'] }),
      createIssue({ number: 3, title: 'Unknown dependency', dependencies: [99], labels: ['blocked'] }),
    ];

    const prs: PipelinePR[] = [
      createPR({ number: 11, linked_issue: 2, title: 'Implements #2' }),
      createPR({ number: 12, linked_issue: null, state: 'merged', title: 'Misc merged PR' }),
      createPR({ number: 13, linked_issue: 99, state: 'merged', title: 'Unknown issue link' }),
    ];

    const workflows: PipelineWorkflowRun[] = [
      createWorkflow({ id: 'deploy-1', name: 'Deploy to Production', conclusion: 'success' }),
    ];

    const { nodes, edges } = buildPipelineDAG(issues, prs, workflows);

    expect(nodes).toHaveLength(8);
    expect(nodes.map((node) => node.type)).toEqual(
      expect.arrayContaining(['prd-node', 'issue-node', 'pr-node', 'deploy-node'])
    );

    const nodeIds = new Set(nodes.map((node) => node.id));
    expect(nodeIds.has('prd-root')).toBe(true);
    expect(nodeIds.has('issue-1')).toBe(true);
    expect(nodeIds.has('issue-2')).toBe(true);
    expect(nodeIds.has('issue-3')).toBe(true);
    expect(nodeIds.has('pr-11')).toBe(true);
    expect(nodeIds.has('pr-12')).toBe(true);
    expect(nodeIds.has('pr-13')).toBe(true);
    expect(nodeIds.has('deploy-deploy-1')).toBe(true);

    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'prd-root', target: 'issue-1', type: 'dependency' }),
        expect.objectContaining({ source: 'issue-1', target: 'issue-2', type: 'dependency' }),
        expect.objectContaining({ source: 'prd-root', target: 'issue-3', type: 'dependency' }),
        expect.objectContaining({ source: 'issue-2', target: 'pr-11', type: 'implementation' }),
        expect.objectContaining({ source: 'pr-12', target: 'deploy-deploy-1', type: 'deployment' }),
        expect.objectContaining({ source: 'pr-13', target: 'deploy-deploy-1', type: 'deployment' }),
      ])
    );

    for (const node of nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
      expect(node.data.title.length).toBeGreaterThan(0);
      expect(node.data.statusColor).toMatch(/^#/);
    }
  });
});
