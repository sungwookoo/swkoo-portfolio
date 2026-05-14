import { API_BASE_URL } from './api-base';

/** Triggers a JSON download with everything the service knows about the
 * signed-in user. Browser does the actual file save. */
export async function exportMyData(login: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/account/export`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `swkoo-${login}-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteMyAccount(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/account`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
}
