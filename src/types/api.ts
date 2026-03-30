export type IInfiniteDataResponse<T> = {
  limit: number;
  page: number;
  pageCount: number;
  total: number;
} & T;

export interface IDataResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
  error: IErrorResponse | null;
}

export type IResponseList<TData, TField extends string> = {
  [key in TField]: TData[];
} & {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export interface IErrorResponse {
  code: number;
  message: string;
}

export interface IParams {
  limit?: number;
  page?: number;
  search?: string;
}

export interface ISearchResponse<T> {
  totalElements: number;
  totalPages: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    unpaged: boolean;
  };
  size: number;
  content: T;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ISearchMoreRequestType {
  pageNumber: number;
  numberElementInPage: number;
  keyword: string;
  ascending: boolean;
  filters: Array<{
    field: string;
    values: Array<string>;
    operator: string;
  }>;
  sortBy: string;
}
