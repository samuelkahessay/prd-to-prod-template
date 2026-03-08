import { Page, Route } from '@playwright/test';

export interface MockUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export const mockUsers = {
  valid: {
    id: 123456,
    login: 'testuser',
    name: 'Test User',
    avatar_url: 'https://avatars.githubusercontent.com/u/123456',
    html_url: 'https://github.com/testuser',
  },
  expired: {
    id: 789012,
    login: 'expireduser',
    name: 'Expired User',
    avatar_url: 'https://avatars.githubusercontent.com/u/789012',
    html_url: 'https://github.com/expireduser',
  },
};

export const mockTokens = {
  valid: 'ghp_valid1234567890abcdefghijklmnopqrst',
  invalid: 'ghp_invalid_token',
  expired: 'ghp_expired1234567890abcdefghijklmno',
  missingScopes: 'ghp_partial1234567890abcdefghijklmn',
};

/**
 * Mock auth status - unauthenticated
 */
export async function mockUnauthenticated(page: Page) {
  await page.route('**/api/auth/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: false,
        message: 'No GitHub token found. Authenticate with gh CLI, set GITHUB_TOKEN, or provide a PAT.',
      }),
    });
  });
}

/**
 * Mock auth status - authenticated via gh CLI
 */
export async function mockAuthenticatedGhCli(page: Page, user: MockUser = mockUsers.valid) {
  await page.route('**/api/auth/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        auth: {
          method: 'gh-cli',
          user,
          scopes: ['repo', 'workflow', 'read:org'],
          missingScopes: [],
        },
        method: 'gh-cli',
        user,
        warnings: [],
      }),
    });
  });
}

/**
 * Mock auth status - authenticated via .env GITHUB_TOKEN
 */
export async function mockAuthenticatedEnv(page: Page, user: MockUser = mockUsers.valid) {
  await page.route('**/api/auth/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        auth: {
          method: 'env',
          user,
          scopes: ['repo', 'workflow', 'read:org'],
          missingScopes: [],
        },
        method: 'env',
        user,
        warnings: [],
      }),
    });
  });
}

/**
 * Mock auth status - authenticated via PAT
 */
export async function mockAuthenticatedPat(page: Page, user: MockUser = mockUsers.valid, missingScopes: string[] = []) {
  await page.route('**/api/auth/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        auth: {
          method: 'pat',
          user,
          scopes: missingScopes.length > 0 ? [] : ['repo', 'workflow', 'read:org'],
          missingScopes,
        },
        method: 'pat',
        user,
        warnings: missingScopes,
      }),
    });
  });
}

/**
 * Mock PAT validation - success
 */
export async function mockPatValidationSuccess(page: Page, user: MockUser = mockUsers.valid, warnings: string[] = []) {
  await page.route('**/api/auth/token', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          auth: {
            method: 'pat',
            user,
            scopes: warnings.length > 0 ? [] : ['repo', 'workflow', 'read:org'],
            missingScopes: warnings,
          },
          warning: warnings.length > 0 ? `Missing scopes: ${warnings.join(', ')}` : null,
        }),
      });
    }
  });
}

export async function mockPatValidationInvalid(page: Page) {
  await page.route('**/api/auth/token', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: false,
          error: 'GitHub rejected this token. Check token scopes and try again.',
        }),
      });
    }
  });
}

export async function mockPatValidationExpired(page: Page) {
  await page.route('**/api/auth/token', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: false,
          error: 'GitHub rejected this token. Check token scopes and try again.',
        }),
      });
    }
  });
}

export async function mockPatValidationMissingScopes(page: Page, user: MockUser = mockUsers.valid) {
  await page.route('**/api/auth/token', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          auth: {
            method: 'pat',
            user,
            scopes: [],
            missingScopes: ['repo', 'workflow'],
          },
          warning: 'Missing scopes: repo, workflow',
        }),
      });
    }
  });
}
