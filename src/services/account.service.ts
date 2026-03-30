import { API_ROUTES, ENUM_PRESIGNED_UPLOAD_TYPE } from '@/constants';
import { IDataResponse } from '@/types';
import { UserType } from '@/types/user';

export type UpdatePicturePayload = {
  uploadType: ENUM_PRESIGNED_UPLOAD_TYPE;
  pictureUrl: string;
};

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

export const accountService = {
  // 1. Get profile information (calls Supabase-backed Next.js API route)
  getProfile: async (): Promise<UserType> => {
    const result = await apiFetch<{ success: boolean; data: UserType }>('/api/profile');
    return result.data;
  },

  // 2. Update Name
  updateName: async (name: string) => {
    const result = await apiFetch<IDataResponse<UserType>>(API_ROUTES.ACCOUNT.UPDATE_NAME, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return result.data;
  },

  // 3. Update Job Title
  updateJobTitle: async (jobTitle: string) => {
    const result = await apiFetch<IDataResponse<UserType>>(
      API_ROUTES.ACCOUNT.UPDATE_CURRENT_JOB_TITLE,
      {
        method: 'PUT',
        body: JSON.stringify({ jobTitle }),
      }
    );
    return result.data;
  },

  // 4. Update Company Name
  updateCompanyName: async (companyName: string) => {
    const result = await apiFetch<IDataResponse<UserType>>(
      API_ROUTES.ACCOUNT.UPDATE_CURRENT_COMPANY_NAME,
      {
        method: 'PUT',
        body: JSON.stringify({ companyName }),
      }
    );
    return result.data;
  },

  updatePicture: async (params: UpdatePicturePayload) => {
    const result = await apiFetch<IDataResponse<string>>(API_ROUTES.ACCOUNT.UPDATE_PICTURE, {
      method: 'PUT',
      body: JSON.stringify({ ...params }),
    });
    return result;
  },
};
