'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authService, VerifyEmailPayload } from '@/services/auth.service';
import { useUserStore } from '@/stores/use-user-store';
import { UserType } from '@/types/user';

interface StepOtpProps {
  email: string;
  onVerifySuccess: () => void;
}

const RESEND_DELAY_SECONDS = 30;
const OTP_LENGTH = 8;

const StepOtp = ({ email, onVerifySuccess }: StepOtpProps) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(RESEND_DELAY_SECONDS);

  const login = useUserStore((state) => state.login);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation({
    mutationFn: (payload: VerifyEmailPayload) => authService.verifyOtp(payload),
    onSuccess: (data) => {
      // Supabase returns data containing { user, session }
      if (!data?.session || !data?.user) {
        toast.error('Authentication failed. No session found.');
        return;
      }

      // Map Supabase Auth data to UserType
      const userProfile: UserType = {
        id: 0, // Auto-increment id in user_profile (can be fetched later if needed)
        uuid: data.user.id, // Supabase user ID (UUID)
        name: data.user.user_metadata?.name || '', // Get name from metadata set during signup
        email: data.user.email || email,
        role: 'user', // Default role
        companies: [],
        hasJuryExperience: false, // Default false on signup; updated after login via profile API
      };

      // Save access_token & refresh_token to Store
      login(data.session.access_token, data.session.refresh_token, userProfile);

      toast.success('Account verified successfully!');
      onVerifySuccess();
    },
    onError: (err: any) => {
      // Supabase throws error directly into err.message
      toast.error(err.message || 'Verification failed. Please check your code.');
    },
  });

  const { mutate: resendOtp, isPending: isResending } = useMutation({
    mutationFn: (emailToResend: string) => authService.resendOtp(emailToResend),
    onSuccess: () => {
      toast.success('Verification code resent! Please check your email.');
      setCountdown(RESEND_DELAY_SECONDS);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to resend code. Please try again later.');
    },
  });

  const handleVerify = (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length < OTP_LENGTH) {
      toast.error(`Please enter a valid ${OTP_LENGTH}-digit code`);
      return;
    }
    verifyOtp({ email, verificationCode: code });
  };

  const handleResend = () => {
    if (countdown > 0) return;
    resendOtp(email);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className='animate-fade-in mx-auto flex w-full max-w-md flex-col'>
      <p className='text-muted-foreground mb-2 text-sm tracking-wide uppercase'>Verification</p>
      <h2 className='font-display text-foreground mb-2 text-2xl font-semibold'>Check your email</h2>
      <p className='text-muted-foreground mb-8 text-sm'>
        We sent a verification code to <span className='text-foreground font-medium'>{email}</span>.
        Enter it below to verify your account.
      </p>

      <div className='flex flex-col items-center gap-6'>
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={isVerifying || isResending}
          onComplete={(value) => handleVerify(value)}
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_LENGTH }, (_, index) => (
              <InputOTPSlot key={index} index={index} className='h-12 w-12 text-lg' />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <div className='flex w-full flex-col gap-2'>
          <Button
            size='lg'
            onClick={() => handleVerify()}
            disabled={isVerifying || otp.length < OTP_LENGTH}
            className='w-full cursor-pointer'
          >
            {isVerifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Verifying...
              </>
            ) : (
              <>
                Verify Account <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>

          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleResend}
            disabled={countdown > 0 || isResending || isVerifying}
            className={`w-full text-xs ${countdown > 0 ? 'text-muted-foreground' : 'text-primary'}`}
          >
            {isResending ? (
              <Loader2 className='mr-2 h-3 w-3 animate-spin' />
            ) : (
              <RefreshCw className={`mr-2 h-3 w-3 ${countdown > 0 ? '' : 'text-primary'}`} />
            )}
            {countdown > 0
              ? `Resend code in ${formatTime(countdown)}`
              : "Didn't receive code? Resend"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StepOtp;




