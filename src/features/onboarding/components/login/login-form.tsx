'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { authService, LoginPayload, ApiError } from '@/services/auth.service';
import { useUserStore } from '@/stores/use-user-store';
import { UserType } from '@/types/user';

// --- ZOD SCHEMA ---
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onBack?: () => void;
  onEmailNotConfirmed?: (email: string) => void;
  onJuryRequired?: () => void;
}

const LoginForm = ({ onBack, onEmailNotConfirmed, onJuryRequired }: LoginFormProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const loginStore = useUserStore((state) => state.login);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const { mutate: handleLogin, isPending: isLoggingIn } = useMutation({
    mutationFn: (data: LoginFormData) => {
      const payload: LoginPayload = {
        email: data.email,
        password: data.password,
      };
      return authService.login(payload);
    },

    onSuccess: async (response, variables) => {
      const { user, session } = response;

      if (!session || !user) {
        toast.error('Login failed: No session received');
        return;
      }

      // Save tokens immediately so the middleware recognizes the session
      const basicProfile: UserType = {
        id: 0,
        uuid: user.id,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        role: user.role || 'user',
        companies: [],
        hasJuryExperience: false,
      };
      loginStore(
        session.access_token,
        session.refresh_token,
        basicProfile,
        variables.remember,
        false
      );

      // Fetch the full profile from server (includes user_profile.id, companies, has_jury_experience)
      let hasJuries = false;
      try {
        const profileRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const profileJson = await profileRes.json();

        if (profileJson.success && profileJson.data) {
          const profileData = profileJson.data as UserType;
          hasJuries = !!profileData.hasJuryExperience;
          loginStore(
            session.access_token,
            session.refresh_token,
            profileData,
            variables.remember,
            hasJuries
          );
        }
      } catch {
        // Non-blocking: basic profile from auth metadata is already stored
      }

      if (!hasJuries) {
        toast.info('Please select your jury experiences to complete your profile.');
        onJuryRequired?.();
        return;
      }

      toast.success('Welcome back!');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      // If email is not confirmed, redirect to OTP verification
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_CONFIRMED') {
        toast.info('Your email is not verified yet. Please enter the verification code.');
        const email = getValues('email');
        onEmailNotConfirmed?.(email);
        return;
      }
      toast.error(error.message || 'Login failed. Please try again.');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    handleLogin(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='glass-dark border-border/50 shadow-elevated space-y-4 rounded-2xl border p-6'
    >
      {/* EMAIL FIELD */}
      <div className='space-y-2'>
        <label htmlFor='email' className='text-foreground text-sm font-medium'>
          Email
        </label>
        <Input
          id='email'
          type='email'
          placeholder='your@email.com'
          disabled={isLoggingIn}
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

      {/* PASSWORD FIELD */}
      <div className='space-y-2'>
        <label htmlFor='password' className='text-foreground text-sm font-medium'>
          Password
        </label>
        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            placeholder='••••••••'
            disabled={isLoggingIn}
            className={`bg-secondary/50 border-border/50 focus:border-primary h-12 pr-12 ${
              errors.password ? 'border-destructive ring-destructive/20' : ''
            }`}
            {...register('password')}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors'
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
        {errors.password && (
          <p className='text-destructive animate-in slide-in-from-left-1 text-xs'>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* OPTIONS: REMEMBER ME & FORGOT PASSWORD */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Controller
            control={control}
            name='remember'
            render={({ field }) => (
              <Checkbox id='remember' checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <label
            htmlFor='remember'
            className='text-muted-foreground cursor-pointer text-sm select-none'
          >
            Remember me
          </label>
        </div>
        <button
          type='button'
          className='text-primary cursor-pointer text-sm hover:underline'
          onClick={() => router.push('/forgot-password')}
        >
          Forgot password?
        </button>
      </div>

      {/* SUBMIT BUTTON */}
      <Button
        type='submit'
        className='bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full cursor-pointer font-medium'
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Logging in...
          </>
        ) : (
          'Log in'
        )}
      </Button>

      {/* BACK BUTTON */}
      {onBack && (
        <button
          type='button'
          onClick={onBack}
          disabled={isLoggingIn}
          className='text-muted-foreground hover:text-foreground w-full cursor-pointer text-center text-sm transition-colors'
        >
          Back to options
        </button>
      )}
    </form>
  );
};

export default LoginForm;
