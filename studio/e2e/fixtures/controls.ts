import { Route } from '@playwright/test';

/**
 * Mock fixtures for ControlPanel E2E tests
 * Provides route handlers for all interactive control actions
 */

// ============================================================================
// PR Action Fixtures
// ============================================================================

export async function routePRApproveSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'PR approved successfully',
      data: {
        review_id: 123456,
        state: 'APPROVED',
      },
    }),
  });
}

export async function routePRRequestChangesSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Changes requested successfully',
      data: {
        review_id: 123457,
        state: 'CHANGES_REQUESTED',
      },
    }),
  });
}

export async function routePRMergeSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'PR merged successfully',
      data: {
        sha: 'abc123def456',
        merged: true,
      },
    }),
  });
}

export async function routePRCloseSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'PR closed successfully',
      data: {
        state: 'closed',
      },
    }),
  });
}

export async function routePRActionError(route: Route) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      error: 'GitHub API error: Rate limit exceeded',
    }),
  });
}

// ============================================================================
// Issue Action Fixtures
// ============================================================================

export async function routeIssueCloseSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Issue closed successfully',
      data: {
        state: 'closed',
      },
    }),
  });
}

export async function routeIssueLabelSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Labels updated successfully',
      data: {
        labels: ['bug', 'priority:high'],
      },
    }),
  });
}

export async function routeIssueActionError(route: Route) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      error: 'Failed to update issue',
    }),
  });
}

// ============================================================================
// Slash Command Fixtures
// ============================================================================

export async function routeSlashCommandSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Slash command posted successfully',
      data: {
        comment_id: 789012,
        body: '/repo-assist',
      },
    }),
  });
}

export async function routeSlashCommandError(route: Route) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      error: 'Failed to post command',
    }),
  });
}

// ============================================================================
// Workflow Action Fixtures
// ============================================================================

export async function routeWorkflowCancelSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Workflow run cancelled successfully',
      data: {
        status: 'cancelled',
      },
    }),
  });
}

export async function routeWorkflowRerunSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      message: 'Workflow rerun triggered successfully',
      data: {
        run_id: 987654,
      },
    }),
  });
}

export async function routeWorkflowActionError(route: Route) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      error: 'Workflow action failed',
    }),
  });
}
