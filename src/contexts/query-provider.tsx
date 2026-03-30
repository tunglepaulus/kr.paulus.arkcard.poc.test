'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren } from 'react';
import { toast } from 'sonner';

import { HTTP_STATUS_CODE } from '@/constants';

function getErrorStatus(error: Error): number | undefined {
  if ('status' in error && typeof (error as Record<string, unknown>).status === 'number') {
    return (error as Record<string, unknown>).status as number;
  }
  return undefined;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      // useQuery randomly stuck in loading, here is the fix
      // https://github.com/TanStack/query/issues/1657, https://github.com/TanStack/query/issues/1657#issuecomment-2099628081,
      // https://github.com/TanStack/query/discussions/1732
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Handle for specific error
      if (query?.meta?.errorMessage) {
        toast.error(String(query?.meta?.errorMessage));
      }
      // Handle for internal server error 500
      else if (getErrorStatus(error) === HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR) {
        toast.error('Something went wrong. Please try again later!');
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (getErrorStatus(error) === HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR) {
        toast.error('Something went wrong. Please try again later!');
      }
    },
  }),
});

export default function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </QueryClientProvider>
  );
}

