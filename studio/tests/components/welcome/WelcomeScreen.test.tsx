import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/welcome/ShowcaseList', () => ({
  ShowcaseList: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="showcase-list">
      {entries.length > 0 ? `${entries.length} entries` : 'No entries'}
    </div>
  ),
}));

describe('WelcomeScreen', () => {
  const mockProps = {
    showcaseEntries: [],
    owner: 'test',
    repo: 'test',
  };

  it('renders welcome screen with data-testid', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
  });

  it('displays hero heading', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByText('Welcome to prd-to-prod Studio')).toBeInTheDocument();
  });

  it('displays hero description', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByText(/Turn product requirements into deployed software/i)).toBeInTheDocument();
  });

  it('displays CTA button with data-testid', () => {
    render(<WelcomeScreen {...mockProps} />);
    const cta = screen.getByTestId('welcome-cta');
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveTextContent('Create a PRD');
  });

  it('CTA button links to PRD creation', () => {
    render(<WelcomeScreen {...mockProps} />);
    const cta = screen.getByTestId('welcome-cta');
    expect(cta.closest('a')).toHaveAttribute('href', '/prd/new');
  });

  it('displays quick start guide heading', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
  });

  it('displays all three quick start steps', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByText(/Connect your repo/i)).toBeInTheDocument();
    expect(screen.getByText(/Write your product requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Watch the magic/i)).toBeInTheDocument();
  });

  it('displays showcase section heading', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByText('Completed Runs')).toBeInTheDocument();
  });

  it('renders ShowcaseList component', () => {
    render(<WelcomeScreen {...mockProps} />);
    expect(screen.getByTestId('showcase-list')).toBeInTheDocument();
  });

  it('passes showcase entries to ShowcaseList', () => {
    const entries = [
      {
        slug: '01-test',
        runNumber: '01',
        projectName: 'test',
        title: 'Test',
        tag: 'v1.0.0',
        date: 'March 2026',
      },
    ];
    render(<WelcomeScreen {...mockProps} showcaseEntries={entries} />);
    expect(screen.getByText('1 entries')).toBeInTheDocument();
  });

  it('uses responsive layout classes', () => {
    const { container } = render(<WelcomeScreen {...mockProps} />);
    const mainContainer = container.querySelector('[data-testid="welcome-screen"]');
    expect(mainContainer?.className).toMatch(/space-y/);
  });
});
