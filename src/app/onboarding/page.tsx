'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import arkLogo from '@/assets/ark-logo.png';
import { Interactive3DGraphic } from '@/components/interactive-3d-graphic';
import { Button } from '@/components/ui/button';
import { JuriesPopup } from '@/features/arkid-page/components/juries-popup';
import StepEmail from '@/features/onboarding/components/create-account/step-email';
import StepName from '@/features/onboarding/components/create-account/step-name';
import StepOtp from '@/features/onboarding/components/create-account/step-otp';
import StepPassword from '@/features/onboarding/components/create-account/step-password';
import StepWork from '@/features/onboarding/components/create-account/step-work';
import LoginForm from '@/features/onboarding/components/login/login-form';
import OnboardingWelcome from '@/features/onboarding/components/welcome';
import { OnboardingFormData, onboardingFormSchema } from '@/features/onboarding/schemas';
import { authService, SinUpPayload } from '@/services/auth.service';
import { useUserStore } from '@/stores/use-user-store';

export default function OnboardingPage() {
  const router = useRouter();
  const setHasJuryExperience = useUserStore((state) => state.setHasJuryExperience);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const hasJuryExperience = useUserStore((state) => state.hasJuryExperience);

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showJuriesPopup, setShowJuriesPopup] = useState(false);

  // If user is logged in but hasn't selected juries, show the popup immediately
  const shouldShowJuriesPopup = showJuriesPopup || (isLoggedIn && !hasJuryExperience);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      name: '',
      companies: [
        {
          companyName: '',
          jobTitle: '',
          id: null,
          isCurrentCompany: true,
        },
      ],
      password: '',
    },
  });

  const { control, handleSubmit, trigger, getValues, setValue } = form;

  const { mutate: registerUser, isPending: isRegistering } = useMutation({
    mutationFn: (payload: SinUpPayload) => authService.signup(payload),
    onSuccess: () => {
      const emailFromStep1 = getValues('email');
      toast.success('Registration successful! Please check your email.');
      setRegisteredEmail(emailFromStep1);
      setCurrentStep(5);
    },
    onError: (error: any) => {
      // Supabase returns error directly in error.message
      toast.error(error.message || 'Registration failed. Please try again.');
    },
  });

  const stepFields = [
    { fields: [] },
    { fields: ['email'] as const },
    { fields: ['name'] as const },
    { fields: ['companies'] as const },
    { fields: ['password'] as const },
  ];

  const nextStep = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }
    const currentFields = stepFields[currentStep]?.fields;
    if (currentFields) {
      const isValid = await trigger(currentFields as any);
      if (isValid) setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const onSubmit = (data: OnboardingFormData) => {
    const payload: SinUpPayload = {
      name: data.name,
      email: data.email,
      password: data.password,
      companies: data.companies.map((c) => ({
        companyName: c.companyName,
        jobTitle: c.jobTitle,
        id: c.id ?? null,
        isCurrentCompany: c.isCurrentCompany ?? true,
      })),
    };
    registerUser(payload);
  };

  const onOtpVerified = () => {
    setShowJuriesPopup(true);
  };

  const onJuriesComplete = () => {
    setHasJuryExperience(true);
    router.push('/dashboard');
  };

  return (
    <div className='bg-background relative flex min-h-screen flex-col overflow-hidden'>
      {shouldShowJuriesPopup && (
        <JuriesPopup
          onSuccess={onJuriesComplete}
        />
      )}

      <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
        <div className='h-[60vh] w-full translate-y-[15vh]'>
          <Interactive3DGraphic
            variant={currentStep === 0 ? 'welcome' : 'landing'}
            interactive={currentStep === 0}
          />
        </div>
      </div>

      <div className='relative z-10 flex flex-1 flex-col px-6 pb-8'>
        <div className='animate-fade-in flex flex-1 flex-col items-center justify-center'>
          <div className='mb-6 text-center'>
            <div className='mb-4 flex justify-center'>
              <Image src={arkLogo} alt='logo' height={96} width={96} />
            </div>
            <h1 className='font-display text-foreground text-4xl font-bold tracking-tight'>
              ARK.CARD
            </h1>
            <p
              className='mt-4 text-xs font-medium tracking-[0.2em] uppercase'
              style={{ color: '#E1E1E1', fontSize: '0.7rem' }}
            >
              Take Back Your Story
            </p>
          </div>
          {showLoginForm ? (
            <div className='animate-in fade-in zoom-in-95 mx-auto w-full max-w-md duration-300'>
              <LoginForm
                onBack={() => setShowLoginForm(false)}
                onJuryRequired={() => {
                  setShowLoginForm(false);
                  setShowJuriesPopup(true);
                }}
                onEmailNotConfirmed={async (email) => {
                  // Switch from login form to OTP verification
                  setShowLoginForm(false);
                  setRegisteredEmail(email);
                  setCurrentStep(5);

                  // Automatically resend OTP so the user gets a fresh code
                  try {
                    await authService.resendOtp(email);
                    toast.success('A new verification code has been sent to your email.');
                  } catch {
                    // Non-blocking: StepOtp has its own resend button
                  }
                }}
              />
            </div>
          ) : (
            <>
              {currentStep === 0 && (
                <OnboardingWelcome
                  onNextToCreateAccount={nextStep}
                  onLoginClick={() => setShowLoginForm(true)}
                />
              )}

              {currentStep > 0 && currentStep < 5 && (
                <form onSubmit={handleSubmit(onSubmit)} className='mt-4 w-full max-w-md space-y-6'>
                  {currentStep === 1 && (
                    <StepEmail
                      control={control}
                      trigger={trigger}
                      getValues={getValues}
                      onPrevStep={prevStep}
                      onNextStep={() => setCurrentStep(2)}
                    />
                  )}

                  {currentStep === 2 && <StepName control={control} onNextStep={nextStep} />}

                  {currentStep === 3 && <StepWork control={control} setValue={setValue} />}

                  {currentStep === 4 && <StepPassword control={control} />}

                  {currentStep > 1 && (
                    <div className='mx-auto flex w-full max-w-md justify-between pt-6'>
                      <Button
                        type='button'
                        variant='ghost'
                        onClick={prevStep}
                        className='cursor-pointer'
                        disabled={isRegistering}
                      >
                        Back
                      </Button>

                      {currentStep < 4 ? (
                        <Button
                          type='button'
                          onClick={nextStep}
                          className='ml-auto min-w-[100px] cursor-pointer'
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          type='submit'
                          disabled={isRegistering}
                          className='bg-primary ml-auto min-w-[100px] cursor-pointer text-white'
                        >
                          {isRegistering ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Processing...
                            </>
                          ) : (
                            'Complete'
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </form>
              )}

              {currentStep === 5 && registeredEmail && (
                <StepOtp email={registeredEmail} onVerifySuccess={onOtpVerified} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}






