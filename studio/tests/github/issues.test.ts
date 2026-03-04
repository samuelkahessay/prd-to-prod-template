import { describe, expect, it, vi } from 'vitest';

import {
  addLabel,
  closeIssue,
  getIssue,
  getIssueComments,
  listPipelineIssues,
  removeLabel,
} from '@/lib/github/issues';

vi.mock('@octokit/rest', () => ({}));

function createMockClient() {
  return {
    rest: {
      issues: {
        listForRepo: vi.fn(),
        get: vi.fn(),
        listComments: vi.fn(),
        addLabels: vi.fn(),
        removeLabel: vi.fn(),
        update: vi.fn(),
      },
    },
  };
}

describe('github issues module', () => {
  it('lists pipeline issues with state filtering', async () => {
    const client = createMockClient();
    client.rest.issues.listForRepo.mockResolvedValue({ data: [{ id: 1 }] });

    const result = await listPipelineIssues({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      state: 'closed',
      perPage: 20,
      page: 2,
    });

    expect(client.rest.issues.listForRepo).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      state: 'closed',
      labels: 'pipeline',
      per_page: 20,
      page: 2,
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('gets an issue by number', async () => {
    const client = createMockClient();
    client.rest.issues.get.mockResolvedValue({ data: { number: 99 } });

    const result = await getIssue({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 99,
    });

    expect(client.rest.issues.get).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 99,
    });
    expect(result).toEqual({ number: 99 });
  });

  it('lists issue comments', async () => {
    const client = createMockClient();
    client.rest.issues.listComments.mockResolvedValue({ data: [{ id: 10 }] });

    const result = await getIssueComments({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 7,
      perPage: 50,
      page: 1,
    });

    expect(client.rest.issues.listComments).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 7,
      per_page: 50,
      page: 1,
    });
    expect(result).toEqual([{ id: 10 }]);
  });

  it('adds labels', async () => {
    const client = createMockClient();
    client.rest.issues.addLabels.mockResolvedValue({ data: [{ name: 'ready' }] });

    const result = await addLabel({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 3,
      labels: ['ready'],
    });

    expect(client.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 3,
      labels: ['ready'],
    });
    expect(result).toEqual([{ name: 'ready' }]);
  });

  it('removes a label', async () => {
    const client = createMockClient();
    client.rest.issues.removeLabel.mockResolvedValue({ data: [{ name: 'pipeline' }] });

    const result = await removeLabel({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 3,
      label: 'pipeline',
    });

    expect(client.rest.issues.removeLabel).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 3,
      name: 'pipeline',
    });
    expect(result).toEqual([{ name: 'pipeline' }]);
  });

  it('closes an issue', async () => {
    const client = createMockClient();
    client.rest.issues.update.mockResolvedValue({ data: { state: 'closed' } });

    const result = await closeIssue({
      client: client as never,
      owner: 'acme',
      repo: 'pipeline',
      issueNumber: 8,
    });

    expect(client.rest.issues.update).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'pipeline',
      issue_number: 8,
      state: 'closed',
    });
    expect(result).toEqual({ state: 'closed' });
  });
});
