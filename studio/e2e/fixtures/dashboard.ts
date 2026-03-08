import type { Route } from '@playwright/test';

const VALID_PAT = 'ghp_valid1234567890abcdefghijklmnopqrst';

const mockPipelineOverview = {
  issues: {
    total: 5,
    open: 3,
    closed: 2,
    inProgress: 1,
    ready: 2,
    completed: 2,
  },
  pullRequests: {
    total: 3,
    open: 1,
    merged: 2,
    approved: 1,
  },
  workflows: {
    total: 2,
    success: 1,
    failure: 1,
  },
  deployments: {
    total: 1,
    production: 1,
    staging: 0,
  },
};

const mockIssues = [
  {
    number: 101,
    title: '[Pipeline] Initial project scaffolding',
    state: 'closed',
    labels: [
      { name: 'pipeline' },
      { name: 'infra' },
      { name: 'completed' },
    ],
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T12:00:00Z',
    closed_at: '2026-03-01T12:00:00Z',
    pull_request: { url: 'https://api.github.com/repos/testuser/testrepo/pulls/201' },
    body: 'Set up Next.js project structure.\n\nAcceptance criteria:\n- [ ] Next.js initialized\n- [ ] TypeScript configured',
  },
  {
    number: 102,
    title: '[Pipeline] Implement authentication',
    state: 'closed',
    labels: [
      { name: 'pipeline' },
      { name: 'feature' },
      { name: 'completed' },
    ],
    created_at: '2026-03-01T12:00:00Z',
    updated_at: '2026-03-02T10:00:00Z',
    closed_at: '2026-03-02T10:00:00Z',
    pull_request: { url: 'https://api.github.com/repos/testuser/testrepo/pulls/202' },
    body: 'Depends on #101\n\nImplement GitHub PAT authentication.\n\nAcceptance criteria:\n- [ ] AuthGuard component\n- [ ] Token validation',
  },
  {
    number: 103,
    title: '[Pipeline] Build dashboard UI',
    state: 'open',
    labels: [
      { name: 'pipeline' },
      { name: 'feature' },
      { name: 'in-progress' },
    ],
    created_at: '2026-03-02T10:00:00Z',
    updated_at: '2026-03-03T09:00:00Z',
    pull_request: { url: 'https://api.github.com/repos/testuser/testrepo/pulls/203' },
    body: 'Depends on #102\n\nCreate main dashboard with status cards and pipeline DAG.\n\nAcceptance criteria:\n- [ ] Status cards\n- [ ] Pipeline flow visualization',
  },
  {
    number: 104,
    title: '[Pipeline] Add activity feed',
    state: 'open',
    labels: [
      { name: 'pipeline' },
      { name: 'feature' },
      { name: 'ready' },
    ],
    created_at: '2026-03-02T11:00:00Z',
    updated_at: '2026-03-02T11:00:00Z',
    body: 'Depends on #103\n\nDisplay recent pipeline events in activity feed.\n\nAcceptance criteria:\n- [ ] Event timeline\n- [ ] Real-time updates',
  },
  {
    number: 105,
    title: '[Pipeline] Write E2E tests',
    state: 'open',
    labels: [
      { name: 'pipeline' },
      { name: 'test' },
      { name: 'ready' },
    ],
    created_at: '2026-03-02T12:00:00Z',
    updated_at: '2026-03-02T12:00:00Z',
    body: 'Depends on #104\n\nComprehensive Playwright E2E test suite.\n\nAcceptance criteria:\n- [ ] Dashboard tests\n- [ ] Pipeline DAG tests\n- [ ] Activity feed tests',
  },
];

