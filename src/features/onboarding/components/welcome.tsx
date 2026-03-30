import { useState } from 'react';

import LoginForm from '@/features/onboarding/components/login/login-form';
import LoginMagicLinkForm from '@/features/onboarding/components/login-magic-link/login-magic-link-form';

type WelcomeView = 'buttons' | 'login' | 'magic-link';

interface OnboardingWelcomeProps {
  onNextToCreateAccount: () => void;
  onLoginClick: () => void;
}

const OnboardingWelcome = ({ onNextToCreateAccount, onLoginClick }: OnboardingWelcomeProps) => {
  const [view, setView] = useState<WelcomeView>('buttons');

  if (view === 'login') {
    return (
      <div className='mt-4 w-full max-w-sm'>
        <LoginForm onBack={() => setView('buttons')} />
      </div>
    );
  }

  if (view === 'magic-link') {
    return (
      <div className='mt-4 w-full max-w-sm'>
        <LoginMagicLinkForm onBack={() => setView('buttons')} />
      </div>
    );
  }

  return (
    <div className='mt-4 w-full max-w-sm'>
      <div className='space-y-3'>
        <button
          onClick={onLoginClick}
          className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow flex h-14 w-full cursor-pointer items-center justify-center rounded-lg text-lg font-medium shadow-[0_0_20px_rgba(120,67,249,0.3)] transition-all hover:shadow-[0_0_30px_rgba(120,67,249,0.4)] active:scale-[0.98]'
        >
          Log in
        </button>
        <button
          onClick={() => setView('magic-link')}
          className='bg-secondary/30 border-border/50 text-foreground hover:bg-secondary/50 flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border font-medium transition-all active:scale-[0.98]'
        >
          Sign in via Company email
        </button>
        <button
          onClick={onNextToCreateAccount}
          className='text-muted-foreground hover:text-foreground flex h-12 w-full cursor-pointer items-center justify-center font-medium transition-colors'
        >
          Create new account
        </button>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
