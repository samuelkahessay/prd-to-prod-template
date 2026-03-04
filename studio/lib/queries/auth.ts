import { useQuery } from '@tanstack/react-query';

interface AuthStatusResponse {
  authenticated: boolean;
  user?: {
    login: string;
    name: string | null;
    avatar_url: string;
  };
  method: string;
  warnings: string[];
}

export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: async (): Promise<AuthStatusResponse> => {
      const url = new URL('/api/auth/status', window.location.origin);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch auth status: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
