import { ChevronDown, Copy, Check, Pencil, ExternalLink, BadgeCheck } from 'lucide-react';
import { useState, ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BioSectionProps {
  bio: string;
  onUpdate: (bio: string) => void;
}

export const BioSection = ({ bio, onUpdate }: BioSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(bio);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bio);
    setCopied(true);
    toast.success('Bio copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdate(editValue);
    setIsEditing(false);
    toast.success('Bio updated successfully');
  };

  const handleRevert = () => {
    setEditValue(bio);
    setIsEditing(false);
  };

  return (
    <div className='space-y-4'>
      {isEditing ? (
        <div className='space-y-3'>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className='bg-muted/50 border-border text-foreground focus:ring-primary/50 w-full resize-none rounded-xl border p-4 transition-all focus:ring-2 focus:outline-none'
            rows={5}
            placeholder='Write your bio...'
          />
          <div className='flex gap-2'>
            <Button size='sm' onClick={handleSave} className='bg-primary hover:bg-primary/90'>
              Save
            </Button>
            <Button size='sm' variant='outline' onClick={handleRevert} className='border-border'>
              Revert
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className='text-foreground/90 text-[15px] leading-relaxed'>{bio}</p>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIsEditing(true)}
              className='border-primary/30 text-primary hover:bg-primary/10'
            >
              <Pencil className='mr-2 h-4 w-4' />
              Edit
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={handleCopy}
              className='border-border hover:bg-muted'
            >
              {copied ? (
                <Check className='text-accent mr-2 h-4 w-4' />
              ) : (
                <Copy className='mr-2 h-4 w-4' />
              )}
              Copy
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

interface ExperienceItemProps {
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export const ExperienceItem = ({
  company,
  position,
  startDate,
  endDate,
  description,
}: ExperienceItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      className='border-border/50 hover:bg-muted/30 -mx-4 cursor-pointer border-b px-4 py-4 transition-colors last:border-0'
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1'>
          <h4 className='text-foreground font-medium'>{position}</h4>
          <p className='text-primary text-sm font-medium'>{company}</p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground bg-muted/50 rounded-full px-2 py-1 text-xs whitespace-nowrap'>
            {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
          </span>
          <ChevronDown
            className={cn(
              'text-muted-foreground h-4 w-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </div>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
      </div>
    </div>
  );
};

interface AwardItemProps {
  projectName: string;
  awardShow: string;
  year: number;
  category?: string;
  sourceUrl?: string;
  verified?: boolean;
}

export const AwardItem = ({
  projectName,
  awardShow,
  year,
  category,
  sourceUrl,
  verified,
}: AwardItemProps) => {
  return (
    <div className='border-border/50 border-b py-4 last:border-0'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h4 className='text-foreground truncate font-medium'>{projectName}</h4>
            {verified && <BadgeCheck className='text-accent h-4 w-4 flex-shrink-0' />}
          </div>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {awardShow} {category && <span className='text-primary'>• {category}</span>}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-primary bg-primary/10 rounded-full px-3 py-1 text-sm font-semibold'>
            {year}
          </span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground hover:text-primary transition-colors'
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className='h-4 w-4' />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
