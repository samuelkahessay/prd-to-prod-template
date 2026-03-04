import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  commitPrdFile,
  slugify,
  submitPrd,
  type SubmitPrdResult,
} from '@/lib/prd/submit';

function createJsonResponse(body: Record<string, unknown>, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('lib/prd/submit', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('calls API route for each submission step', async () => {
    const mockedFetch = global.fetch as ReturnType<typeof vi.fn>;

    mockedFetch
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          issueNumber: 42,
          issueUrl: 'https://github.com/acme/repo/issues/42',
        })
      )
      .mockResolvedValueOnce(createJsonResponse({ success: true }));

    const result = await submitPrd({
      owner: 'acme',
      repo: 'repo',
      title: 'My PRD',
      content: '# My PRD\nDetails',
    });

    expect(result).toEqual({
      success: true,
      issueNumber: 42,
      issueUrl: 'https://github.com/acme/repo/issues/42',
    });

    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedFetch).toHaveBeenNthCalledWith(
      1,
      '/api/prd/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          owner: 'acme',
          repo: 'repo',
          title: 'My PRD',
          content: '# My PRD\nDetails',
          step: 'commitFile',
        }),
      })
    );
    expect(mockedFetch).toHaveBeenNthCalledWith(
      2,
      '/api/prd/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          owner: 'acme',
          repo: 'repo',
          title: 'My PRD',
          content: '# My PRD\nDetails',
          step: 'createIssue',
        }),
      })
    );
    expect(mockedFetch).toHaveBeenNthCalledWith(
      3,
      '/api/prd/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          owner: 'acme',
          repo: 'repo',
          issueNumber: 42,
          step: 'triggerDecompose',
        }),
      })
    );
  });

  it('returns failedStep commitFile when step 1 fails', async () => {
    const mockedFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockedFetch.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error: 'Commit failed',
          step: 'commitFile',
        },
        false
      )
    );

    const result = await submitPrd({
      owner: 'acme',
      repo: 'repo',
      title: 'My PRD',
      content: 'text',
    });

    expect(result).toEqual<SubmitPrdResult>({
      success: false,
      error: 'Commit failed',
      failedStep: 'commitFile',
    });
  });

  it('returns failedStep createIssue when step 2 fails', async () => {
    const mockedFetch = global.fetch as ReturnType<typeof vi.fn>;

    mockedFetch
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            success: false,
            error: 'Issue creation failed',
            step: 'createIssue',
          },
          false
        )
      );

    const result = await submitPrd({
      owner: 'acme',
      repo: 'repo',
      title: 'My PRD',
      content: 'text',
    });

    expect(result).toEqual<SubmitPrdResult>({
      success: false,
      error: 'Issue creation failed',
      failedStep: 'createIssue',
    });
  });

  it('returns failedStep triggerDecompose when step 3 fails', async () => {
    const mockedFetch = global.fetch as ReturnType<typeof vi.fn>;

    mockedFetch
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          issueNumber: 42,
          issueUrl: 'https://github.com/acme/repo/issues/42',
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            success: false,
            error: 'Decompose trigger failed',
            step: 'triggerDecompose',
          },
          false
        )
      );

    const result = await submitPrd({
      owner: 'acme',
      repo: 'repo',
      title: 'My PRD',
      content: 'text',
    });

    expect(result).toEqual<SubmitPrdResult>({
      success: false,
      error: 'Decompose trigger failed',
      failedStep: 'triggerDecompose',
    });
  });

  it('generates slugged PRD file path from title', async () => {
    const mockedFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockedFetch.mockResolvedValueOnce(createJsonResponse({ success: true }));

    const result = await commitPrdFile(
      'acme',
      'repo',
      'Complex PRD: A New Feature!!!',
      '# Content'
    );

    expect(slugify('Complex PRD: A New Feature!!!')).toBe('complex-prd-a-new-feature');
    expect(result.path).toBe('docs/prd/complex-prd-a-new-feature.md');
  });
});
