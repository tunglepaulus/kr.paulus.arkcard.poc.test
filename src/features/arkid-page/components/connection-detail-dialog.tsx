'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2Off, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QUERY_KEYS } from '@/constants/query-key';
import { ConnectedUsersResponse } from '@/services/card.service';
import { connectionService } from '@/services/connection.service';

const cardBackgrounds: Record<string, string> = {
  navy: 'https://images.unsplash.com/photo-1536566482680-fca31930a0bd?q=80&w=600&auto=format&fit=crop',
  teal: 'https://images.unsplash.com/photo-1542834255-d64a416a838a?q=80&w=600&auto=format&fit=crop',
  coral:
    'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=600&auto=format&fit=crop',
  gold: 'https://images.unsplash.com/photo-1634155635936-475f66678898?q=80&w=600&auto=format&fit=crop',
  camel:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
};

interface ConnectionDetailDialogProps {
  connection: ConnectedUsersResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionDetailDialog({ connection, onOpenChange }: ConnectionDetailDialogProps) {
  const queryClient = useQueryClient();

  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: () => connectionService.disconnect(connection!.userUuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CARD.CONNECTED_USERS() });
      toast.success('Connection removed');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove connection');
    },
  });

  const getModalBackground = (color: string) => cardBackgrounds[color] || cardBackgrounds.camel;

  return (
    <Dialog open={!!connection} onOpenChange={onOpenChange}>
      <DialogContent className='bg-background max-w-sm overflow-hidden rounded-2xl border-none p-0 shadow-2xl'>
        <DialogHeader>
          <DialogTitle className='sr-only'>Connection Detail</DialogTitle>
        </DialogHeader>
        {connection && (
          <div className='relative'>
            <div className='relative h-28 w-full overflow-hidden'>
              <div
                className='absolute inset-0 bg-cover bg-center'
                style={{
                  backgroundImage: `url(${getModalBackground(connection.color)})`,
                }}
              />
              <div className='absolute inset-0 bg-black/50' />
            </div>

            <div className='relative z-10 -mt-12 px-6 pb-6'>
              <div className='mb-4 flex items-end justify-between'>
                <div className='relative'>
                  <div className='border-background bg-background h-24 w-24 overflow-hidden rounded-full border-4 p-0.5 shadow-xl'>
                    {connection.avatar ? (
                      <img
                        src={connection.avatar}
                        alt={connection.name}
                        className='h-full w-full rounded-full object-cover'
                      />
                    ) : (
                      <div className='bg-muted flex h-full w-full items-center justify-center rounded-full text-3xl font-bold'>
                        {connection.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className='mb-6 space-y-1'>
                <h2 className='font-display text-foreground text-2xl font-bold'>
                  {connection.name}
                </h2>
                <p className='text-foreground/80 text-base font-medium'>{connection.jobTitle}</p>
                <p className='text-muted-foreground flex items-center gap-1 text-sm'>
                  @ {connection.companyName}
                </p>
                {connection.email && (
                  <p className='text-muted-foreground text-xs'>{connection.email}</p>
                )}
              </div>

              <div className='grid gap-3'>
                <Button
                  variant='outline'
                  className='border-destructive/50 text-destructive hover:bg-destructive/10 w-full cursor-pointer'
                  disabled={isDisconnecting}
                  onClick={() => disconnect()}
                >
                  {isDisconnecting ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Link2Off className='mr-2 h-4 w-4' />
                  )}
                  {isDisconnecting ? 'Removing...' : 'Disconnect'}
                </Button>
                <Button
                  variant='ghost'
                  className='w-full cursor-pointer'
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
