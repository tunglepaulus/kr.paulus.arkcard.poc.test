'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { QUERY_KEYS } from '@/constants/query-key';
import { AddConnectionDialog } from '@/features/arkid-page/components/add-connection-dialog';
import { ConnectionDetailDialog } from '@/features/arkid-page/components/connection-detail-dialog';
import { cn } from '@/lib/utils';
import { cardService, ConnectedUsersResponse } from '@/services/card.service';

const cardBackgrounds: Record<string, string> = {
  navy: 'https://images.unsplash.com/photo-1536566482680-fca31930a0bd?q=80&w=600&auto=format&fit=crop',
  teal: 'https://images.unsplash.com/photo-1542834255-d64a416a838a?q=80&w=600&auto=format&fit=crop',
  coral:
    'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=600&auto=format&fit=crop',
  gold: 'https://images.unsplash.com/photo-1634155635936-475f66678898?q=80&w=600&auto=format&fit=crop',
  camel:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
};

const CARD_HEIGHT = 112;
const CARD_OFFSET = 55;

interface MiniCardProps {
  connection: ConnectedUsersResponse;
  index: number;
  onClick: () => void;
}

const MiniCard = ({ connection, index, onClick }: MiniCardProps) => {
  const initials = connection.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const backgroundUrl = cardBackgrounds[connection.color] || cardBackgrounds.camel;

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute right-0 left-0 h-28 w-full cursor-pointer overflow-hidden rounded-xl text-left',
        'shadow-lg transition-all duration-300 ease-out',
        'hover:z-50 hover:-translate-y-4 hover:shadow-xl',
        'border-t border-l border-white/10 border-r-black/30 border-b-black/30',
        'bg-secondary/80'
      )}
      style={{
        top: `${index * CARD_OFFSET}px`,
        zIndex: index,
      }}
    >
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105'
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className='absolute inset-0 bg-black/60 backdrop-blur-[1px]' />
      <div className='relative z-10 flex h-full items-start gap-3 p-4'>
        <div className='relative shrink-0'>
          <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 text-sm font-bold text-white backdrop-blur-md'>
            {connection.avatar ? (
              <img
                src={connection.avatar}
                alt={connection.name}
                className='h-full w-full object-cover'
              />
            ) : (
              initials
            )}
          </div>
          {/* {connection.verified && (
            <div className='text-primary absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-black/50 bg-white'>
              <CheckCircle className='h-2.5 w-2.5' />
            </div>
          )} */}
        </div>
        <div className='flex h-full min-w-0 flex-1 flex-col justify-between py-0.5'>
          <div>
            <h3 className='font-display truncate text-sm font-bold text-white drop-shadow-md'>
              {connection.name}
            </h3>
            <p className='truncate text-xs font-medium text-white/80'>{connection.jobTitle}</p>
          </div>
          <div className='mt-auto flex items-center justify-between border-t border-white/10 pt-2'>
            <p className='truncate text-[10px] font-semibold tracking-wider text-white/60 uppercase'>
              {connection.companyName}
            </p>
            {connection.email && (
              <p className='truncate text-[10px] text-white/40'>{connection.email}</p>
            )}
            <span className='font-display text-[8px] text-white/30'>ARK.CARD</span>
          </div>
        </div>
      </div>
    </button>
  );
};

const FixedAddCard = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'h-20 w-full cursor-pointer rounded-xl p-4',
      'border-muted-foreground/20 bg-secondary/10 border-2 border-dashed backdrop-blur-md',
      'text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-secondary/20',
      'flex flex-col items-center justify-center gap-1 transition-all duration-300'
    )}
  >
    <div className='bg-background/20 rounded-full p-1.5 shadow-sm ring-1 ring-white/10'>
      <Plus className='h-4 w-4 text-white/70' />
    </div>
    <span className='text-[10px] font-medium tracking-wide text-white/50 uppercase'>
      Add Connection
    </span>
  </button>
);

