import useSWR from 'swr';

import { API_BASE_URL } from './api';

export interface RepoSummary {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
  isFork: boolean;
  isPrivate: boolean;
}

export type StackPreview =
  | { stack: 'nextjs'; packageName: string | null; port: number; nodeEngine: string | null }
  | { stack: 'unsupported'; reason: string };

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function useRepos(enabled: boolean): {
  repos: RepoSummary[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, error, isLoading } = useSWR<RepoSummary[]>(
    enabled ? `${API_BASE_URL}/deploy/repos` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { repos: data, isLoading, error };
}

export function usePreview(fullName: string | null): {
  preview: StackPreview | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, error, isLoading } = useSWR<StackPreview>(
    fullName ? `${API_BASE_URL}/deploy/preview?repo=${encodeURIComponent(fullName)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { preview: data, isLoading, error };
}
