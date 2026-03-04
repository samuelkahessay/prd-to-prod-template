import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from '@/components/prd/EditorToolbar';

describe('EditorToolbar', () => {
  it('renders all toolbar buttons', () => {
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    expect(screen.getByTestId('toolbar-bold')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-italic')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-heading')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-list')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-code')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-link')).toBeInTheDocument();
  });

  it('calls onInsert with bold syntax when bold button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const boldButton = screen.getByTestId('toolbar-bold');
    await user.click(boldButton);
    
    expect(mockOnInsert).toHaveBeenCalledWith('**', 'wrap');
  });

  it('calls onInsert with italic syntax when italic button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const italicButton = screen.getByTestId('toolbar-italic');
    await user.click(italicButton);
    
    expect(mockOnInsert).toHaveBeenCalledWith('*', 'wrap');
  });

  it('calls onInsert with heading syntax when heading button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const headingButton = screen.getByTestId('toolbar-heading');
    await user.click(headingButton);
    
    expect(mockOnInsert).toHaveBeenCalledWith('## ', 'prefix');
  });

  it('calls onInsert with list syntax when list button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const listButton = screen.getByTestId('toolbar-list');
    await user.click(listButton);
    
    expect(mockOnInsert).toHaveBeenCalledWith('- ', 'prefix');
  });

  it('calls onInsert with code block syntax when code button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const codeButton = screen.getByTestId('toolbar-code');
    await user.click(codeButton);
    
    expect(mockOnInsert).toHaveBeenCalledWith('```\n\n```', 'block');
  });

  it('calls onInsert with link syntax when link button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const linkButton = screen.getByTestId('toolbar-link');
    await user.click(linkButton);
    
    expect(mockOnInsert).toHaveBeenCalledWith('[](url)', 'wrap');
  });

  it('has proper button titles for accessibility', () => {
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Heading')).toBeInTheDocument();
    expect(screen.getByTitle('List')).toBeInTheDocument();
    expect(screen.getByTitle('Code Block')).toBeInTheDocument();
    expect(screen.getByTitle('Link')).toBeInTheDocument();
  });

  it('uses ghost variant for all buttons', () => {
    const mockOnInsert = vi.fn();
    render(<EditorToolbar onInsert={mockOnInsert} />);
    
    const buttons = [
      screen.getByTestId('toolbar-bold'),
      screen.getByTestId('toolbar-italic'),
      screen.getByTestId('toolbar-heading'),
      screen.getByTestId('toolbar-list'),
      screen.getByTestId('toolbar-code'),
      screen.getByTestId('toolbar-link'),
    ];
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('data-variant', 'ghost');
    });
  });
});
