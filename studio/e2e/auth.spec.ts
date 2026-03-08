import { test, expect } from '@playwright/test';
import {
  mockUnauthenticated,
  mockAuthenticatedGhCli,
  mockAuthenticatedEnv,
  mockAuthenticatedPat,
  mockPatValidationSuccess,
  mockPatValidationInvalid,
  mockPatValidationExpired,
  mockPatValidationMissingScopes,
  mockTokens,
  mockUsers,
} from './fixtures/auth';

test.describe('Authentication Flow E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage before each test
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('Scenario 1: First-time user enters valid PAT', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');
    
    const patInput = page.getByTestId('pat-input');
    await expect(patInput).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario1-prompt.png' });

    await mockPatValidationSuccess(page, mockUsers.valid);
    
    await mockAuthenticatedPat(page, mockUsers.valid);

    await patInput.fill(mockTokens.valid);
    const submitButton = page.locator('button:has-text("Use this token")');
    await submitButton.click();

    await page.waitForLoadState('networkidle');

    await expect(patInput).not.toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario1-authenticated.png' });
  });

  test('Scenario 2: User with gh CLI configured', async ({ page }) => {
    await mockAuthenticatedGhCli(page, mockUsers.valid);
    await page.goto('/');

    const patInput = page.getByTestId('pat-input');
    await expect(patInput).not.toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario2-ghcli.png' });

    await page.goto('/settings');
    const ghCliIndicator = page.locator('text=/GitHub CLI/i').first();
    await expect(ghCliIndicator).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario2-settings.png' });
  });

  test('Scenario 3: User with .env GITHUB_TOKEN', async ({ page }) => {
    await mockAuthenticatedEnv(page, mockUsers.valid);
    await page.goto('/');

    const patInput = page.getByTestId('pat-input');
    await expect(patInput).not.toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario3-env.png' });

    await page.goto('/settings');
    const envIndicator = page.locator('text=/Environment Variable/i').first();
    await expect(envIndicator).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario3-settings.png' });
  });

  test('Scenario 4: Invalid PAT → error → retry with valid PAT', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');

    const patInput = page.getByTestId('pat-input');
    await expect(patInput).toBeVisible();

    await mockPatValidationInvalid(page);

    await patInput.fill(mockTokens.invalid);
    const submitButton = page.locator('button:has-text("Use this token")');
    await submitButton.click();

    const errorMessage = page.locator('text=/GitHub rejected this token/i');
    await expect(errorMessage).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario4-error.png' });

    await mockPatValidationSuccess(page, mockUsers.valid);
    await mockAuthenticatedPat(page, mockUsers.valid);

    await patInput.clear();
    await patInput.fill(mockTokens.valid);
    await submitButton.click();

    await page.waitForLoadState('networkidle');

    await expect(patInput).not.toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario4-success.png' });
  });

  test('Scenario 5: Expired/revoked token error', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');

    const patInput = page.getByTestId('pat-input');
    await expect(patInput).toBeVisible();

    await mockPatValidationExpired(page);

    await patInput.fill(mockTokens.expired);
    const submitButton = page.locator('button:has-text("Use this token")');
    await submitButton.click();

    const errorMessage = page.locator('text=/GitHub rejected this token/i');
    await expect(errorMessage).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario5-expired.png' });
  });

  test('Scenario 6: Token with missing scopes shows warning', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');

    const patInput = page.getByTestId('pat-input');
    await expect(patInput).toBeVisible();

    await mockPatValidationMissingScopes(page, mockUsers.valid);
    await mockAuthenticatedPat(page, mockUsers.valid, ['repo', 'workflow']);

    await patInput.fill(mockTokens.missingScopes);
    const submitButton = page.locator('button:has-text("Use this token")');
    await submitButton.click();

    await page.waitForLoadState('networkidle');

    await page.goto('/settings');

    const warningMessage = page.locator('text=/Missing scopes: repo, workflow/i');
    await expect(warningMessage).toBeVisible();
    await page.screenshot({ path: 'test-results/auth-scenario6-warning.png' });
  });
});
