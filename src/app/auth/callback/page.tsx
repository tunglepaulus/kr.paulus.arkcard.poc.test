'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/use-user-store';
import { UserType } from '@/types/user';

const AuthCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  const login = useUserStore((state) => state.login);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Exchange token_hash from URL for a session
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!tokenHash || type !== 'magiclink') {
        setStatus('error');
        return;
      }

      const { data: sessionData, error } = await supabase.auth.getSession();

      if (error || !sessionData?.session) {
        setStatus('error');
        return;
      }

      const session = sessionData.session;
      const user = session?.user;

      // Build basic profile from auth user
      const basicProfile: UserType = {
        id: 0,
        uuid: user.id,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        role: user.role || 'user',
        companies: user.user_metadata?.companies || [],
        hasJuryExperience: false,
      };

      // Save session to store (hasJuryExperience = false until profile is fetched)
      login(session.access_token, session.refresh_token, basicProfile, true, false);

      // Fetch full profile from server (includes has_jury_experience from DB)
      try {
        const profileRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const profileJson = await profileRes.json();

        if (profileJson.success && profileJson.data) {
          const profileData = profileJson.data as UserType;
          const hasJuries = !!profileData.hasJuryExperience;
          login(session.access_token, session.refresh_token, profileData, true, hasJuries);

          // Redirect based on jury experience
          if (hasJuries) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        } else {
          router.push('/onboarding');
        }
      } catch {
        router.push('/onboarding');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'error') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-foreground text-xl font-semibold'>Authentication failed</h1>
          <p className='text-muted-foreground mt-2'>
            The magic link may have expired or is invalid.
          </p>
          <button
            onClick={() => router.push('/')}
            className='bg-primary hover:bg-primary/90 text-primary-foreground mt-4 rounded-lg px-4 py-2'
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='text-primary mx-auto h-8 w-8 animate-spin' />
        <p className='text-muted-foreground mt-3'>Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
