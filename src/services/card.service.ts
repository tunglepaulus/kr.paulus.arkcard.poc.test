import { API_ROUTES } from '@/constants';
import { IDataResponse, ISearchResponse } from '@/types/api';

export interface ConnectedUsersResponse {
  id: string;
  name: string;
  jobTitle: string;
  companyName: string;
  avatar: string;
  color: 'navy' | 'teal' | 'coral' | 'gold' | 'camel';
  email?: string;
  userUuid?: string;
}

export interface GetConnectedUsersParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const cardService = {
  getConnectedUsers: async (params: GetConnectedUsersParams) => {
    const { page, size, sortBy = 'name', sortDirection = 'asc' } = params;

    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortBy,
      sortDirection,
    });

    const response = await fetch(`${API_ROUTES.CARD.CONNECTED_USERS}?${searchParams.toString()}`);
    const result: IDataResponse<ISearchResponse<ConnectedUsersResponse[]>> = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch connected users');
    }

    return result.data;
  },
};
