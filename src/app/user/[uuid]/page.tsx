'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Link2, Link2Off, Loader2, LogIn, UserRound } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { UserIDCard, UserIDCardSkeleton } from '@/features/user-card/components/user-id-card';
import { connectionService } from '@/services/connection.service';
import { useUserStore } from '@/stores/use-user-store';
import { UserType } from '@/types/user';

async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch');
  }
  return result as T;
}

const UserProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const uuid = params.uuid as string;
  const queryClient = useQueryClient();

  const { user: currentUser, isLoggedIn } = useUserStore();

  // Fetch target user profile
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<{ success: boolean; data: UserType }>({
    queryKey: ['user-profile', uuid],
    queryFn: () => apiFetch(`/api/users/${uuid}`),
    enabled: !!uuid,
  });

  // Check connection status (only when logged in)
  const { data: connectionStatus, isLoading: isCheckingConnection } = useQuery<{
    success: boolean;
    data: { isConnected: boolean; isLoggedIn: boolean };
  }>({
    queryKey: ['connection-status', uuid],
    queryFn: () => apiFetch(`/api/connections/check/${uuid}`),
    enabled: !!uuid && isLoggedIn,
    retry: false,
  });

  // Connect mutation
  const { mutate: connect, isPending: isConnecting } = useMutation({
    mutationFn: () => connectionService.connect(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', uuid] });
      toast.success('Connected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect');
    },
  });

  // Disconnect mutation
  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: () => connectionService.disconnect(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', uuid] });
      toast.success('Connection removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove connection');
    },
  });

  const isOwnProfile = currentUser?.uuid === uuid;
  const isConnected = connectionStatus?.data?.isConnected ?? false;
  const isProcessing = isConnecting || isDisconnecting;

  if (isError) {
    return (
      <div className='bg-background flex min-h-screen flex-col items-center justify-center px-4'>
        <div className='text-center'>
          <div className='bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            <UserRound className='text-destructive h-8 w-8' />
          </div>
          <h1 className='text-foreground text-xl font-semibold'>User not found</h1>
          <p className='text-muted-foreground mt-2 text-sm'>
            This user profile doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className='bg-primary hover:bg-primary/90 text-primary-foreground mt-6 rounded-lg px-4 py-2'
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background flex flex-col items-center px-4'>
      {/* Card */}
      <div className='mt-16 w-full max-w-md'>
        {isLoading || !user?.data ? <UserIDCardSkeleton /> : <UserIDCard user={user.data} />}

        {/* Connect / Disconnect Button — below card, right-aligned */}
        {!isOwnProfile && (
          <div className='mt-3 flex justify-end'>
            {isCheckingConnection ? (
              <Button variant='outline' size='sm' disabled className='cursor-pointer'>
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                Checking...
              </Button>
            ) : !isLoggedIn ? (
              <Button
                variant='outline'
                size='sm'
                className='cursor-pointer'
                onClick={() => router.push('/onboarding')}
              >
                <LogIn className='mr-1.5 h-3.5 w-3.5' />
                Log in to Connect
              </Button>
            ) : isConnected ? (
              <Button
                variant='outline'
                size='sm'
                className='border-destructive/50 text-destructive hover:bg-destructive/10 cursor-pointer'
                disabled={isProcessing}
                onClick={() => disconnect()}
              >
                {isProcessing ? (
                  <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Link2Off className='mr-1.5 h-3.5 w-3.5' />
                )}
                {isProcessing ? 'Removing...' : 'Disconnect'}
              </Button>
            ) : (
              <Button
                variant='default'
                size='sm'
                className='cursor-pointer'
                disabled={isProcessing}
                onClick={() => connect()}
              >
                {isProcessing ? (
                  <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Link2 className='mr-1.5 h-3.5 w-3.5' />
                )}
                {isProcessing ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
