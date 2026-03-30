'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Link2Off, Loader2, Search, UserRound, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { QUERY_KEYS } from '@/constants/query-key';
import { connectionService } from '@/services/connection.service';
import { useUserStore } from '@/stores/use-user-store';
import { UserType } from '@/types/user';

interface UserResult {
  id: number;
  uuid: string;
  name: string;
  email: string;
  profilePicture: string | null;
  hasJuryExperience: boolean;
  companies: Array<{
    id: number;
    companyName: string;
    jobTitle: string;
    isCurrentCompany: boolean;
  }>;
  isConnected: boolean;
}

interface SearchResult {
  users: UserResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// InfiniteData structure used by TanStack Query useInfiniteQuery
interface SearchInfiniteData {
  pages: SearchResult[];
  pageParams: unknown[];
}

async function fetchUsers(pageParam: number, name: string): Promise<SearchResult> {
  const params = new URLSearchParams({ name, page: String(pageParam), limit: '10' });
  const res = await fetch(`/api/users/search?${params}`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Search failed');
  return json.data as SearchResult;
}

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddConnectionDialog({ open, onOpenChange }: AddConnectionDialogProps) {
  const [searchName, setSearchName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  const { user: currentUser, isLoggedIn } = useUserStore();
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchName.trim().length >= 2) {
      debounceRef.current = setTimeout(() => setDebouncedName(searchName.trim()), 400);
    } else {
      setDebouncedName('');
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchName]);

  // Infinite scroll search
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['users-search', debouncedName],
    queryFn: ({ pageParam }) => fetchUsers(pageParam, debouncedName),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: debouncedName.length >= 2,
  });

  // Flatten all pages into one list
  const allUsers = data?.pages.flatMap((p) => p.users) ?? [];

  // Scroll detection for infinite scroll
  const handleScroll = useCallback(() => {
    if (!listRef.current || isFetchingNextPage || !hasNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Connect mutation
  const { mutate: connect, isPending: isConnecting } = useMutation({
    mutationFn: (uuid: string) => connectionService.connect(uuid),
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARD.CONNECTED_USERS() });
      queryClient.setQueryData<SearchInfiniteData>(['users-search', debouncedName], (old) => {
        if (!old || !Array.isArray(old.pages)) return old;
        return {
          ...old,
          pages: old.pages.map((page) => {
            if (!Array.isArray(page.users)) return page;
            return {
              ...page,
              users: page.users.map((u) => (u.uuid === uuid ? { ...u, isConnected: true } : u)),
            };
          }),
        };
      });
      toast.success('Connected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect');
    },
  });

  // Disconnect mutation
  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: (uuid: string) => connectionService.disconnect(uuid),
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARD.CONNECTED_USERS() });
      queryClient.setQueryData<SearchInfiniteData>(['users-search', debouncedName], (old) => {
        if (!old || !Array.isArray(old.pages)) return old;
        return {
          ...old,
          pages: old.pages.map((page) => {
            if (!Array.isArray(page.users)) return page;
            return {
              ...page,
              users: page.users.map((u) => (u.uuid === uuid ? { ...u, isConnected: false } : u)),
            };
          }),
        };
      });
      toast.success('Connection removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove connection');
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSearchName('');
      setDebouncedName('');
      queryClient.resetQueries({ queryKey: ['users-search'] });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const getPrimaryCompany = (companies: UserResult['companies']) =>
    companies?.find((c) => c.isCurrentCompany) || companies?.[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='bg-background max-w-md overflow-hidden rounded-2xl border-none p-0 shadow-2xl'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle className='font-display text-xl font-bold'>Add Connection</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 px-6 pb-6'>
          {/* Name Search Input */}
          <div className='space-y-2'>
            <label className='text-foreground text-sm font-medium'>Search by name</label>
            <div className='relative mt-2'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Type at least 2 characters...'
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className='pr-10 pl-10'
              />
              {searchName && (
                <button
                  type='button'
                  onClick={() => setSearchName('')}
                  className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>
          </div>

          {/* Results list with scroll */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className='max-h-80 space-y-2 overflow-y-auto pr-1'
          >
            {/* Loading initial */}
            {isLoading && (
              <div className='flex justify-center py-6'>
                <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
              </div>
            )}

            {/* No query yet */}
            {!isLoading && !debouncedName && (
              <div className='flex flex-col items-center gap-2 py-8 text-center'>
                <Search className='text-muted-foreground h-8 w-8' />
                <p className='text-muted-foreground text-sm'>Type a name to search</p>
              </div>
            )}

            {/* No results */}
            {!isLoading && debouncedName && allUsers.length === 0 && (
              <div className='flex flex-col items-center gap-2 py-8 text-center'>
                <UserRound className='text-muted-foreground h-8 w-8' />
                <p className='text-muted-foreground text-sm'>
                  No users found for &quot;{debouncedName}&quot;
                </p>
              </div>
            )}

            {/* User list */}
            {allUsers.map((user) => {
              const primaryJob = getPrimaryCompany(user.companies);
              return (
                <div
                  key={user.uuid}
                  className='bg-card border-border overflow-hidden rounded-xl border'
                >
                  <div className='flex items-start gap-3 px-4 py-3'>
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className='h-12 w-12 shrink-0 rounded-full object-cover'
                      />
                    ) : (
                      <div className='bg-primary/20 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold'>
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className='min-w-0 flex-1 space-y-0.5'>
                      <p className='text-sm leading-tight font-semibold'>{user.name}</p>
                      {primaryJob ? (
                        <p className='text-muted-foreground truncate text-xs leading-tight'>
                          {primaryJob.jobTitle} @ {primaryJob.companyName}
                        </p>
                      ) : null}
                      <p className='text-muted-foreground truncate text-xs leading-tight'>
                        {user.email}
                      </p>
                    </div>

                    {/* Per-user action */}
                    <div className='shrink-0'>
                      {!isLoggedIn ? (
                        <Button variant='outline' size='sm' className='cursor-pointer'>
                          <LogInIcon className='mr-1 h-3 w-3' />
                          Login
                        </Button>
                      ) : user.isConnected ? (
                        <Button
                          variant='outline'
                          size='sm'
                          className='border-destructive/50 text-destructive hover:bg-destructive/10 cursor-pointer'
                          disabled={isDisconnecting}
                          onClick={() => disconnect(user.uuid)}
                        >
                          {isDisconnecting ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            <Link2Off className='h-3 w-3' />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size='sm'
                          className='cursor-pointer'
                          disabled={isConnecting}
                          onClick={() => connect(user.uuid)}
                        >
                          {isConnecting ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            <Link2 className='h-3 w-3' />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className='flex justify-center py-3'>
                <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
              </div>
            )}
          </div>

          {/* Results count */}
          {data?.pages[0] && (
            <p className='text-muted-foreground text-xs'>
              {data.pages[0].total > 0
                ? `${data.pages[0].total} user${data.pages[0].total !== 1 ? 's' : ''} found`
                : ''}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline LogIn icon to avoid adding extra imports
function LogInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' />
      <polyline points='10 17 15 12 10 7' />
      <line x1='15' y1='12' x2='3' y2='12' />
    </svg>
  );
}