const mockPullRequests = [
  {
    number: 201,
    title: '[Pipeline] Initial project scaffolding (#101)',
    state: 'closed',
    merged_at: '2026-03-01T12:00:00Z',
    created_at: '2026-03-01T10:30:00Z',
    updated_at: '2026-03-01T12:00:00Z',
    head: { ref: 'repo-assist/issue-101-scaffolding' },
    base: { ref: 'main' },
    labels: [{ name: 'automation' }, { name: 'pipeline' }],
    body: 'Closes #101\n\nThis PR was created by Pipeline Assistant.',
  },
  {
    number: 202,
    title: '[Pipeline] Implement authentication (#102)',
    state: 'closed',
    merged_at: '2026-03-02T10:00:00Z',
    created_at: '2026-03-01T14:00:00Z',
    updated_at: '2026-03-02T10:00:00Z',
    head: { ref: 'repo-assist/issue-102-auth' },
    base: { ref: 'main' },
    labels: [{ name: 'automation' }, { name: 'pipeline' }],
    body: 'Closes #102\n\nThis PR was created by Pipeline Assistant.',
  },
  {
    number: 203,
    title: '[Pipeline] Build dashboard UI (#103)',
    state: 'open',
    created_at: '2026-03-02T11:00:00Z',
    updated_at: '2026-03-03T09:00:00Z',
    head: { ref: 'repo-assist/issue-103-dashboard' },
    base: { ref: 'main' },
    labels: [{ name: 'automation' }, { name: 'pipeline' }],
    body: 'Closes #103\n\nThis PR was created by Pipeline Assistant.',
    draft: false,
  },
];

const mockWorkflowRuns = {
  total_count: 2,
  workflow_runs: [
    {
      id: 301,
      name: 'CI',
      status: 'completed',
      conclusion: 'success',
      created_at: '2026-03-02T10:00:00Z',
      updated_at: '2026-03-02T10:05:00Z',
      head_branch: 'main',
      event: 'push',
    },
    {
      id: 302,
      name: 'CI',
      status: 'completed',
      conclusion: 'failure',
      created_at: '2026-03-03T08:00:00Z',
      updated_at: '2026-03-03T08:03:00Z',
      head_branch: 'repo-assist/issue-103-dashboard',
      event: 'pull_request',
    },
  ],
};

const mockDeployments = [
  {
    id: 401,
    environment: 'production',
    state: 'success',
    created_at: '2026-03-02T10:10:00Z',
    updated_at: '2026-03-02T10:15:00Z',
    creator: { login: 'github-actions[bot]' },
  },
];

const emptyPipelineOverview = {
  issues: { total: 0, open: 0, closed: 0, inProgress: 0, ready: 0, completed: 0 },
  pullRequests: { total: 0, open: 0, merged: 0, approved: 0 },
  workflows: { total: 0, success: 0, failure: 0 },
  deployments: { total: 0, production: 0, staging: 0 },
};

export async function routePipelineOverview(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockPipelineOverview),
  });
}

export async function routeEmptyPipelineOverview(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(emptyPipelineOverview),
  });
}

export async function routePipelineIssues(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockIssues),
  });
}

export async function routeEmptyPipelineIssues(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  });
}

export async function routePipelinePulls(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockPullRequests),
  });
}

export async function routePipelineWorkflows(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockWorkflowRuns),
  });
}

export async function routePipelineDeployments(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockDeployments),
  });
}

export async function routeAuthStatus(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      authenticated: true,
      auth: {
        method: 'pat',
        user: { login: 'testuser' },
        scopes: ['repo', 'read:org'],
        missingScopes: [],
      },
    }),
  });
}

export async function routeApiError(route: Route) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Internal server error' }),
  });
}

export async function setupMockRepo(page: any) {
  await page.evaluate((token: string) => {
    localStorage.setItem('github_pat', token);
    localStorage.setItem('prd-to-prod-studio:current-repo', JSON.stringify({
      owner: 'testuser',
      repo: 'testrepo',
    }));
  }, VALID_PAT);
}

export async function clearMockRepo(page: any) {
  await page.evaluate(() => {
    localStorage.removeItem('github_pat');
    localStorage.removeItem('prd-to-prod-studio:current-repo');
  });
}

export {
  VALID_PAT,
  mockPipelineOverview,
  mockIssues,
  mockPullRequests,
  mockWorkflowRuns,
  mockDeployments,
  emptyPipelineOverview,
};
