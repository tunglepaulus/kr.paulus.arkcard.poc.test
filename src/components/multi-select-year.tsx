'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react'; // Also import X icon for use
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const START_YEAR = 1900;
const END_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) =>
  (END_YEAR - i).toString()
);

interface MultiSelectYearProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  maxDisplay?: number;
}

export const MultiSelectYear = ({
  value,
  onChange,
  hasError,
  maxDisplay = 2,
}: MultiSelectYearProps) => {
  const [open, setOpen] = useState(false);

  // Parse value directly from props
  const selectedYears = useMemo(
    () => (value ? value.split(',').map((y) => y.trim()) : []),
    [value]
  );

  const toggleYear = (year: string) => {
    let newYears;
    if (selectedYears.includes(year)) {
      newYears = selectedYears.filter((y) => y !== year);
    } else {
      newYears = [...selectedYears, year];
    }

    // Sort descending (newest year first) and update immediately
    newYears.sort((a, b) => Number(b) - Number(a));
    onChange(newYears.join(', '));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-full cursor-pointer justify-between px-3 text-left font-normal transition-colors',
            !value && 'text-muted-foreground',
            hasError &&
              'border-destructive/80 text-destructive placeholder:text-destructive/60 focus-visible:ring-destructive/30'
          )}
        >
          <div className='flex items-center gap-2 overflow-hidden'>
            {selectedYears.length > 0 ? (
              <div className='flex gap-1 overflow-hidden'>
                {selectedYears.slice(0, maxDisplay).map((year) => (
                  <Badge
                    key={year}
                    variant='secondary'
                    className={cn(
                      'rounded-sm px-1 text-[10px] font-normal',
                      hasError && 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    )}
                  >
                    {year}
                  </Badge>
                ))}
                {selectedYears.length > maxDisplay && (
                  <Badge
                    variant='secondary'
                    className={cn(
                      'rounded-sm px-1 text-[10px] font-normal',
                      hasError && 'bg-destructive/10 text-destructive'
                    )}
                  >
                    +{selectedYears.length - maxDisplay}
                  </Badge>
                )}
              </div>
            ) : (
              <span>Select Year(s)</span>
            )}
          </div>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search year...' />

          {/* [FIX SCROLL] Move max-h and overflow to CommandList */}
          <CommandList className='custom-scrollbar max-h-[200px] overflow-y-auto'>
            <CommandEmpty>No year found.</CommandEmpty>
            <CommandGroup>
              {YEAR_OPTIONS.map((year) => (
                <CommandItem
                  key={year}
                  onSelect={() => toggleYear(year)}
                  className='cursor-pointer'
                >
                  <div
                    className={cn(
                      'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                      selectedYears.includes(year)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className={cn('h-3 w-3')} />
                  </div>
                  <span>{year}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          {/* [UPDATE] Compact Close button aligned to the right */}
          <div className='border-border flex justify-end border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='hover:bg-muted h-7 cursor-pointer px-3 text-xs font-medium'
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};





