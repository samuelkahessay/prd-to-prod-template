import { test, expect, Page } from '@playwright/test';
import { mockAuthenticatedPat, mockUsers, mockTokens } from './fixtures/auth';
import {
  routePipelineOverview,
  routePipelineIssues,
  routePipelinePulls,
  mockIssues,
  mockPullRequests,
} from './fixtures/dashboard';
import {
  routePRApproveSuccess,
  routePRRequestChangesSuccess,
  routePRMergeSuccess,
  routePRCloseSuccess,
  routePRActionError,
  routeIssueCloseSuccess,
  routeIssueLabelSuccess,
  routeIssueActionError,
  routeSlashCommandSuccess,
  routeSlashCommandError,
  routeWorkflowCancelSuccess,
} from './fixtures/controls';

test.describe('ControlPanel Interactive Controls', () => {
  async function setupDashboard(page: Page) {
    await mockAuthenticatedPat(page, mockUsers.valid);
    await page.route('**/api/pipeline/overview', routePipelineOverview);
    await page.route('**/api/pipeline/issues', routePipelineIssues);
    await page.route('**/api/pipeline/pulls', routePipelinePulls);
    
    await page.goto('/');
    await page.evaluate((token: string) => {
      localStorage.setItem('github_pat', token);
      localStorage.setItem('prd-to-prod-studio:current-repo', JSON.stringify({ owner: 'testuser', repo: 'testrepo' }));
    }, mockTokens.valid);
    await page.reload();
    await page.waitForLoadState('networkidle');
  }

  test('Scenario 1: Approve PR with confirmation dialog', async ({ page }) => {
    await setupDashboard(page);

    let requestPayload: any = null;
    await page.route('**/api/actions/pr', async (route, request) => {
      requestPayload = request.postDataJSON();
      await routePRApproveSuccess(route);
    });

    const prNode = page.locator('[data-id="pr-203"]').first();
    await prNode.click();
    await page.waitForTimeout(500);

    const controlPanel = page.getByTestId('control-panel');
    await expect(controlPanel).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-approve-pr-panel.png' });

    const approveButton = page.getByTestId('action-approve-pr');
    await approveButton.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('Approve');

    await page.screenshot({ path: 'test-results/controls-approve-pr-dialog.png' });

    const confirmButton = page.getByRole('button', { name: /confirm|approve/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    expect(requestPayload).toBeTruthy();
    expect(requestPayload.action).toBe('approve');
    expect(requestPayload.pr_number).toBe(203);

    await page.screenshot({ path: 'test-results/controls-approve-pr-success.png' });
  });

  test('Scenario 2: Request Changes with reason input', async ({ page }) => {
    await setupDashboard(page);

    let requestPayload: any = null;
    await page.route('**/api/actions/pr', async (route, request) => {
      requestPayload = request.postDataJSON();
      await routePRRequestChangesSuccess(route);
    });

    const prNode = page.locator('[data-id="pr-203"]').first();
    await prNode.click();
    await page.waitForTimeout(500);

    const requestChangesButton = page.getByTestId('action-request-changes-pr');
    await requestChangesButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const reasonInput = page.getByLabel(/reason|comment/i);
    await reasonInput.fill('Please add unit tests for the authentication flow');

    await page.screenshot({ path: 'test-results/controls-request-changes-dialog.png' });

    const submitButton = page.getByRole('button', { name: /submit|request changes/i });
    await submitButton.click();

    await page.waitForTimeout(1000);

    expect(requestPayload).toBeTruthy();
    expect(requestPayload.action).toBe('request_changes');
    expect(requestPayload.body).toContain('unit tests');

    await page.screenshot({ path: 'test-results/controls-request-changes-success.png' });
  });

  test('Scenario 3: Trigger /repo-assist slash command', async ({ page }) => {
    await setupDashboard(page);

    let requestPayload: any = null;
    await page.route('**/api/actions/slash-command', async (route, request) => {
      requestPayload = request.postDataJSON();
      await routeSlashCommandSuccess(route);
    });

    const issueNode = page.locator('[data-id="issue-103"]').first();
    await issueNode.click();
    await page.waitForTimeout(500);

    const slashCommandMenu = page.getByTestId('slash-command-menu');
    await expect(slashCommandMenu).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-slash-command-menu.png' });

    const repoAssistButton = page.getByRole('button', { name: /repo-assist/i });
    await repoAssistButton.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-slash-command-dialog.png' });

    const confirmButton = page.getByRole('button', { name: /confirm|dispatch/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    expect(requestPayload).toBeTruthy();
    expect(requestPayload.command).toBe('/repo-assist');
    expect(requestPayload.issue_number).toBe(103);

    await page.screenshot({ path: 'test-results/controls-slash-command-success.png' });
  });

  test('Scenario 4: Close issue with confirmation', async ({ page }) => {
    await setupDashboard(page);

    let requestPayload: any = null;
    await page.route('**/api/actions/issue', async (route, request) => {
      requestPayload = request.postDataJSON();
      await routeIssueCloseSuccess(route);
    });

    const issueNode = page.locator('[data-id="issue-103"]').first();
    await issueNode.click();
    await page.waitForTimeout(500);

    const closeButton = page.getByTestId('action-close-issue');
    await closeButton.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(/close.*issue/i);

    await page.screenshot({ path: 'test-results/controls-close-issue-dialog.png' });

    const confirmButton = page.getByRole('button', { name: /confirm|close/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    expect(requestPayload).toBeTruthy();
    expect(requestPayload.action).toBe('close');
    expect(requestPayload.issue_number).toBe(103);

    await page.screenshot({ path: 'test-results/controls-close-issue-success.png' });
  });

  test('Scenario 5: Error handling with retry capability', async ({ page }) => {
    await setupDashboard(page);

    let callCount = 0;
    await page.route('**/api/actions/pr', async (route) => {
      callCount++;
      if (callCount === 1) {
        await routePRActionError(route);
      } else {
        await routePRApproveSuccess(route);
      }
    });

    const prNode = page.locator('[data-id="pr-203"]').first();
    await prNode.click();
    await page.waitForTimeout(500);

    const approveButton = page.getByTestId('action-approve-pr');
    await approveButton.click();

    const confirmDialog = page.getByRole('dialog');
    const confirmButton = page.getByRole('button', { name: /confirm|approve/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    const errorMessage = page.getByText(/error|rate limit/i);
    await expect(errorMessage).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-error-message.png' });

    const retryButton = page.getByRole('button', { name: /retry|try again/i });
    await retryButton.click();

    const confirmDialog2 = page.getByRole('dialog');
    const confirmButton2 = page.getByRole('button', { name: /confirm|approve/i });
    await confirmButton2.click();

    await page.waitForTimeout(1000);

    expect(callCount).toBe(2);

    await page.screenshot({ path: 'test-results/controls-retry-success.png' });
  });

  test('Scenario 6: Dialog cancellation prevents API call', async ({ page }) => {
    await setupDashboard(page);

    let apiCalled = false;
    await page.route('**/api/actions/pr', async (route) => {
      apiCalled = true;
      await routePRApproveSuccess(route);
    });

    const prNode = page.locator('[data-id="pr-203"]').first();
    await prNode.click();
    await page.waitForTimeout(500);

    const approveButton = page.getByTestId('action-approve-pr');
    await approveButton.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-cancel-dialog.png' });

    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    await page.waitForTimeout(500);

    await expect(confirmDialog).not.toBeVisible();

    expect(apiCalled).toBe(false);

    await page.screenshot({ path: 'test-results/controls-cancel-no-api-call.png' });
  });

  test('Scenario 7: Concurrent action prevention during loading', async ({ page }) => {
    await setupDashboard(page);

    await page.route('**/api/actions/pr', async (route) => {
      await page.waitForTimeout(2000);
      await routePRApproveSuccess(route);
    });

    const prNode = page.locator('[data-id="pr-203"]').first();
    await prNode.click();
    await page.waitForTimeout(500);

    const approveButton = page.getByTestId('action-approve-pr');
    await approveButton.click();

    const confirmDialog = page.getByRole('dialog');
    const confirmButton = page.getByRole('button', { name: /confirm|approve/i });
    await confirmButton.click();

    await page.waitForTimeout(500);

    await expect(approveButton).toBeDisabled();

    await page.screenshot({ path: 'test-results/controls-loading-disabled.png' });

    await page.waitForTimeout(2000);

    await expect(approveButton).toBeEnabled();

    await page.screenshot({ path: 'test-results/controls-loading-complete.png' });
  });

  test('Scenario 8: Merge PR with method selection', async ({ page }) => {
    await setupDashboard(page);

    let requestPayload: any = null;
    await page.route('**/api/actions/pr', async (route, request) => {
      requestPayload = request.postDataJSON();
      await routePRMergeSuccess(route);
    });

    const prNode = page.locator('[data-id="pr-203"]').first();
    await prNode.click();
    await page.waitForTimeout(500);

    const mergeButton = page.getByTestId('action-merge-pr');
    await mergeButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const mergeMethodSelect = page.getByLabel(/merge method/i);
    if (await mergeMethodSelect.isVisible()) {
      await mergeMethodSelect.selectOption('squash');
    }

    await page.screenshot({ path: 'test-results/controls-merge-dialog.png' });

    const confirmButton = page.getByRole('button', { name: /confirm|merge/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    expect(requestPayload).toBeTruthy();
    expect(requestPayload.action).toBe('merge');

    await page.screenshot({ path: 'test-results/controls-merge-success.png' });
  });

  test('Scenario 9: Issue close error handling', async ({ page }) => {
    await setupDashboard(page);

    await page.route('**/api/actions/issue', async (route) => {
      await routeIssueActionError(route);
    });

    const issueNode = page.locator('[data-id="issue-103"]').first();
    await issueNode.click();
    await page.waitForTimeout(500);

    const closeButton = page.getByTestId('action-close-issue');
    await closeButton.click();

    const confirmDialog = page.getByRole('dialog');
    const confirmButton = page.getByRole('button', { name: /confirm|close/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    const errorMessage = page.getByText(/error|failed/i);
    await expect(errorMessage).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-issue-error.png' });
  });

  test('Scenario 10: Slash command error handling', async ({ page }) => {
    await setupDashboard(page);

    await page.route('**/api/actions/slash-command', async (route) => {
      await routeSlashCommandError(route);
    });

    const issueNode = page.locator('[data-id="issue-103"]').first();
    await issueNode.click();
    await page.waitForTimeout(500);

    const slashCommandMenu = page.getByTestId('slash-command-menu');
    const repoAssistButton = page.getByRole('button', { name: /repo-assist/i });
    await repoAssistButton.click();

    const confirmDialog = page.getByRole('dialog');
    const confirmButton = page.getByRole('button', { name: /confirm|dispatch/i });
    await confirmButton.click();

    await page.waitForTimeout(1000);

    const errorMessage = page.getByText(/error|failed/i);
    await expect(errorMessage).toBeVisible();

    await page.screenshot({ path: 'test-results/controls-slash-command-error.png' });
  });

  test('Scenario 11: Workflow run cancellation', async ({ page }) => {
    await setupDashboard(page);

    let requestPayload: any = null;
    await page.route('**/api/actions/workflow', async (route, request) => {
      requestPayload = request.postDataJSON();
      await routeWorkflowCancelSuccess(route);
    });

    const deployNode = page.locator('[data-id^="deploy-"]').first();
    await deployNode.click();
    await page.waitForTimeout(500);

    const cancelButton = page.getByTestId('action-cancel-workflow');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog).toBeVisible();

      await page.screenshot({ path: 'test-results/controls-workflow-cancel-dialog.png' });

      const confirmButton = page.getByRole('button', { name: /confirm|cancel/i });
      await confirmButton.click();

      await page.waitForTimeout(1000);

      expect(requestPayload).toBeTruthy();
      expect(requestPayload.action).toBe('cancel');

      await page.screenshot({ path: 'test-results/controls-workflow-cancel-success.png' });
    }
  });
});
