'use client';

import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Control, Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingFormData } from '@/features/onboarding/schemas';

interface StepPasswordProps {
  control: Control<OnboardingFormData>;
}

const requirements = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  { regex: /[a-z]/, label: 'At least one lowercase letter' },
  { regex: /[0-9]/, label: 'At least one number' },
  { regex: /[^a-zA-Z0-9]/, label: 'At least one special character' },
];

const StepPassword = ({ control }: StepPasswordProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='animate-fade-in mx-auto flex w-full max-w-md flex-col'>
      <p className='text-muted-foreground mb-2 text-sm tracking-wide uppercase'>Security First</p>
      <h2 className='font-display text-foreground mb-6 text-2xl font-semibold'>
        Set a secure password
      </h2>

      <Controller
        control={control}
        name='password'
        render={({ field }) => {
          const value = field.value || '';

          return (
            <div className='flex flex-col gap-4'>
              <div className='relative'>
                <Input
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  autoFocus
                  className='bg-background/80 focus-visible:ring-primary/30 h-14 pr-14 text-lg backdrop-blur-sm transition-all'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-muted-foreground hover:text-foreground absolute top-0 right-0 h-14 w-14 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </Button>
              </div>

              <div className='bg-muted/30 space-y-3 rounded-lg border p-4'>
                <p className='text-muted-foreground text-xs font-medium'>Password must contain:</p>
                <ul className='space-y-2'>
                  {requirements.map((req, index) => {
                    const isValid = req.regex.test(value);
                    return (
                      <li
                        key={index}
                        className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                          isValid ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {isValid ? (
                          <div className='bg-primary/20 text-primary flex h-4 w-4 items-center justify-center rounded-full'>
                            <Check className='h-3 w-3' />
                          </div>
                        ) : (
                          <div className='border-muted-foreground/30 h-4 w-4 rounded-full border' />
                        )}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default StepPassword;
