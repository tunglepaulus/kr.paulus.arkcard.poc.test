'use client';

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { UserType } from '@/types/user';

// --- MAIN COMPONENT ---
interface UserIDCardProps {
  user: UserType;
}

export const UserIDCard = ({ user }: UserIDCardProps) => {
  const currentJob = useMemo(() => {
    return user?.companies?.find((c) => c.isCurrentCompany);
  }, [user?.companies]);

  const initials = useMemo(() => {
    return user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'US';
  }, [user?.name]);

  // --- EMBOSSED SILVER TEXT STYLE (VISA CHROME STYLE) ---
  const visaTextStyle = {
    backgroundImage:
      'linear-gradient(180deg, #ffffff 0%, #e0e0e0 40%, #707070 50%, #c0c0c0 60%, #ffffff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    filter: 'drop-shadow(1px 2px 1px rgba(0,0,0,0.8))',
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[1.586/1]' // Standard credit card aspect ratio
      )}
      style={{
        background: user.coverPicture
          ? `url(${user.coverPicture}) center/cover`
          : 'linear-gradient(135deg, #0f172a 0%, #000000 100%)',
      }}
    >
      {/* Overlays */}
      <div className='pointer-events-none absolute inset-0 bg-black/10' />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20' />

      {/* Texture noise */}
      <div className='pointer-events-none absolute inset-0 bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-[0.05] mix-blend-overlay' />

      {/* CARD CONTENT */}
      <div className='relative z-10 flex h-full flex-col justify-between p-6 sm:p-7'>
        {/* TOP ROW: Logo */}
        <div className='flex items-start justify-between'>
          <div className='text-left'>
            <h2
              className='font-mono text-xl font-black tracking-wider uppercase italic'
              style={visaTextStyle}
            >
              ARK.CARD
            </h2>
          </div>
        </div>

        {/* BOTTOM ROW: Avatar & Info */}
        <div className='flex items-end gap-5 sm:gap-6'>
          {/* Avatar Area */}
          <div className='h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-[3px] border-white/20 shadow-2xl'>
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-xl font-black text-white'>
                {initials}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className='flex min-w-0 flex-1 flex-col justify-end space-y-2 pb-1'>
            {/* NAME */}
            <p
              className='truncate font-mono text-2xl font-black tracking-[0.1em] uppercase sm:text-3xl'
              style={visaTextStyle}
            >
              {user.name || 'MEMBER'}
            </p>

            {/* JOB TITLE / COMPANY */}
            <div className='flex flex-wrap items-center gap-x-2'>
              <span
                className='font-mono text-xs font-bold tracking-widest uppercase sm:text-sm'
                style={visaTextStyle}
              >
                {currentJob?.jobTitle || 'MEMBER'}
              </span>
              {currentJob?.companyName && (
                <>
                  <span style={visaTextStyle}>/</span>
                  <span
                    className='font-mono text-xs font-bold tracking-widest uppercase sm:text-sm'
                    style={visaTextStyle}
                  >
                    {currentJob.companyName}
                  </span>
                </>
              )}
            </div>

            {/* Email */}
            <p className='truncate font-mono text-[10px] tracking-wide text-white/50'>
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SKELETON ---
export const UserIDCardSkeleton = () => {
  return (
    <div className='bg-secondary/20 shadow-elevated relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl'>
      <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent' />

      <div className='relative z-10 flex h-full flex-col justify-between p-7'>
        {/* Top */}
        <div className='flex justify-between'>
          <div className='h-6 w-24 animate-pulse rounded bg-white/10' />
        </div>

        {/* Bottom */}
        <div className='flex items-end gap-6'>
          <div className='h-[72px] w-[72px] animate-pulse rounded-full border-[3px] border-white/5 bg-white/10' />
          <div className='flex-1 space-y-3 pb-1'>
            {/* Name */}
            <div className='h-8 w-3/4 animate-pulse rounded bg-white/15' />
            {/* Job/Company */}
            <div className='h-4 w-1/2 animate-pulse rounded bg-white/10' />
            {/* Email */}
            <div className='h-3 w-1/3 animate-pulse rounded bg-white/5' />
          </div>
        </div>
      </div>
    </div>
  );
};
