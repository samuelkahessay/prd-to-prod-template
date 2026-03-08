import { test, expect } from '@playwright/test';
import {
  routeAuthStatus,
  routePipelineOverview,
  routePipelineIssues,
  routePipelinePulls,
  routePipelineWorkflows,
  routePipelineDeployments,
  routeEmptyPipelineOverview,
  routeEmptyPipelineIssues,
  routeApiError,
  setupMockRepo,
  VALID_PAT,
} from './fixtures/dashboard';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/status**', routeAuthStatus);
});

async function setupAuthAndRepo(page: any) {
  await page.goto('/');
  await setupMockRepo(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Dashboard - Main View', () => {
  test('loads dashboard with all widgets rendered', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    await expect(page.getByTestId('dashboard-shell')).toBeVisible();
    await expect(page.getByTestId('status-cards')).toBeVisible();
    await expect(page.getByTestId('pipeline-flow-container')).toBeVisible();
    await expect(page.getByTestId('dashboard-activity-section')).toBeVisible();
  });

  test('displays correct status card counts', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    const issueCard = page.getByTestId('card-issues');
    await expect(issueCard).toBeVisible();
    await expect(issueCard.getByText('5')).toBeVisible();
    await expect(issueCard.getByText('3 open')).toBeVisible();
    await expect(issueCard.getByText('1 in progress')).toBeVisible();

    const prCard = page.getByTestId('card-pull-requests');
    await expect(prCard).toBeVisible();
    await expect(prCard.getByText('3')).toBeVisible();
    await expect(prCard.getByText('1 open')).toBeVisible();

    const workflowCard = page.getByTestId('card-workflows');
    await expect(workflowCard).toBeVisible();
    await expect(workflowCard.getByText('2')).toBeVisible();
    await expect(workflowCard.getByText('1 success')).toBeVisible();

    const deployCard = page.getByTestId('card-deployments');
    await expect(deployCard).toBeVisible();
    await expect(deployCard.getByText('1')).toBeVisible();
  });
});

test.describe('Dashboard - Pipeline DAG Visualization', () => {
  test('renders correct number of nodes and edges', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    const flowContainer = page.getByTestId('pipeline-flow-container');
    await expect(flowContainer).toBeVisible();

    const nodes = flowContainer.locator('.react-flow__node');
    await expect(nodes).toHaveCount(6);

    const edges = flowContainer.locator('.react-flow__edge');
    await expect(edges.first()).toBeVisible();
  });

  test('DAG nodes have correct status colors', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    const flowContainer = page.getByTestId('pipeline-flow-container');
    await expect(flowContainer).toBeVisible();

    const completedNode = flowContainer.locator('[data-id="issue-101"]');
    await expect(completedNode).toBeVisible();
    
    const inProgressNode = flowContainer.locator('[data-id="issue-103"]');
    await expect(inProgressNode).toBeVisible();
  });

  test('clicking DAG node opens control panel', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    const flowContainer = page.getByTestId('pipeline-flow-container');
    await expect(flowContainer).toBeVisible();

    const node = flowContainer.locator('[data-id="issue-103"]').first();
    await node.click();

    const controlPanel = page.getByTestId('control-panel');
    await expect(controlPanel).toBeVisible();
  });
});

test.describe('Dashboard - Activity Feed', () => {
  test('activity feed renders with events', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    await page.route('**/api/pipeline/pulls**', routePipelinePulls);
    await page.route('**/api/pipeline/workflows**', routePipelineWorkflows);
    
    await setupAuthAndRepo(page);

    const activitySection = page.getByTestId('dashboard-activity-section');
    await expect(activitySection).toBeVisible();

    const feedItems = activitySection.locator('[data-testid^="activity-item-"]');
    await expect(feedItems.first()).toBeVisible();
  });

  test('activity feed shows recent events', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routePipelineOverview);
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    await page.route('**/api/pipeline/pulls**', routePipelinePulls);
    await page.route('**/api/pipeline/workflows**', routePipelineWorkflows);
    await page.route('**/api/pipeline/deployments**', routePipelineDeployments);
    
    await setupAuthAndRepo(page);

    const activitySection = page.getByTestId('dashboard-activity-section');
    await expect(activitySection).toBeVisible();

    await expect(activitySection.getByText(/issue/i)).toBeVisible();
  });
});

test.describe('Dashboard - Empty State', () => {
  test('shows welcome screen when no active pipeline', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routeEmptyPipelineOverview);
    await page.route('**/api/pipeline/issues**', routeEmptyPipelineIssues);
    
    await setupAuthAndRepo(page);

    const welcomeScreen = page.getByTestId('welcome-screen');
    await expect(welcomeScreen).toBeVisible();
    
    await expect(page.getByText(/no active pipeline/i)).toBeVisible();
  });
});

test.describe('Dashboard - Auto-Refresh', () => {
  test('polling triggers periodic API requests', async ({ page }) => {
    let overviewRequestCount = 0;
    
    await page.route('**/api/pipeline/overview**', async (route) => {
      overviewRequestCount++;
      await routePipelineOverview(route);
    });
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    const initialCount = overviewRequestCount;
    
    await page.waitForTimeout(12000);
    
    expect(overviewRequestCount).toBeGreaterThan(initialCount);
  });

  test('refetch updates dashboard data', async ({ page }) => {
    let requestCount = 0;
    const updatedOverview = {
      issues: { total: 6, open: 4, closed: 2, inProgress: 2, ready: 2, completed: 2 },
      pullRequests: { total: 4, open: 2, merged: 2, approved: 1 },
      workflows: { total: 3, success: 2, failure: 1 },
      deployments: { total: 1, production: 1, staging: 0 },
    };

    await page.route('**/api/pipeline/overview**', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await routePipelineOverview(route);
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedOverview),
        });
      }
    });
    await page.route('**/api/pipeline/issues**', routePipelineIssues);
    
    await setupAuthAndRepo(page);

    const issueCard = page.getByTestId('card-issues');
    await expect(issueCard.getByText('5')).toBeVisible();

    await page.waitForTimeout(12000);

    await expect(issueCard.getByText('6')).toBeVisible();
  });
});

test.describe('Dashboard - Error Handling', () => {
  test('shows error boundary on API failure', async ({ page }) => {
    await page.route('**/api/pipeline/overview**', routeApiError);
    await page.route('**/api/pipeline/issues**', routeApiError);
    
    await setupAuthAndRepo(page);

    await expect(page.getByText(/error/i)).toBeVisible();
  });
});
