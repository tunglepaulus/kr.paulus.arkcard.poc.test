import { IDataResponse } from '@/types';

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'An unexpected error occurred');
  }
  return result;
}

export const connectionService = {
  connect: async (uuid: string) => {
    const result = await apiFetch<IDataResponse<null>>(`/api/connections/${uuid}`, {
      method: 'POST',
    });
    return result;
  },

  disconnect: async (uuid: string) => {
    const result = await apiFetch<IDataResponse<null>>(`/api/connections/${uuid}`, {
      method: 'DELETE',
    });
    return result;
  },
};
