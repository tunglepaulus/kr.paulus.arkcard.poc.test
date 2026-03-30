'use client';

import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WorkExperience } from '@/services/work-experience.service';

interface WorkExperienceItemProps extends WorkExperience {
  onEdit: () => void;
  onDelete: () => void;
}

export const WorkExperienceItem = ({
  companyName,
  title,
  startDate,
  endDate,
  description,
  onEdit,
  onDelete,
}: WorkExperienceItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className='border-border/50 border-b py-3 last:border-0'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1'>
          <h4 className='text-foreground font-medium'>{title}</h4>
          <p className='text-primary text-sm font-medium'>{companyName}</p>
        </div>

        <div className='flex items-center gap-1'>
          <span className='text-muted-foreground bg-muted/50 mr-2 rounded-full px-2 py-1 text-xs whitespace-nowrap'>
            {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
          </span>
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
          {description && (
            <ChevronDown
              className={cn(
                'text-muted-foreground h-4 w-4 cursor-pointer transition-transform',
                isExpanded && 'rotate-180'
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          )}
        </div>
      </div>

      {description && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
        </div>
      )}
    </div>
  );
};
