import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type {
  PipelineIssue,
  PipelinePR,
  PipelineWorkflowRun,
  PipelineDeployment,
} from '@/lib/pipeline/types';

const RATE_LIMIT_THRESHOLD = 1000;
const REDUCED_POLL_INTERVAL = 30_000;

interface PipelineQueryOptions {
  owner: string | null;
  repo: string | null;
}

function shouldReducePolling(rateLimitRemaining: number | null | undefined): boolean {
  if (rateLimitRemaining === null || rateLimitRemaining === undefined) return false;
  return rateLimitRemaining < RATE_LIMIT_THRESHOLD;
}

async function fetchPipelineData<T>(
  endpoint: string,
  owner: string,
  repo: string
): Promise<T> {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('owner', owner);
  url.searchParams.set('repo', repo);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function usePipelineIssues(owner: string | null, repo: string | null) {
  return useQuery({
    queryKey: ['pipeline', 'issues', owner, repo],
    queryFn: async () => {
      if (!owner || !repo) {
        throw new Error('owner and repo are required');
      }

      const response = await fetchPipelineData<{
        issues: PipelineIssue[];
        rateLimitRemaining: number;
      }>('/api/pipeline/issues', owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 10_000;
    },
  });
}

export function usePipelinePRs(owner: string | null, repo: string | null) {
  return useQuery({
    queryKey: ['pipeline', 'pulls', owner, repo],
    queryFn: async () => {
      if (!owner || !repo) {
        throw new Error('owner and repo are required');
      }

      const response = await fetchPipelineData<{
        pull_requests: PipelinePR[];
        rateLimitRemaining: number;
      }>('/api/pipeline/pulls', owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 10_000;
    },
  });
}

export function usePipelineWorkflows(owner: string | null, repo: string | null) {
  return useQuery({
    queryKey: ['pipeline', 'workflows', owner, repo],
    queryFn: async () => {
      if (!owner || !repo) {
        throw new Error('owner and repo are required');
      }

      const response = await fetchPipelineData<{
        workflows: PipelineWorkflowRun[];
        rateLimitRemaining: number;
      }>('/api/pipeline/workflows', owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 5_000;
    },
  });
}

export function usePipelineDeployments(owner: string | null, repo: string | null) {
  return useQuery({
    queryKey: ['pipeline', 'deployments', owner, repo],
    queryFn: async () => {
      if (!owner || !repo) {
        throw new Error('owner and repo are required');
      }

      const response = await fetchPipelineData<{
        deployments: PipelineDeployment[];
        rateLimitRemaining: number;
      }>('/api/pipeline/deployments', owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 15_000;
    },
  });
}

export function usePipelineOverview(owner: string | null, repo: string | null) {
  return useQuery({
    queryKey: ['pipeline', 'overview', owner, repo],
    queryFn: async () => {
      if (!owner || !repo) {
        throw new Error('owner and repo are required');
      }

      const response = await fetchPipelineData<{
        issues: PipelineIssue[];
        pull_requests: PipelinePR[];
        workflows: PipelineWorkflowRun[];
        deployments: PipelineDeployment[];
        rateLimitRemaining: number;
      }>('/api/pipeline/overview', owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 10_000;
    },
  });
}

export function useIssueDetail(
  owner: string | null,
  repo: string | null,
  number: number | null
) {
  return useQuery({
    queryKey: ['pipeline', 'issue', owner, repo, number],
    queryFn: async () => {
      if (!owner || !repo || number === null) {
        throw new Error('owner, repo, and number are required');
      }

      const response = await fetchPipelineData<{
        issue: PipelineIssue;
        comments: Array<{ id: string; author: string; body: string; created_at: string }>;
        rateLimitRemaining: number;
      }>(`/api/pipeline/issue/${number}`, owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo && number !== null),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 10_000;
    },
  });
}

export function usePRDetail(
  owner: string | null,
  repo: string | null,
  number: number | null
) {
  return useQuery({
    queryKey: ['pipeline', 'pr', owner, repo, number],
    queryFn: async () => {
      if (!owner || !repo || number === null) {
        throw new Error('owner, repo, and number are required');
      }

      const response = await fetchPipelineData<{
        pull: PipelinePR;
        reviews: Array<{ id: string; reviewer: string; state: string; submitted_at: string }>;
        rateLimitRemaining: number;
      }>(`/api/pipeline/pull/${number}`, owner, repo);

      return response;
    },
    enabled: Boolean(owner && repo && number !== null),
    staleTime: 5000,
    refetchInterval: (query) => {
      const rateLimitRemaining = query.state.data?.rateLimitRemaining;
      return shouldReducePolling(rateLimitRemaining)
        ? REDUCED_POLL_INTERVAL
        : 10_000;
    },
  });
}
