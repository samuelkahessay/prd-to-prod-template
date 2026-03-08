import { Route } from '@playwright/test';

/**
 * Mock responses for GitHub Contents API
 */

export const mockFileCreateSuccess = {
  content: {
    name: 'test-prd.md',
    path: 'docs/prd/test-prd.md',
    sha: 'abc123def456',
    size: 1024,
    url: 'https://api.github.com/repos/testuser/testrepo/contents/docs/prd/test-prd.md',
    html_url: 'https://github.com/testuser/testrepo/blob/main/docs/prd/test-prd.md',
    git_url: 'https://api.github.com/repos/testuser/testrepo/git/blobs/abc123def456',
    download_url: 'https://raw.githubusercontent.com/testuser/testrepo/main/docs/prd/test-prd.md',
    type: 'file',
    _links: {
      self: 'https://api.github.com/repos/testuser/testrepo/contents/docs/prd/test-prd.md',
      git: 'https://api.github.com/repos/testuser/testrepo/git/blobs/abc123def456',
      html: 'https://github.com/testuser/testrepo/blob/main/docs/prd/test-prd.md',
    },
  },
  commit: {
    sha: 'commit123abc',
    node_id: 'C_node123',
    url: 'https://api.github.com/repos/testuser/testrepo/commits/commit123abc',
    html_url: 'https://github.com/testuser/testrepo/commit/commit123abc',
    author: {
      name: 'Test User',
      email: 'test@example.com',
      date: new Date().toISOString(),
    },
    committer: {
      name: 'Test User',
      email: 'test@example.com',
      date: new Date().toISOString(),
    },
    tree: {
      sha: 'tree123',
      url: 'https://api.github.com/repos/testuser/testrepo/git/trees/tree123',
    },
    message: 'Add PRD: test-prd',
    parents: [],
    verification: {
      verified: false,
      reason: 'unsigned',
      signature: null,
      payload: null,
    },
  },
};

export const mockIssueCreateSuccess = {
  id: 1,
  node_id: 'I_node1',
  url: 'https://api.github.com/repos/testuser/testrepo/issues/1',
  repository_url: 'https://api.github.com/repos/testuser/testrepo',
  labels_url: 'https://api.github.com/repos/testuser/testrepo/issues/1/labels{/name}',
  comments_url: 'https://api.github.com/repos/testuser/testrepo/issues/1/comments',
  events_url: 'https://api.github.com/repos/testuser/testrepo/issues/1/events',
  html_url: 'https://github.com/testuser/testrepo/issues/1',
  number: 1,
  state: 'open',
  title: '[Pipeline] PRD Submitted',
  body: 'PRD file: `docs/prd/test-prd.md`\n\nReview the PRD and comment `/decompose` to generate implementation tasks.',
  user: {
    login: 'testuser',
    id: 123,
    node_id: 'U_node123',
    avatar_url: 'https://avatars.githubusercontent.com/u/123',
    gravatar_id: '',
    url: 'https://api.github.com/users/testuser',
    html_url: 'https://github.com/testuser',
    type: 'User',
    site_admin: false,
  },
  labels: [{ name: 'prd' }],
  assignee: null,
  assignees: [],
  milestone: null,
  locked: false,
  active_lock_reason: null,
  comments: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  closed_at: null,
  author_association: 'OWNER',
};

/**
 * Route handlers for Playwright test mocking
 */

export async function routePrdSubmitSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      file: mockFileCreateSuccess.content,
      issue: mockIssueCreateSuccess,
    }),
  });
}

export async function routePrdSubmitForbidden(route: Route) {
  await route.fulfill({
    status: 403,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'Resource not accessible by integration',
      documentation_url: 'https://docs.github.com/rest/repos/contents#create-or-update-file-contents',
    }),
  });
}

export async function routePrdSubmitUnprocessable(route: Route) {
  await route.fulfill({
    status: 422,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'Validation Failed',
      errors: [
        {
          resource: 'Issue',
          code: 'invalid',
          field: 'title',
          message: 'title is too long (maximum is 256 characters)',
        },
      ],
    }),
  });
}

export async function routePrdSubmitServerError(route: Route) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      message: 'Internal Server Error',
    }),
  });
}

export async function routeRepoValidateSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      valid: true,
      owner: 'testuser',
      repo: 'testrepo',
      fullName: 'testuser/testrepo',
      private: false,
      permissions: {
        admin: true,
        push: true,
        pull: true,
      },
    }),
  });
}
