import useSWR from 'swr';

import { API_BASE_URL } from './api-base';

export interface Me {
  id: number;
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAllowed: boolean;
  isAdmin: boolean;
  requiresReauth: boolean;
  brandName: string;
}

async function fetcher(url: string): Promise<Me | null> {
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`auth/me failed: ${response.status}`);
  }
  return (await response.json()) as Me;
}

export const ME_SWR_KEY = `${API_BASE_URL}/auth/me`;

export function useMe(): {
  me: Me | null | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, error, isLoading } = useSWR<Me | null>(ME_SWR_KEY, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  return { me: data, isLoading, error };
}

export function loginUrl(): string {
  return `${API_BASE_URL}/auth/github/login`;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
