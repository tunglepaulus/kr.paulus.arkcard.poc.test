import { Pencil, Trash2 } from 'lucide-react'; // [UPDATE] Import Trash2

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { JuryExperience } from '@/services/jury-experience.service';

interface JudgingItemProps extends JuryExperience {
  onEdit: () => void;
  onDelete: () => void; // [NEW] New prop
}

export const JudgingItem = ({ id, eventName, years, role, onEdit, onDelete }: JudgingItemProps) => {
  const sortedYears = [...years].sort((a, b) => a - b);
  const MAX_DISPLAY_YEARS = 2;
  const visibleYears = sortedYears.slice(0, MAX_DISPLAY_YEARS);
  const remainingCount = sortedYears.length - MAX_DISPLAY_YEARS;

  return (
    <div className='border-border/50 border-b py-4 last:border-0'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <h4 className='text-foreground font-medium'>{eventName}</h4>
          <p className='text-muted-foreground mt-0.5 text-sm'>{role}</p>
        </div>

        <div className='flex items-center gap-1'>
          {' '}
          {/* [UPDATE] Reduce gap to keep buttons closer together */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='mr-2 flex cursor-pointer items-center gap-2'>
                  {visibleYears.map((year) => (
                    <span
                      key={year}
                      className='text-accent bg-accent/10 rounded-full px-3 py-1 text-xs font-semibold'
                    >
                      {year}
                    </span>
                  ))}
                  {remainingCount > 0 && (
                    <span className='text-accent bg-accent/10 rounded-full px-3 py-1 text-sm font-semibold'>
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
          {/* Edit Button */}
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8 cursor-pointer'
            onClick={onEdit}
          >
            <Pencil className='h-4 w-4' />
          </Button>
          {/* [NEW] Delete Button */}
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 cursor-pointer'
            onClick={onDelete}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};