export const ConnectedIDs = () => {
  const [selectedConnection, setSelectedConnection] = useState<ConnectedUsersResponse | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: QUERY_KEYS.CARD.CONNECTED_USERS(),
    queryFn: async ({ pageParam = 0 }) => {
      const res = await cardService.getConnectedUsers({
        page: pageParam,
        size: 3,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      return res;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined;
      }
      return lastPage.number + 1;
    },
  });

  const realConnections = useMemo(() => {
    return data?.pages.flatMap((page) => page.content) || [];
  }, [data]);

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  };

  const totalItems = realConnections.length;
  const contentHeight = (totalItems - 1) * CARD_OFFSET + CARD_HEIGHT;

  const getModalBackground = (color: string) => {
    return cardBackgrounds[color] || cardBackgrounds.camel;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;

    if (scrollHeight - scrollTop <= clientHeight + 20) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  useEffect(() => {
    if (containerRef.current && hasNextPage && !isFetchingNextPage) {
      const containerHeight = containerRef.current.clientHeight;
      if (contentHeight < containerHeight) {
        fetchNextPage();
      }
    }
  }, [contentHeight, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return (
      <div className='flex justify-center p-10'>
        <Loader2 className='text-muted-foreground animate-spin' />
      </div>
    );
  }

  return (
    <div className='animate-fade-in mx-auto flex h-[400px] max-w-md flex-col'>
      <div className='mb-4 flex shrink-0 items-center justify-between px-1'>
        <h3 className='text-foreground font-display text-lg font-semibold'>Connected IDs</h3>
        <span className='text-muted-foreground bg-secondary border-border rounded-full border px-2.5 py-1 text-xs font-medium'>
          {realConnections.length} saved
        </span>
      </div>

      {realConnections.length === 0 ? (
        <div className='border-muted-foreground/20 bg-secondary/5 flex-1 rounded-2xl border border-dashed py-10 text-center'>
          <div className='bg-secondary/50 ring-border mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-1'>
            <Plus className='text-muted-foreground h-6 w-6' />
          </div>
          <p className='text-foreground mb-1 font-medium'>No connections yet</p>
          <p className='text-muted-foreground mb-4 px-6 text-xs leading-relaxed'>
            Scan QR code or use a link to save your friends' and partners' Ark.IDs here.
          </p>
          <Button
            size='sm'
            onClick={handleOpenAddDialog}
            className='shadow-primary/20 cursor-pointer shadow-lg'
          >
            Add First Connection
          </Button>
        </div>
      ) : (
        <div className='border-border/40 bg-secondary/5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'>
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className='hover:[&::-webkit-scrollbar-thumb]:bg-border/50 relative w-full flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent'
          >
            <div
              className='relative w-full transition-[height] duration-500 ease-in-out'
              style={{ height: `${contentHeight}px` }}
            >
              {realConnections.map((connection, index) => (
                <MiniCard
                  key={connection.id}
                  connection={connection}
                  index={index}
                  onClick={() => setSelectedConnection(connection)}
                />
              ))}

              {isFetchingNextPage && (
                <div
                  className='absolute right-0 left-0 flex h-10 items-center justify-center'
                  style={{
                    top: `${(totalItems - 1) * CARD_OFFSET + CARD_HEIGHT + 20}px`,
                    zIndex: 0,
                  }}
                >
                  <div className='text-muted-foreground bg-background/80 border-border/50 flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm backdrop-blur-sm'>
                    <Loader2 className='h-3 w-3 animate-spin' />
                    Loading...
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='bg-background/50 border-border/10 z-20 shrink-0 border-t p-3 backdrop-blur-sm'>
            <FixedAddCard onClick={handleOpenAddDialog} />
          </div>
        </div>
      )}

      {/* Connection Detail Dialog */}
      <ConnectionDetailDialog
        connection={selectedConnection}
        onOpenChange={(open) => !open && setSelectedConnection(null)}
      />

      {/* Add Connection Dialog */}
      <AddConnectionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};
