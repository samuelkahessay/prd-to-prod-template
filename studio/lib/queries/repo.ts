import { useQuery } from '@tanstack/react-query';

interface RepoValidationResponse {
  valid: boolean;
  missingWorkflows: string[];
  hasWorkflows: boolean;
}

export function useRepoValidation(owner: string | null, repo: string | null) {
  return useQuery({
    queryKey: ['repo', 'validation', owner, repo],
    queryFn: async (): Promise<RepoValidationResponse> => {
      if (!owner || !repo) {
        throw new Error('owner and repo are required');
      }

      const url = new URL('/api/repo/validate', window.location.origin);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo }),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate repo: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: Boolean(owner && repo),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
