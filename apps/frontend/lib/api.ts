import type { PipelinesEnvelope, PortfolioOverview, WorkflowsEnvelope } from './types';

const defaultBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/api'
    : 'https://swkoo.kr/api');

export const API_BASE_URL = defaultBaseUrl;

export async function fetchOverview(): Promise<PortfolioOverview | null> {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/overview`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.warn('Failed to load overview', response.statusText);
      return null;
    }

    return (await response.json()) as PortfolioOverview;
  } catch (error) {
    console.warn('Overview request failed', error);
    return null;
  }
}

export async function fetchPipelines(): Promise<PipelinesEnvelope> {
  if (!API_BASE_URL) {
    return {
      configured: false,
      fetchedAt: null,
      pipelines: []
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/pipelines`, {
      next: { revalidate: 15 }
    });

    if (!response.ok) {
      console.warn('Failed to load pipelines', response.statusText);
      return {
        configured: false,
        fetchedAt: null,
        pipelines: []
      };
    }

    const payload = (await response.json()) as PipelinesEnvelope;

    return {
      configured: Boolean(payload.configured),
      fetchedAt: payload.fetchedAt ?? null,
      pipelines: Array.isArray(payload.pipelines) ? payload.pipelines : []
    };
  } catch (error) {
    console.warn('Pipelines request failed', error);
    return {
      configured: false,
      fetchedAt: null,
      pipelines: []
    };
  }
}

export interface FetchWorkflowsOptions {
  workflow?: string;
  page?: number;
  perPage?: number;
}

export async function fetchWorkflows(
  pipelineName: string,
  options: FetchWorkflowsOptions = {}
): Promise<WorkflowsEnvelope> {
  if (!API_BASE_URL) {
    return {
      configured: false,
      repoUrl: null,
      workflows: [],
      runs: [],
      pagination: { page: 1, perPage: 10, total: 0 }
    };
  }

  try {
    const params = new URLSearchParams();
    if (options.workflow) params.set('workflow', options.workflow);
    if (options.page) params.set('page', String(options.page));
    if (options.perPage) params.set('per_page', String(options.perPage));

    const queryString = params.toString();
    const url = `${API_BASE_URL}/pipelines/${encodeURIComponent(pipelineName)}/workflows${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      console.warn('Failed to load workflows', response.statusText);
      return {
        configured: false,
        repoUrl: null,
        workflows: [],
        runs: [],
        pagination: { page: 1, perPage: 10, total: 0 }
      };
    }

    return (await response.json()) as WorkflowsEnvelope;
  } catch (error) {
    console.warn('Workflows request failed', error);
    return {
      configured: false,
      repoUrl: null,
      workflows: [],
      runs: [],
      pagination: { page: 1, perPage: 10, total: 0 }
    };
  }
}
