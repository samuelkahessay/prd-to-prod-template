import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrdEditor } from '@/components/prd/PrdEditor';

describe('PrdEditor', () => {
  it('renders textarea with blank template pre-populated', () => {
    render(<PrdEditor />);
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toContain('# [Project Name]');
    expect(textarea.value).toContain('## Overview');
  });

  it('renders markdown preview', () => {
    render(<PrdEditor />);
    const preview = screen.getByTestId('prd-editor-preview');
    expect(preview).toBeInTheDocument();
  });

  it('updates preview when typing in textarea', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea');
    await user.clear(textarea);
    await user.type(textarea, '# Test Heading');
    
    const preview = screen.getByTestId('prd-editor-preview');
    await waitFor(() => {
      expect(preview.textContent).toContain('Test Heading');
    });
  });

  it('displays character and word count', () => {
    render(<PrdEditor />);
    expect(screen.getByText(/\d+ words · \d+ characters/)).toBeInTheDocument();
  });

  it('updates word count when content changes', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea');
    await user.clear(textarea);
    await user.type(textarea, 'one two three');
    
    await waitFor(() => {
      expect(screen.getByText(/3 words/)).toBeInTheDocument();
    });
  });

  it('handles Tab key by inserting 2 spaces', async () => {
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 0);
    
    const initialValue = textarea.value;
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });
    
    await waitFor(() => {
      expect(textarea.value).toBe('  ' + initialValue);
    });
  });

  it('inserts bold markdown when clicking bold button', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'test');
    
    textarea.setSelectionRange(0, 4);
    
    const boldButton = screen.getByTestId('toolbar-bold');
    await user.click(boldButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('**test**');
    });
  });

  it('inserts italic markdown when clicking italic button', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'test');
    
    textarea.setSelectionRange(0, 4);
    
    const italicButton = screen.getByTestId('toolbar-italic');
    await user.click(italicButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('*test*');
    });
  });

  it('inserts heading markdown when clicking heading button', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'test');
    
    textarea.setSelectionRange(0, 4);
    
    const headingButton = screen.getByTestId('toolbar-heading');
    await user.click(headingButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('## test');
    });
  });

  it('inserts list markdown when clicking list button', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'item');
    
    textarea.setSelectionRange(0, 4);
    
    const listButton = screen.getByTestId('toolbar-list');
    await user.click(listButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('- item');
    });
  });

  it('inserts code block markdown when clicking code button', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'code');
    
    textarea.setSelectionRange(0, 4);
    
    const codeButton = screen.getByTestId('toolbar-code');
    await user.click(codeButton);
    
    await waitFor(() => {
      expect(textarea.value).toContain('```');
      expect(textarea.value).toContain('code');
    });
  });

  it('inserts link markdown when clicking link button', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const textarea = screen.getByTestId('prd-editor-textarea') as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, 'link text');
    
    textarea.setSelectionRange(0, 9);
    
    const linkButton = screen.getByTestId('toolbar-link');
    await user.click(linkButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('[link text](url)');
    });
  });

  it('has monospace font for textarea', () => {
    render(<PrdEditor />);
    const textarea = screen.getByTestId('prd-editor-textarea');
    expect(textarea).toHaveClass('font-mono');
  });

  it('allows switching between split, edit, and preview tabs', async () => {
    const user = userEvent.setup();
    render(<PrdEditor />);
    
    const editTab = screen.getByRole('tab', { name: /edit/i });
    await user.click(editTab);
    expect(editTab).toHaveAttribute('data-state', 'active');
    
    const previewTab = screen.getByRole('tab', { name: /preview/i });
    await user.click(previewTab);
    expect(previewTab).toHaveAttribute('data-state', 'active');
    
    const splitTab = screen.getByRole('tab', { name: /split/i });
    await user.click(splitTab);
    expect(splitTab).toHaveAttribute('data-state', 'active');
  });
});
