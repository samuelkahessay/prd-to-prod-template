import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

import { QueryClientProvider, createQueryClient } from '@/lib/queries/provider';

describe('createQueryClient', () => {
  it('creates a QueryClient instance with default configuration', () => {
    const client = createQueryClient();
    
    expect(client).toBeInstanceOf(QueryClient);
    
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(10_000);
    expect(defaultOptions.queries?.refetchInterval).toBe(10_000);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaultOptions.queries?.retry).toBe(1);
  });

  it('creates independent instances on each call', () => {
    const client1 = createQueryClient();
    const client2 = createQueryClient();
    
    expect(client1).not.toBe(client2);
  });
});

describe('QueryClientProvider', () => {
  it('provides QueryClient to child components', () => {
    function TestComponent() {
      const client = useQueryClient();
      return <div data-testid="has-client">{client ? 'yes' : 'no'}</div>;
    }

    render(
      <QueryClientProvider>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('has-client')).toHaveTextContent('yes');
  });

  it('creates a new client instance per provider', () => {
    function TestComponent({ onClient }: { onClient: (c: QueryClient) => void }) {
      onClient(useQueryClient());
      return null;
    }

    let client1: QueryClient | undefined;
    let client2: QueryClient | undefined;

    const { unmount: unmount1 } = render(
      <QueryClientProvider>
        <TestComponent onClient={(c) => { client1 = c; }} />
      </QueryClientProvider>
    );

    const { unmount: unmount2 } = render(
      <QueryClientProvider>
        <TestComponent onClient={(c) => { client2 = c; }} />
      </QueryClientProvider>
    );

    expect(client1).not.toBe(client2);

    unmount1();
    unmount2();
  });
});
