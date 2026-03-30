export interface WorkExperience {
  id: number;
  companyName: string;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string;
  isCurrent: boolean;
  isVisible: boolean;
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

export const workExperienceService = {
  getWorkExperiences: async (): Promise<WorkExperience[]> => {
    const result = await apiCall<{ success: boolean; data: WorkExperience[] }>(
      '/api/work-experiences',
      { method: 'GET' }
    );
    return result.data;
  },

  createWorkExperience: async (params: Omit<WorkExperience, 'id'>): Promise<WorkExperience> => {
    const result = await apiCall<{ success: boolean; data: WorkExperience }>(
      '/api/work-experiences',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return result.data;
  },

  updateWorkExperience: async (params: WorkExperience): Promise<WorkExperience> => {
    const result = await apiCall<{ success: boolean; data: WorkExperience }>(
      `/api/work-experiences/${params.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          companyName: params.companyName,
          title: params.title,
          startDate: params.startDate,
          endDate: params.endDate,
          description: params.description,
          isCurrent: params.isCurrent,
        }),
      }
    );
    return result.data;
  },

  deleteWorkExperience: async (id: number): Promise<void> => {
    await apiCall<{ success: boolean }>(`/api/work-experiences/${id}`, {
      method: 'DELETE',
    });
  },
};
