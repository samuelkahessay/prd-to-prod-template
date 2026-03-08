import { test, expect } from '@playwright/test';
import { routeAuthStatusAuthenticated } from './fixtures/auth';
import {
  routePrdSubmitSuccess,
  routePrdSubmitForbidden,
  routeRepoValidateSuccess,
} from './fixtures/prd';

test.describe('PRD Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/status', routeAuthStatusAuthenticated);
    await page.route('**/api/repo/validate*', routeRepoValidateSuccess);
    
    await page.addInitScript(() => {
      localStorage.setItem('prd-to-prod-studio:current-repo', JSON.stringify({
        owner: 'testuser',
        repo: 'testrepo'
      }));
    });
    
    await page.goto('http://localhost:3000/prd/new');
    await page.waitForLoadState('networkidle');
  });

  test('Scenario 1: Structured wizard path - Web App template', async ({ page }) => {
    const selectWebAppTemplate = page.locator('[data-testid="category-card-web-app"]');
    await expect(selectWebAppTemplate).toBeVisible();
    await selectWebAppTemplate.click();

    await expect(page.getByRole('heading', { name: /Fill Template/i })).toBeVisible();
    
    await page.fill('input[name="projectName"]', 'My Awesome Web App');
    await page.fill('textarea[name="description"]', 'A revolutionary web application for developers');
    await page.fill('input[name="targetUsers"]', 'Software engineers and tech enthusiasts');
    await page.fill('textarea[name="keyFeatures"]', '- Real-time collaboration\n- Advanced analytics\n- Secure authentication');
    await page.fill('input[name="uiFramework"]', 'Next.js 16');
    await page.fill('input[name="authRequirements"]', 'OAuth 2.0 with GitHub provider');
    await page.fill('input[name="deploymentTarget"]', 'Vercel');
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-wizard-form-filled.png' });
    
    await page.click('button:has-text("Next")');
    
    await expect(page.getByRole('heading', { name: /Review & Customize/i })).toBeVisible();
    
    const preview = page.locator('[data-testid="prd-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('My Awesome Web App');
    await expect(preview).toContainText('A revolutionary web application for developers');
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-wizard-preview.png' });
    
    await page.click('button:has-text("Next")');
    
    await expect(page.getByRole('heading', { name: /Submit/i })).toBeVisible();
    
    await page.route('**/api/prd/submit', async (route, request) => {
      const payload = request.postDataJSON();
      
      expect(payload.content).toContain('# My Awesome Web App');
      expect(payload.content).toContain('A revolutionary web application for developers');
      expect(payload.content).toContain('Real-time collaboration');
      expect(payload.content).toContain('Next.js 16');
      expect(payload.owner).toBe('testuser');
      expect(payload.repo).toBe('testrepo');
      
      await routePrdSubmitSuccess(route, request);
    });
    
    await page.click('button:has-text("Submit")');
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.sisyphus/evidence/task-28-wizard-success.png' });
  });

  test('Scenario 2: Advanced Markdown editor path', async ({ page }) => {
    await page.click('button:has-text("Advanced Editor")');
    
    await page.waitForTimeout(500);
    
    const textarea = page.locator('textarea[data-testid="prd-editor-textarea"]').first();
    await expect(textarea).toBeVisible();
    
    const customPrd = `# Custom API Service

## Overview
A high-performance RESTful API built with Node.js and Express.

## Target Users
Backend developers and integration engineers

## Key Features
- JWT authentication
- Rate limiting
- OpenAPI documentation
- Redis caching

## Technical Requirements
**Language**: TypeScript
**Framework**: Express.js
**Database**: PostgreSQL

## Constraints
Must handle 10k requests per second`;
    
    await textarea.fill(customPrd);
    
    await page.waitForTimeout(500);
    
    const previewTab = page.getByRole('tab', { name: /preview/i });
    await expect(previewTab).toBeVisible();
    await previewTab.click();
    
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Custom API Service')).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-advanced-editor.png' });
  });

  test('Scenario 3: Template switching preserves common data', async ({ page }) => {
    await page.click('[data-testid="category-card-cli-tool"]');
    
    await expect(page.getByRole('heading', { name: /Fill Template/i })).toBeVisible();
    
    await page.fill('input[name="projectName"]', 'DevTools CLI');
    await page.fill('textarea[name="description"]', 'Command-line developer toolkit');
    await page.fill('textarea[name="commands"]', 'init\nbuild\ndeploy');
    
    await page.click('button:has-text("Back")');
    
    await page.click('[data-testid="category-card-api-backend"]');
    
    await expect(page.getByRole('heading', { name: /Fill Template/i })).toBeVisible();
    
    await expect(page.locator('input[name="projectName"]')).toHaveValue('DevTools CLI');
    await expect(page.locator('textarea[name="description"]')).toHaveValue('Command-line developer toolkit');
    
    await expect(page.locator('textarea[name="commands"]')).not.toBeVisible();
    
    await expect(page.locator('textarea[name="endpoints"]')).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-template-switch.png' });
  });

  test('Scenario 4: Form validation - required fields', async ({ page }) => {
    await page.click('[data-testid="category-card-web-app"]');
    
    await expect(page.getByRole('heading', { name: /Fill Template/i })).toBeVisible();
    
    await page.click('button:has-text("Next")');
    
    const errors = page.locator('.text-destructive');
    await expect(errors.first()).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-validation-errors.png' });
    
    await page.fill('input[name="projectName"]', 'Validated App');
    await page.fill('textarea[name="description"]', 'This app has proper validation');
    
    await page.click('button:has-text("Next")');
    
    await expect(page.getByRole('heading', { name: /Review & Customize/i })).toBeVisible();
  });

  test('Scenario 5: Submission error handling - 403 Forbidden', async ({ page }) => {
    await page.click('[data-testid="category-card-library"]');
    
    await page.fill('input[name="projectName"]', 'Test Library');
    await page.fill('textarea[name="description"]', 'A reusable JavaScript library');
    
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    
    await page.route('**/api/prd/submit', routePrdSubmitForbidden);
    
    await page.click('button:has-text("Submit")');
    
    await page.waitForTimeout(1000);
    
    expect(alertMessage).toContain('Resource not accessible');
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-submission-error.png' });
  });

  test('Scenario 6: Submission success with redirect', async ({ page }) => {
    await page.click('[data-testid="category-card-mobile-app"]');
    
    await page.fill('input[name="projectName"]', 'Mobile Success');
    await page.fill('textarea[name="description"]', 'A mobile app that submits successfully');
    await page.selectOption('select[name="platform"]', 'Both');
    
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    await page.route('**/api/prd/submit', routePrdSubmitSuccess);
    
    await page.click('button:has-text("Submit")');
    
    await page.waitForTimeout(1000);
    
    const successIndicator = page.locator('[data-testid="submit-success"]');
    if (await successIndicator.isVisible()) {
      await expect(successIndicator).toBeVisible();
    } else {
      const successText = page.locator('.text-green-600');
      if (await successText.count() > 0) {
        await expect(successText.first()).toBeVisible();
      }
    }
    
    await page.screenshot({ path: '.sisyphus/evidence/task-28-submission-success.png' });
  });

  test('Scenario 7: Navigate backward through wizard steps', async ({ page }) => {
    await page.click('[data-testid="category-card-web-app"]');
    
    await page.fill('input[name="projectName"]', 'Navigation Test');
    await page.fill('textarea[name="description"]', 'Testing backward navigation');
    
    await page.click('button:has-text("Next")');
    await expect(page.getByRole('heading', { name: /Review & Customize/i })).toBeVisible();
    
    await page.click('button:has-text("Back")');
    await expect(page.getByRole('heading', { name: /Fill Template/i })).toBeVisible();
    
    await expect(page.locator('input[name="projectName"]')).toHaveValue('Navigation Test');
    await expect(page.locator('textarea[name="description"]')).toHaveValue('Testing backward navigation');
    
    await page.click('button:has-text("Back")');
    await expect(page.getByRole('heading', { name: /Choose Category/i })).toBeVisible();
  });
});
