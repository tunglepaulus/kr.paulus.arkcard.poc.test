export interface AwardRecord {
  id: number;
  organization: string;
  years: number[];
  awardType: string;
  category: string;
}

// Helper to call server-side API routes
async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
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

export const awardRecordService = {
  getAwardRecords: async (): Promise<AwardRecord[]> => {
    const result = await apiCall<{ success: boolean; data: AwardRecord[] }>('/api/award-records', {
      method: 'GET',
    });
    return result.data;
  },

  createAwardRecord: async (params: Omit<AwardRecord, 'id'>): Promise<AwardRecord> => {
    const result = await apiCall<{ success: boolean; data: AwardRecord }>('/api/award-records', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return result.data;
  },

  updateAwardRecord: async (params: AwardRecord): Promise<AwardRecord> => {
    const result = await apiCall<{ success: boolean; data: AwardRecord }>(
      `/api/award-records/${params.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          organization: params.organization,
          years: params.years,
          awardType: params.awardType,
          category: params.category,
        }),
      }
    );
    return result.data;
  },

  deleteAwardRecord: async (id: number): Promise<void> => {
    await apiCall<{ success: boolean }>(`/api/award-records/${id}`, {
      method: 'DELETE',
    });
  },
};
