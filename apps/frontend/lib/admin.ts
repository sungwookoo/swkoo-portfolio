import useSWR from 'swr';

import { API_BASE_URL } from './api-base';

export interface AdminUser {
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
  isAllowed: boolean;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export const ADMIN_USERS_SWR_KEY = `${API_BASE_URL}/admin/users`;

export function useAdminUsers(enabled: boolean): {
  users: AdminUser[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, error, isLoading } = useSWR<AdminUsersResponse>(
    enabled ? ADMIN_USERS_SWR_KEY : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { users: data?.users, isLoading, error };
}

export async function setUserAllowed(
  login: string,
  isAllowed: boolean
): Promise<{ ok: true; login: string; isAllowed: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/users/${encodeURIComponent(login)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAllowed }),
    }
  );
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as { ok: true; login: string; isAllowed: boolean };
}
