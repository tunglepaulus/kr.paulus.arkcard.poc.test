'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useStore } from '@/stores/use-store';
import { useUserStore } from '@/stores/use-user-store';

import { ConnectedIDs } from './conected-ids';
import { IDCard } from './id-card/id-card';
import { QRButton, QRModal, ShareButton } from './qr-modal';

const ArkIDPage = () => {
  const router = useRouter();
  const { setAuthenticated, setOnboardingComplete } = useStore();
  const logout = useUserStore((state) => state.logout);
  const [qrOpen, setQrOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with client-side cleanup even if API fails
    }
    // Clear user-storage cookie (checked by middleware) and Zustand state
    logout();
    setAuthenticated(false);
    setOnboardingComplete(false);
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <div className='bg-background safe-top min-h-screen'>
      <div className='mx-auto max-w-lg px-4 py-6'>
        {/* Header with actions */}
        <header className='mb-6 flex items-center justify-between'>
          <h1 className='text-foreground font-display text-2xl font-bold'>Ark.Card</h1>
          <div className='flex items-center gap-2'>
            <ShareButton />
            <QRButton onClick={() => setQrOpen(true)} />
          </div>
        </header>

        <QRModal open={qrOpen} onOpenChange={setQrOpen} />

        {/* Main Content */}
        <div className='space-y-6'>
          {/* Main ID Card - Golden Ratio */}
          <section>
            <IDCard />
            {/* <Button
              variant='outline'
              size='sm'
              onClick={handleExportWallet}
              className='border-primary/30 text-primary hover:bg-primary/10 mt-3 w-full'
            >
              <Wallet className='mr-2 h-4 w-4' />
              Export to Apple Wallet
            </Button> */}
          </section>

          {/* Connected IDs */}
          <section>
            <ConnectedIDs />
          </section>

          {/* Logout Button */}
          <section className='pt-4'>
            <Button
              variant='ghost'
              onClick={handleLogout}
              className='hover:bg-destructive/10 h-12 w-full cursor-pointer font-medium text-neutral-50'
            >
              <LogOut className='mr-2 h-4 w-4' />
              Log out
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};
export default ArkIDPage;
