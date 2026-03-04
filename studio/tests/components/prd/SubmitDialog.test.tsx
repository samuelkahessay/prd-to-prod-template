import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubmitDialog } from '@/components/prd/SubmitDialog';

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SubmitDialog
        open={open}
        onOpenChange={vi.fn()}
        owner="acme"
        repo="repo"
        title="My PRD"
        content="# My PRD"
      />
    </QueryClientProvider>
  );
}

function createJsonResponse(body: Record<string, unknown>, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('SubmitDialog', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('renders all 3 submission steps', () => {
    renderDialog();

    expect(screen.getByText('Committing PRD file...')).toBeInTheDocument();
    expect(screen.getByText('Creating GitHub issue...')).toBeInTheDocument();
    expect(screen.getByText('Triggering /decompose...')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    let resolveCommit: ((value: Response) => void) | null = null;

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveCommit = resolve;
          })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          issueNumber: 42,
          issueUrl: 'https://github.com/acme/repo/issues/42',
        })
      )
      .mockResolvedValueOnce(createJsonResponse({ success: true }));

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('step-commitFile')).toHaveAttribute(
        'data-status',
        'loading'
      );
    });

    resolveCommit?.(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }));
  });

  it('shows success state with issue link', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          issueNumber: 42,
          issueUrl: 'https://github.com/acme/repo/issues/42',
        })
      )
      .mockResolvedValueOnce(createJsonResponse({ success: true }));

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('step-triggerDecompose')).toHaveAttribute(
        'data-status',
        'success'
      );
    });

    const issueLink = screen.getByRole('link', { name: /open created issue/i });
    expect(issueLink).toHaveAttribute('href', 'https://github.com/acme/repo/issues/42');
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(
        createJsonResponse({ success: false, error: 'Issue create failed' }, false)
      );

    renderDialog();

    await waitFor(() => {
      expect(screen.getByText('Issue create failed')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retry re-triggers submission', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(createJsonResponse({ success: false, error: 'Issue create failed' }, false))
      .mockResolvedValueOnce(createJsonResponse({ success: true, path: 'docs/prd/my-prd.md' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          issueNumber: 9,
          issueUrl: 'https://github.com/acme/repo/issues/9',
        })
      )
      .mockResolvedValueOnce(createJsonResponse({ success: true }));

    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /open created issue/i })).toHaveAttribute(
        'href',
        'https://github.com/acme/repo/issues/9'
      );
    });

    expect(global.fetch).toHaveBeenCalledTimes(5);
  });
});
