export interface ScrapeJuries {
  years: number[];
  role: string;
  eventName: string;
}

export interface JuryExperience extends ScrapeJuries {
  id: number;
}

export interface JuryListItem {
  eventName: string;
  roles: string[];
  years: number[];
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

export const juryExperienceService = {
  // Fetch all distinct juries from the database for user selection
  getAllJuries: async (): Promise<JuryListItem[]> => {
    const result = await apiCall<{ success: boolean; data: JuryListItem[] }>(
      '/api/juries',
      { method: 'GET' }
    );
    return result.data;
  },

  getJuryExperiences: async (): Promise<JuryExperience[]> => {
    const result = await apiCall<{ success: boolean; data: JuryExperience[] }>(
      '/api/jury-experiences',
      { method: 'GET' }
    );
    return result.data;
  },

  updateJuryExperiencesBulk: async (params: ScrapeJuries[]): Promise<ScrapeJuries[]> => {
    const result = await apiCall<{ success: boolean; data: ScrapeJuries[] }>(
      '/api/jury-experiences/bulk',
      {
        method: 'PUT',
        body: JSON.stringify({ experiences: params }),
      }
    );
    return result.data;
  },

  createJuryExperience: async (params: ScrapeJuries): Promise<JuryExperience> => {
    const result = await apiCall<{ success: boolean; data: JuryExperience }>(
      '/api/jury-experiences',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return result.data;
  },

  updateJuryExperience: async (params: JuryExperience): Promise<JuryExperience> => {
    const result = await apiCall<{ success: boolean; data: JuryExperience }>(
      `/api/jury-experiences/${params.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          eventName: params.eventName,
          role: params.role,
          years: params.years,
        }),
      }
    );
    return result.data;
  },

  deleteJuryExperience: async (id: number): Promise<void> => {
    await apiCall<{ success: boolean }>(
      `/api/jury-experiences/${id}`,
      { method: 'DELETE' }
    );
  },
};


