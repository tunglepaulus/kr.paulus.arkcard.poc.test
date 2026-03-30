'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AwardRecord } from '@/services/award-record.service';

interface AwardRecordItemProps extends AwardRecord {
  onEdit: () => void;
  onDelete: () => void;
}

export const AwardRecordItem = ({
  organization,
  years,
  awardType,
  category,
  onEdit,
  onDelete,
}: AwardRecordItemProps) => {
  const sortedYears = [...years].sort((a, b) => a - b);
  const MAX_DISPLAY_YEARS = 2;
  const visibleYears = sortedYears.slice(0, MAX_DISPLAY_YEARS);
  const remainingCount = sortedYears.length - MAX_DISPLAY_YEARS;

  return (
    <div className='border-border/50 border-b py-4 last:border-0'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h4 className='text-foreground truncate font-medium'>{organization}</h4>
          </div>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {awardType}
            {category && <span className='text-primary'> • {category}</span>}
          </p>
        </div>

        <div className='flex items-center gap-1'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='mr-2 flex cursor-pointer items-center gap-2'>
                  {visibleYears.map((year) => (
                    <span
                      key={year}
                      className='text-primary bg-primary/10 rounded-full px-3 py-1 text-sm font-semibold'
                    >
                      {year}
                    </span>
                  ))}
                  {remainingCount > 0 && (
                    <span className='text-primary bg-primary/10 rounded-full px-3 py-1 text-sm font-semibold'>
                      +{remainingCount}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sortedYears.join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};
