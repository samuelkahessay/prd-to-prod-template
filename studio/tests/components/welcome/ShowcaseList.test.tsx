import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowcaseList } from '@/components/welcome/ShowcaseList';
import type { ShowcaseEntry } from '@/lib/pipeline/types';

const mockEntries: ShowcaseEntry[] = [
  {
    slug: '01-user-auth',
    runNumber: '01',
    projectName: 'user-auth',
    title: 'Run 01 — User Authentication System',
    tag: 'v1.0.0',
    date: 'March 2026',
    deploymentUrl: 'https://app1.vercel.app',
    issueCount: '5',
    prCount: '4',
  },
  {
    slug: '02-payment-flow',
    runNumber: '02',
    projectName: 'payment-flow',
    title: 'Run 02 — Payment Flow',
    tag: 'v2.0.0',
    date: 'April 2026',
    issueCount: '8',
    prCount: '7',
  },
];

describe('ShowcaseList', () => {
  it('renders showcase list with data-testid', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    expect(screen.getByTestId('showcase-list')).toBeInTheDocument();
  });

  it('displays all showcase entries', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    const entries = screen.getAllByTestId('showcase-entry');
    expect(entries).toHaveLength(2);
  });

  it('displays entry titles', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    expect(screen.getByText('Run 01 — User Authentication System')).toBeInTheDocument();
    expect(screen.getByText('Run 02 — Payment Flow')).toBeInTheDocument();
  });

  it('displays entry tags', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
  });

  it('displays entry dates', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('displays issue and PR counts when available', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    expect(screen.getByText('5 issues')).toBeInTheDocument();
    expect(screen.getByText('4 PRs')).toBeInTheDocument();
    expect(screen.getByText('8 issues')).toBeInTheDocument();
    expect(screen.getByText('7 PRs')).toBeInTheDocument();
  });

  it('links to GitHub tag', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    const links = screen.getAllByRole('link', { name: /v\d+\.\d+\.\d+/ });
    expect(links[0]).toHaveAttribute('href', 'https://github.com/test/test/releases/tag/v1.0.0');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/test/test/releases/tag/v2.0.0');
  });

  it('displays deployment URL when available', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    const deployLink = screen.getByRole('link', { name: /app1\.vercel\.app/i });
    expect(deployLink).toHaveAttribute('href', 'https://app1.vercel.app');
  });

  it('does not display deployment link when URL is missing', () => {
    render(<ShowcaseList entries={mockEntries} owner="test" repo="test" />);
    const deployLinks = screen.queryAllByText(/deployment/i);
    expect(deployLinks.length).toBeLessThanOrEqual(1);
  });

  it('displays empty state when no entries', () => {
    render(<ShowcaseList entries={[]} owner="test" repo="test" />);
    expect(screen.getByText('No completed runs yet')).toBeInTheDocument();
  });

  it('displays empty state message in subdued style', () => {
    render(<ShowcaseList entries={[]} owner="test" repo="test" />);
    const emptyMessage = screen.getByText('No completed runs yet');
    expect(emptyMessage.className).toMatch(/muted/);
  });
});
