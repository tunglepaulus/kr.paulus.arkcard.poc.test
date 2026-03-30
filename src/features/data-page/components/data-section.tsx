'use client';

import { ChevronDown, Plus } from 'lucide-react'; // Import icon Plus
import { ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button'; // Import Button
import { cn } from '@/lib/utils';

interface DataSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  count?: number;
  // [NEW PROPS]
  onAdd?: () => void; // Handler function when Add button is clicked
  addLabel?: string; // Label displayed on the button
  showAddButton?: boolean; // Force show/hide from parent (if needed)
}

export const DataSection = ({
  title,
  icon,
  children,
  defaultExpanded = true,
  count,
  onAdd,
  addLabel = 'Add New',
  showAddButton = true, // Default to show if onAdd exists
}: DataSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Determine whether to render the Add button
  const shouldRenderAddButton = onAdd && showAddButton;

  return (
    <div className='bg-card shadow-soft animate-fade-in border-border overflow-hidden rounded-2xl border'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between p-4 transition-colors'
      >
        <div className='flex items-center gap-3'>
          <div className='from-primary/20 to-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br'>
            {icon}
          </div>
          <div className='text-left'>
            <h3 className='text-foreground font-display font-semibold'>{title}</h3>
            {count !== undefined && <p className='text-muted-foreground text-sm'>{count} items</p>}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-5 w-5 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Container Animation */}
      <div
        className={cn(
          'flex flex-col overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {/* 1. Scrollable Content */}
        <div className='custom-scrollbar max-h-[400px] overflow-y-auto px-4 pb-2'>{children}</div>

        {/* 2. Standardized Add Button Area */}
        {shouldRenderAddButton && (
          <div className='bg-card z-10 p-4 pt-2'>
            <Button
              variant='outline'
              className={cn(
                'w-full cursor-pointer border-2 border-dashed',
                'h-11 text-base font-medium',
                'text-muted-foreground border-border',
                'hover:text-primary hover:border-primary hover:bg-primary/5',
                'transition-all duration-200'
              )}
              onClick={(e) => {
                e.stopPropagation(); // Prevent click event from propagating
                onAdd?.();
              }}
            >
              <Plus className='mr-2 h-5 w-5' />
              {addLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
