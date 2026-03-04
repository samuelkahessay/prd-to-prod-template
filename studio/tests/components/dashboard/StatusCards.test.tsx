import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusCards } from '@/components/dashboard/StatusCards';
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

describe('StatusCards', () => {
  describe('container', () => {
    it('should render with correct data-testid', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('status-cards')).toBeInTheDocument();
    });

    it('should render 5 cards', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-issues')).toBeInTheDocument();
      expect(screen.getByTestId('card-prs')).toBeInTheDocument();
      expect(screen.getByTestId('card-workflows')).toBeInTheDocument();
      expect(screen.getByTestId('card-deployments')).toBeInTheDocument();
      expect(screen.getByTestId('card-stage')).toBeInTheDocument();
    });
  });

  describe('issues card', () => {
    it('should display total issue count', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-issues')).toHaveTextContent('10');
    });

    it('should display breakdown by status', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      const card = screen.getByTestId('card-issues');
      expect(card).toHaveTextContent('4 open');
      expect(card).toHaveTextContent('2 in progress');
      expect(card).toHaveTextContent('6 completed');
    });

    it('should display progress percentage', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-issues')).toHaveTextContent('60%');
    });

    it('should handle zero issues', () => {
      const metrics = createMockMetrics({
        issueCounts: {
          total: 0,
          open: 0,
          closed: 0,
          inProgress: 0,
          completed: 0,
        },
        issueProgress: 0,
      });
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-issues')).toHaveTextContent('0');
    });
  });

  describe('PRs card', () => {
    it('should display open PR count', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      const card = screen.getByTestId('card-prs');
      expect(card).toHaveTextContent('2 open');
    });

    it('should display approved count', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-prs')).toHaveTextContent('1 approved');
    });

    it('should display merged count', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-prs')).toHaveTextContent('6 merged');
    });

    it('should display awaiting review count', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-prs')).toHaveTextContent('1 awaiting review');
    });

    it('should handle zero PRs', () => {
      const metrics = createMockMetrics({
        prCounts: {
          total: 0,
          open: 0,
          merged: 0,
          approved: 0,
          awaitingReview: 0,
        },
        prMergeRate: 0,
      });
      render(<StatusCards metrics={metrics} />);
      const card = screen.getByTestId('card-prs');
      expect(card).toHaveTextContent('0 open');
    });
  });

  describe('workflows card', () => {
    it('should display recent run count', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-workflows')).toHaveTextContent('15');
    });

    it('should display success rate percentage', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-workflows')).toHaveTextContent('86%');
    });

    it('should display last run status', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-workflows')).toHaveTextContent('repo-assist');
      expect(screen.getByTestId('card-workflows')).toHaveTextContent('success');
    });

    it('should handle no workflows', () => {
      const metrics = createMockMetrics({
        workflowCounts: {
          total: 0,
          success: 0,
          failed: 0,
          inProgress: 0,
        },
        workflowSuccessRate: 0,
        lastWorkflowRun: null,
      });
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-workflows')).toHaveTextContent('0');
    });
  });

  describe('deployments card', () => {
    it('should display latest deployment status', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-deployments')).toHaveTextContent('production');
      expect(screen.getByTestId('card-deployments')).toHaveTextContent('success');
    });

    it('should display deployment URL as link', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      const card = screen.getByTestId('card-deployments');
      const link = card.querySelector('a');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should handle no deployments', () => {
      const metrics = createMockMetrics({
        deploymentStatus: null,
      });
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-deployments')).toHaveTextContent('No deployments');
    });
  });

  describe('stage card', () => {
    it('should display current pipeline stage', () => {
      const metrics = createMockMetrics();
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-stage')).toHaveTextContent('implementing');
    });

    it('should apply correct color for stage', () => {
      const metrics = createMockMetrics({
        currentStage: 'failed',
      });
      render(<StatusCards metrics={metrics} />);
      const card = screen.getByTestId('card-stage');
      expect(card.className).toMatch(/border-red/);
    });

    it('should handle idle stage', () => {
      const metrics = createMockMetrics({
        currentStage: 'idle',
      });
      render(<StatusCards metrics={metrics} />);
      expect(screen.getByTestId('card-stage')).toHaveTextContent('idle');
    });
  });

  describe('responsive layout', () => {
    it('should have responsive grid classes', () => {
      const metrics = createMockMetrics();
      const { container } = render(<StatusCards metrics={metrics} />);
      const grid = container.querySelector('[data-testid="status-cards"]');
      expect(grid?.className).toMatch(/grid/);
    });
  });
});
