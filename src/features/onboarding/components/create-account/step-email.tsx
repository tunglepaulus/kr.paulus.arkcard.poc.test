'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight } from 'lucide-react';
import { Control, Controller, UseFormGetValues, UseFormTrigger } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';

import { OnboardingFormData } from '../../schemas';

interface StepEmailProps {
  control: Control<OnboardingFormData>;
  trigger: UseFormTrigger<OnboardingFormData>; // Type safe
  getValues: UseFormGetValues<OnboardingFormData>; // Type safe
  onNextStep: () => void;
  onPrevStep: () => void;
}

const StepEmail = ({ control, trigger, getValues, onNextStep, onPrevStep }: StepEmailProps) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (email: string) => authService.verifyEmail(email),
    onSuccess: (res) => {
      console.log({ res });
      toast.success('Email verified successfully');
      onNextStep();
    },
    onError: (err: any) => {
      console.log({ err });
      toast.error(err.message || 'Verification failed');
    },
  });

  const handleSubmission = async () => {
    if (isPending) return;

    const isValid = await trigger('email');
    if (!isValid) {
      return;
    }

    const email = getValues('email');
    mutate(email);
  };

  return (
    <div className='animate-fade-in mx-auto flex w-full max-w-md flex-col'>
      <p className='text-muted-foreground mb-2 text-sm tracking-wide uppercase'>
        Please tell me about yourself
      </p>
      <h2 className='font-display text-foreground mb-6 text-2xl font-semibold'>Your Email?</h2>

      <Controller
        control={control}
        name='email'
        render={({ field, fieldState: { error } }) => (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <Input
                {...field}
                autoFocus
                placeholder='example@ark.works'
                disabled={isPending}
                className={`bg-background/80 h-14 flex-1 text-lg backdrop-blur-sm transition-all ${
                  error
                    ? 'border-destructive ring-destructive/20 focus-visible:ring-destructive/30'
                    : 'focus-visible:ring-primary/30'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmission();
                  }
                }}
              />
            </div>

            {error && (
              <p className='text-destructive animate-in slide-in-from-top-1 fade-in ml-1 text-xs font-medium duration-200'>
                {error.message}
              </p>
            )}

            <div className='mt-6 flex justify-between'>
              <Button
                size='lg'
                type='button'
                variant='ghost'
                className='cursor-pointer'
                disabled={isPending}
                onClick={onPrevStep}
              >
                Back
              </Button>

              <Button
                size='lg'
                type='button'
                disabled={isPending}
                onClick={handleSubmission}
                className='shadow-primary/10 hover:shadow-primary/20 min-w-[140px] cursor-pointer shadow-lg transition-all'
              >
                {isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default StepEmail;
