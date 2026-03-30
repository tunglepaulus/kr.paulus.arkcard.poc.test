'use client';

import Image from 'next/image';

import arkLogo from '@/assets/ark-logo.png';
import { useAppRouter } from '@/hooks/use-app-router';

const HomePage = () => {
  const router = useAppRouter();

  // Always redirect to onboarding - landing is minimal
  const handleEnter = () => {
    router.push('/onboarding');
  };
  return (
    <div
      className='bg-background relative flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-hidden'
      onClick={handleEnter}
    >
      {/* Minimal gradient background */}
      <div className='bg-gradient-radial from-secondary/20 absolute inset-0 via-transparent to-transparent opacity-50' />

      {/* Content */}
      <div className='animate-fade-in relative z-10 text-center'>
        {/* Logo */}
        <div className='mb-4 flex justify-center'>
          <Image src={arkLogo} alt='logo' height={96} width={96} />
        </div>

        {/* Brand Name - matching logo width */}
        <h1 className='font-display text-foreground text-4xl font-bold tracking-tight md:text-3xl'>
          ARK.CARD
        </h1>

        {/* Tap hint */}
        <p className='text-muted-foreground/150 mt-8 animate-pulse text-xs'>
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
};
export default HomePage;
