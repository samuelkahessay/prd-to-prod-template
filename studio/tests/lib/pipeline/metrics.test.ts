import { describe, it, expect } from 'vitest';
import { computePipelineMetrics } from '@/lib/pipeline/metrics';
import type {
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
  PipelineDeployment,
} from '@/lib/pipeline/types';

describe('computePipelineMetrics', () => {
  describe('empty data', () => {
    it('should handle empty arrays', () => {
      const metrics = computePipelineMetrics([], [], [], []);

      expect(metrics.issueCounts).toEqual({
        total: 0,
        open: 0,
        closed: 0,
        inProgress: 0,
        completed: 0,
      });
      expect(metrics.prCounts).toEqual({
        total: 0,
        open: 0,
        merged: 0,
        approved: 0,
        awaitingReview: 0,
      });
      expect(metrics.workflowCounts).toEqual({
        total: 0,
        success: 0,
        failed: 0,
        inProgress: 0,
      });
      expect(metrics.deploymentStatus).toBeNull();
      expect(metrics.issueProgress).toBe(0);
      expect(metrics.prMergeRate).toBe(0);
      expect(metrics.workflowSuccessRate).toBe(0);
      expect(metrics.currentStage).toBe('idle');
      expect(metrics.healthScore).toBe(100);
    });
  });

  describe('issue metrics', () => {
    it('should count issues by state', () => {
      const issues: PipelineIssue[] = [
        {
          id: '1',
          number: 1,
          title: 'Feature A',
          state: 'open',
          labels: ['feature'],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          number: 2,
          title: 'Feature B',
          state: 'closed',
          labels: ['feature'],
          dependencies: [],
          assignee: 'agent',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
        {
          id: '3',
          number: 3,
          title: 'Feature C',
          state: 'open',
          labels: ['feature', 'in-progress'],
          dependencies: [],
          assignee: 'agent',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const metrics = computePipelineMetrics(issues, [], [], []);

      expect(metrics.issueCounts).toEqual({
        total: 3,
        open: 2,
        closed: 1,
        inProgress: 1,
        completed: 1,
      });
      expect(metrics.issueProgress).toBeCloseTo(33.33, 1);
    });

    it('should calculate progress percentage correctly', () => {
      const issues: PipelineIssue[] = [
        {
          id: '1',
          number: 1,
          title: 'A',
          state: 'closed',
          labels: [],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          number: 2,
          title: 'B',
          state: 'closed',
          labels: [],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '3',
          number: 3,
          title: 'C',
          state: 'open',
          labels: [],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '4',
          number: 4,
          title: 'D',
          state: 'open',
          labels: [],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const metrics = computePipelineMetrics(issues, [], [], []);
      expect(metrics.issueProgress).toBe(50);
    });
  });

  describe('PR metrics', () => {
    it('should count PRs by state and approval', () => {
      const prs: PipelinePR[] = [
        {
          id: '1',
          number: 10,
          title: 'PR 1',
          state: 'open',
          linked_issue: 1,
          reviews: [{ reviewer: 'alice', state: 'PENDING', submitted_at: null }],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
        {
          id: '2',
          number: 11,
          title: 'PR 2',
          state: 'merged',
          linked_issue: 2,
          reviews: [
            { reviewer: 'bob', state: 'APPROVED', submitted_at: '2026-01-02T00:00:00Z' },
          ],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
        {
          id: '3',
          number: 12,
          title: 'PR 3',
          state: 'open',
          linked_issue: 3,
          reviews: [
            { reviewer: 'carol', state: 'APPROVED', submitted_at: '2026-01-03T00:00:00Z' },
          ],
          checks: [],
          mergeable: true,
          auto_merge: true,
        },
      ];

      const metrics = computePipelineMetrics([], prs, [], []);

      expect(metrics.prCounts).toEqual({
        total: 3,
        open: 2,
        merged: 1,
        approved: 1,
        awaitingReview: 1,
      });
      expect(metrics.prMergeRate).toBeCloseTo(33.33, 1);
    });

    it('should calculate merge rate correctly', () => {
      const prs: PipelinePR[] = [
        {
          id: '1',
          number: 10,
          title: 'PR 1',
          state: 'merged',
          linked_issue: 1,
          reviews: [],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
        {
          id: '2',
          number: 11,
          title: 'PR 2',
          state: 'merged',
          linked_issue: 2,
          reviews: [],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
        {
          id: '3',
          number: 12,
          title: 'PR 3',
          state: 'merged',
          linked_issue: 3,
          reviews: [],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
        {
          id: '4',
          number: 13,
          title: 'PR 4',
          state: 'open',
          linked_issue: 4,
          reviews: [],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
      ];

      const metrics = computePipelineMetrics([], prs, [], []);
      expect(metrics.prMergeRate).toBe(75);
    });
  });

  describe('workflow metrics', () => {
    it('should count workflows by status and conclusion', () => {
      const workflows: PipelineWorkflowRun[] = [
        {
          id: '1',
          name: 'CI',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/1',
        },
        {
          id: '2',
          name: 'Deploy',
          status: 'completed',
          conclusion: 'failure',
          started_at: '2026-01-02T00:00:00Z',
          completed_at: '2026-01-02T00:05:00Z',
          url: 'https://github.com/test/repo/actions/runs/2',
        },
        {
          id: '3',
          name: 'Test',
          status: 'in_progress',
          conclusion: null,
          started_at: '2026-01-03T00:00:00Z',
          completed_at: null,
          url: 'https://github.com/test/repo/actions/runs/3',
        },
      ];

      const metrics = computePipelineMetrics([], [], workflows, []);

      expect(metrics.workflowCounts).toEqual({
        total: 3,
        success: 1,
        failed: 1,
        inProgress: 1,
      });
      expect(metrics.workflowSuccessRate).toBe(50);
      expect(metrics.lastWorkflowRun).toEqual({
        name: 'Test',
        status: 'in_progress',
        conclusion: null,
        timestamp: '2026-01-03T00:00:00Z',
        url: 'https://github.com/test/repo/actions/runs/3',
      });
    });

    it('should calculate success rate correctly', () => {
      const workflows: PipelineWorkflowRun[] = [
        {
          id: '1',
          name: 'Run 1',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/1',
        },
        {
          id: '2',
          name: 'Run 2',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-02T00:00:00Z',
          completed_at: '2026-01-02T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/2',
        },
        {
          id: '3',
          name: 'Run 3',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-03T00:00:00Z',
          completed_at: '2026-01-03T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/3',
        },
      ];

      const metrics = computePipelineMetrics([], [], workflows, []);
      expect(metrics.workflowSuccessRate).toBe(100);
    });
  });

  describe('deployment status', () => {
    it('should return latest deployment', () => {
      const deployments: PipelineDeployment[] = [
        {
          id: '1',
          environment: 'staging',
          status: 'success',
          url: 'https://staging.example.com',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          environment: 'production',
          status: 'success',
          url: 'https://example.com',
          created_at: '2026-01-02T00:00:00Z',
        },
      ];

      const metrics = computePipelineMetrics([], [], [], deployments);

      expect(metrics.deploymentStatus).toEqual({
        environment: 'production',
        status: 'success',
        url: 'https://example.com',
        timestamp: '2026-01-02T00:00:00Z',
      });
    });

    it('should return null when no deployments', () => {
      const metrics = computePipelineMetrics([], [], [], []);
      expect(metrics.deploymentStatus).toBeNull();
    });
  });

  describe('current stage', () => {
    it('should infer stage from workflow in_progress', () => {
      const workflows: PipelineWorkflowRun[] = [
        {
          id: '1',
          name: 'prd-decomposer',
          status: 'in_progress',
          conclusion: null,
          started_at: '2026-01-01T00:00:00Z',
          completed_at: null,
          url: 'https://github.com/test/repo/actions/runs/1',
        },
      ];

      const metrics = computePipelineMetrics([], [], workflows, []);
      expect(metrics.currentStage).toBe('decomposing');
    });

    it('should infer implementing stage from open issues and PRs', () => {
      const issues: PipelineIssue[] = [
        {
          id: '1',
          number: 1,
          title: 'Feature',
          state: 'open',
          labels: ['feature'],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const prs: PipelinePR[] = [
        {
          id: '1',
          number: 10,
          title: 'PR 1',
          state: 'open',
          linked_issue: 1,
          reviews: [],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
      ];

      const metrics = computePipelineMetrics(issues, prs, [], []);
      expect(metrics.currentStage).toBe('implementing');
    });

    it('should infer reviewing stage from open PRs without workflow activity', () => {
      const prs: PipelinePR[] = [
        {
          id: '1',
          number: 10,
          title: 'PR 1',
          state: 'open',
          linked_issue: 1,
          reviews: [],
          checks: [],
          mergeable: true,
          auto_merge: false,
        },
      ];

      const metrics = computePipelineMetrics([], prs, [], []);
      expect(metrics.currentStage).toBe('reviewing');
    });

    it('should infer deploying stage from in_progress deployment', () => {
      const deployments: PipelineDeployment[] = [
        {
          id: '1',
          environment: 'production',
          status: 'in_progress',
          url: 'https://example.com',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      const metrics = computePipelineMetrics([], [], [], deployments);
      expect(metrics.currentStage).toBe('deploying');
    });

    it('should infer complete stage when all issues closed and no open PRs', () => {
      const issues: PipelineIssue[] = [
        {
          id: '1',
          number: 1,
          title: 'Feature',
          state: 'closed',
          labels: ['feature'],
          dependencies: [],
          assignee: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ];

      const metrics = computePipelineMetrics(issues, [], [], []);
      expect(metrics.currentStage).toBe('complete');
    });

    it('should infer failed stage when recent workflows failed', () => {
      const workflows: PipelineWorkflowRun[] = [
        {
          id: '1',
          name: 'CI',
          status: 'completed',
          conclusion: 'failure',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/1',
        },
      ];

      const metrics = computePipelineMetrics([], [], workflows, []);
      expect(metrics.currentStage).toBe('failed');
    });

    it('should default to idle when no activity', () => {
      const metrics = computePipelineMetrics([], [], [], []);
      expect(metrics.currentStage).toBe('idle');
    });
  });

  describe('health score', () => {
    it('should calculate health score based on success rates', () => {
      const workflows: PipelineWorkflowRun[] = [
        {
          id: '1',
          name: 'CI',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/1',
        },
        {
          id: '2',
          name: 'Deploy',
          status: 'completed',
          conclusion: 'failure',
          started_at: '2026-01-02T00:00:00Z',
          completed_at: '2026-01-02T00:05:00Z',
          url: 'https://github.com/test/repo/actions/runs/2',
        },
      ];

      const metrics = computePipelineMetrics([], [], workflows, []);
      // 50% workflow success = 50 health score
      expect(metrics.healthScore).toBe(50);
    });

    it('should return 100 for empty data', () => {
      const metrics = computePipelineMetrics([], [], [], []);
      expect(metrics.healthScore).toBe(100);
    });
  });

  describe('mixed scenarios', () => {
    it('should handle complex real-world scenario', () => {
      const issues: PipelineIssue[] = [
        {
          id: '1',
          number: 1,
          title: 'Feature A',
          state: 'closed',
          labels: ['feature'],
          dependencies: [],
          assignee: 'agent',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-05T00:00:00Z',
        },
        {
          id: '2',
          number: 2,
          title: 'Feature B',
          state: 'open',
          labels: ['feature', 'in-progress'],
          dependencies: [1],
          assignee: 'agent',
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-05T00:00:00Z',
        },
        {
          id: '3',
          number: 3,
          title: 'Feature C',
          state: 'open',
          labels: ['feature'],
          dependencies: [2],
          assignee: null,
          created_at: '2026-01-03T00:00:00Z',
          updated_at: '2026-01-03T00:00:00Z',
        },
      ];

      const prs: PipelinePR[] = [
        {
          id: '1',
          number: 10,
          title: 'Implement Feature A',
          state: 'merged',
          linked_issue: 1,
          reviews: [
            { reviewer: 'alice', state: 'APPROVED', submitted_at: '2026-01-04T00:00:00Z' },
          ],
          checks: [
            {
              name: 'CI',
              status: 'completed',
              conclusion: 'success',
              completed_at: '2026-01-04T00:00:00Z',
            },
          ],
          mergeable: true,
          auto_merge: false,
        },
        {
          id: '2',
          number: 11,
          title: 'Implement Feature B',
          state: 'open',
          linked_issue: 2,
          reviews: [{ reviewer: 'bob', state: 'PENDING', submitted_at: null }],
          checks: [
            {
              name: 'CI',
              status: 'in_progress',
              conclusion: null,
              completed_at: null,
            },
          ],
          mergeable: true,
          auto_merge: false,
        },
      ];

      const workflows: PipelineWorkflowRun[] = [
        {
          id: '1',
          name: 'prd-decomposer',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:05:00Z',
          url: 'https://github.com/test/repo/actions/runs/1',
        },
        {
          id: '2',
          name: 'repo-assist',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-02T00:00:00Z',
          completed_at: '2026-01-02T00:10:00Z',
          url: 'https://github.com/test/repo/actions/runs/2',
        },
        {
          id: '3',
          name: 'pr-review-agent',
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-01-04T00:00:00Z',
          completed_at: '2026-01-04T00:05:00Z',
          url: 'https://github.com/test/repo/actions/runs/3',
        },
      ];

      const deployments: PipelineDeployment[] = [
        {
          id: '1',
          environment: 'production',
          status: 'success',
          url: 'https://example.com',
          created_at: '2026-01-05T00:00:00Z',
        },
      ];

      const metrics = computePipelineMetrics(issues, prs, workflows, deployments);

      expect(metrics.issueCounts.total).toBe(3);
      expect(metrics.issueCounts.closed).toBe(1);
      expect(metrics.issueCounts.inProgress).toBe(1);
      expect(metrics.issueProgress).toBeCloseTo(33.33, 1);

      expect(metrics.prCounts.total).toBe(2);
      expect(metrics.prCounts.merged).toBe(1);
      expect(metrics.prCounts.awaitingReview).toBe(1);
      expect(metrics.prMergeRate).toBe(50);

      expect(metrics.workflowCounts.total).toBe(3);
      expect(metrics.workflowCounts.success).toBe(3);
      expect(metrics.workflowSuccessRate).toBe(100);

      expect(metrics.deploymentStatus?.environment).toBe('production');
      expect(metrics.deploymentStatus?.status).toBe('success');

      expect(metrics.currentStage).toBe('implementing');
      expect(metrics.healthScore).toBe(100);
    });
  });
});
