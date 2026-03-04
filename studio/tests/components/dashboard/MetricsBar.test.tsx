import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import type { PipelineMetrics } from '@/lib/pipeline/metrics';

function createMockMetrics(overrides?: Partial<PipelineMetrics>): PipelineMetrics {
  return {
    issueCounts: {
      total: 10,
      open: 4,
      closed: 6,
      inProgress: 2,
      completed: 6,
    },
    prCounts: {
      total: 8,
      open: 2,
      merged: 6,
      approved: 1,
      awaitingReview: 1,
    },
    workflowCounts: {
      total: 15,
      success: 12,
      failed: 2,
      inProgress: 1,
    },
    deploymentStatus: {
      environment: 'production',
      status: 'success',
      url: 'https://example.com',
      timestamp: '2026-03-03T00:00:00Z',
    },
    issueProgress: 60,
    prMergeRate: 75,
    workflowSuccessRate: 85.71,
    currentStage: 'implementing',
    healthScore: 86,
    lastWorkflowRun: {
      name: 'repo-assist',
      status: 'completed',
      conclusion: 'success',
      timestamp: '2026-03-03T00:00:00Z',
      url: 'https://github.com/test/repo/actions/runs/1',
    },
    ...overrides,
  };
}

describe('MetricsBar', () => {
  describe('container', () => {
    it('should render with correct data-testid', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      expect(screen.getByTestId('metrics-bar')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const metrics = createMockMetrics();
      const { container } = render(
        <MetricsBar metrics={metrics} className="custom-class" />
      );
      const bar = container.querySelector('[data-testid="metrics-bar"]');
      expect(bar?.className).toMatch(/custom-class/);
    });
  });

  describe('issues section', () => {
    it('should display total issue count', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      const section = screen.getByTestId('metrics-bar-issues');
      expect(section).toHaveTextContent('10');
    });

    it('should display progress percentage', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      expect(screen.getByTestId('metrics-bar-issues')).toHaveTextContent('60% done');
    });
  });

  describe('PRs section', () => {
    it('should display open PR count', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      const section = screen.getByTestId('metrics-bar-prs');
      expect(section).toHaveTextContent('2');
    });

    it('should display merged count', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      expect(screen.getByTestId('metrics-bar-prs')).toHaveTextContent('6 merged');
    });
  });

  describe('workflows section', () => {
    it('should display total workflow count', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      const section = screen.getByTestId('metrics-bar-workflows');
      expect(section).toHaveTextContent('15');
    });

    it('should display success rate', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      expect(screen.getByTestId('metrics-bar-workflows')).toHaveTextContent(
        '86% success'
      );
    });
  });

  describe('deployments section', () => {
    it('should display deployment environment', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      const section = screen.getByTestId('metrics-bar-deployments');
      expect(section).toHaveTextContent('production');
    });

    it('should display deployment status', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      expect(screen.getByTestId('metrics-bar-deployments')).toHaveTextContent(
        'success'
      );
    });

    it('should handle no deployments', () => {
      const metrics = createMockMetrics({
        deploymentStatus: null,
      });
      render(<MetricsBar metrics={metrics} />);
      const section = screen.getByTestId('metrics-bar-deployments');
      expect(section).toHaveTextContent('—');
      expect(section).toHaveTextContent('none');
    });
  });

  describe('stage section', () => {
    it('should display current stage', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      const section = screen.getByTestId('metrics-bar-stage');
      expect(section).toHaveTextContent('implementing');
    });

    it('should display health score', () => {
      const metrics = createMockMetrics();
      render(<MetricsBar metrics={metrics} />);
      expect(screen.getByTestId('metrics-bar-stage')).toHaveTextContent('86% health');
    });
  });

  describe('layout', () => {
    it('should have horizontal layout with separators', () => {
      const metrics = createMockMetrics();
      const { container } = render(<MetricsBar metrics={metrics} />);
      const bar = container.querySelector('[data-testid="metrics-bar"]');
      expect(bar?.className).toMatch(/flex/);
      expect(bar?.className).toMatch(/overflow-x-auto/);
    });
  });
});
