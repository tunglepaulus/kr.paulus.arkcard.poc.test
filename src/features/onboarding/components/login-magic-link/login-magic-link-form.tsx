'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

interface LoginMagicLinkFormProps {
  onBack: () => void;
}

const LoginMagicLinkForm = ({ onBack }: LoginMagicLinkFormProps) => {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const { mutate: sendMagicLink, isPending: isSending } = useMutation({
    mutationFn: (email: string) => authService.loginWithMagicLink(email),
    onSuccess: (_, email) => {
      setSentEmail(email);
      setEmailSent(true);
      toast.success('Magic link sent! Check your email.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send magic link. Please try again.');
    },
  });

  const onSubmit = (data: MagicLinkFormData) => {
    sendMagicLink(data.email);
  };

  return (
    <div className='glass-dark border-border/50 shadow-elevated animate-in fade-in zoom-in-95 mx-auto w-full max-w-sm rounded-2xl border p-6'>
      {!emailSent ? (
        <>
          <div className='mb-4 flex items-center gap-3'>
            <button
              type='button'
              onClick={onBack}
              className='text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
            >
              <ArrowLeft className='h-5 w-5' />
            </button>
            <h2 className='text-foreground text-lg font-semibold'>Sign in via Email</h2>
          </div>

          <p className='text-muted-foreground mb-6 text-sm'>
            Enter your email and we&apos;ll send you a magic link to sign in — no password needed.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-foreground text-sm font-medium'>
                Email address
              </label>
              <Input
                id='email'
                type='email'
                placeholder='you@company.com'
                disabled={isSending}
                className={`bg-secondary/50 border-border/50 focus:border-primary h-12 ${
                  errors.email ? 'border-destructive ring-destructive/20' : ''
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className='text-destructive animate-in slide-in-from-left-1 text-xs'>
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full cursor-pointer font-medium'
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending link...
                </>
              ) : (
                <>
                  <Mail className='mr-2 h-4 w-4' />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className='mb-4 flex items-center gap-3'>
            <button
              type='button'
              onClick={onBack}
              className='text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
            >
              <ArrowLeft className='h-5 w-5' />
            </button>
            <h2 className='text-foreground text-lg font-semibold'>Check your email</h2>
          </div>

          <div className='flex justify-center'>
            <div className='bg-primary/10 rounded-full p-4'>
              <Mail className='text-primary h-8 w-8' />
            </div>
          </div>

          <p className='text-muted-foreground mt-4 text-center text-sm'>
            We sent a magic link to <span className='text-foreground font-medium'>{sentEmail}</span>
          </p>
          <p className='text-muted-foreground mt-2 text-center text-xs'>
            Click the link in your email to sign in. The link expires in 60 minutes.
          </p>

          <Button
            type='button'
            variant='outline'
            className='mt-6 w-full cursor-pointer'
            onClick={() => {
              setEmailSent(false);
              setSentEmail('');
            }}
          >
            Use a different email
          </Button>
        </>
      )}
    </div>
  );
};

export default LoginMagicLinkForm;
