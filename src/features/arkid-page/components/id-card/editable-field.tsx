'use client';

import { Check, Pencil, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UserType } from '@/types/user';

interface EditableFieldProps {
  value: string;
  fieldName: string;
  onSave: (newValue: string) => Promise<UserType>; // API call function from parent
  className?: string;
  inputClassName?: string;
  textStyle?: React.CSSProperties;
}

export const EditableField = ({
  value,
  fieldName,
  onSave,
  className,
  inputClassName,
  textStyle,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  // Update editValue when value prop changes (when API refreshes data)
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (!editValue.trim() || editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      // If error, reset to previous value
      setEditValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  if (isEditing) {
    return (
      <div className='animate-in fade-in zoom-in flex items-center gap-2 duration-200'>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className={cn(
            'border-primary-foreground/30 text-primary-foreground h-7 rounded-md bg-white/10 px-2 py-0 text-xs backdrop-blur-sm focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:ring-offset-0',
            inputClassName
          )}
          autoFocus
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <div className='flex shrink-0 items-center gap-0.5'>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-green-500/20 transition-colors hover:bg-green-500/40'
          >
            {isLoading ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin text-white' />
            ) : (
              <Check className='h-3.5 w-3.5 text-green-400' />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-red-500/20 transition-colors hover:bg-red-500/40'
          >
            <X className='h-3.5 w-3.5 text-red-400' />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='group/edit flex items-center gap-1.5'>
      <span className={className} style={textStyle}>
        {value || `Add ${fieldName}`}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className='flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white/0 opacity-0 transition-all duration-200 hover:bg-white/20 group-hover/edit:opacity-100'
        aria-label={`Edit ${fieldName}`}
      >
        <Pencil className='h-3 w-3 text-white/70' />
      </button>
    </div>
  );
};

