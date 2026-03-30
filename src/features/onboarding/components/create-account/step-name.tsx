'use client';

import { Control, Controller } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { OnboardingFormData } from '@/features/onboarding/schemas';

interface StepNameProps {
  control: Control<OnboardingFormData>;
  onNextStep: () => void;
}

const StepName = ({ control, onNextStep }: StepNameProps) => {
  return (
    <div className='animate-fade-in mx-auto flex w-full max-w-md flex-col'>
      <p className='text-muted-foreground mb-2 text-sm tracking-wide uppercase'>About you</p>
      <h2 className='font-display text-foreground mb-6 text-2xl font-semibold'>
        What should we call you?
      </h2>

      <Controller
        control={control}
        name='name'
        render={({ field, fieldState: { error } }) => (
          <div className='flex flex-col gap-4'>
            <Input
              {...field}
              placeholder='Your full name'
              autoFocus
              className={`bg-background/80 focus-visible:ring-primary/30 h-14 text-lg backdrop-blur-sm transition-all ${
                error ? 'border-destructive ring-destructive/20' : ''
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onNextStep();
                }
              }}
            />
            {error && (
              <p className='text-destructive animate-in slide-in-from-left-1 text-sm font-medium'>
                {error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default StepName;
