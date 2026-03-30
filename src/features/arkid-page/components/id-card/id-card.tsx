'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { API_ROUTES, ENUM_FILE_TYPE, ENUM_PRESIGNED_UPLOAD_TYPE } from '@/constants';
import { QUERY_KEYS } from '@/constants/query-key';
import { useSupabaseUpload } from '@/hooks/use-supabase-upload';
import { cn } from '@/lib/utils';
import { accountService } from '@/services/account.service';

import { EditableField } from './editable-field';

// --- MAIN COMPONENT ---
export const IDCard = () => {
  const queryClient = useQueryClient();

  const [isChangeProfilePicture, setIsChangeProfilePicture] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Profile
  const { data: userInformation, isLoading } = useQuery({
    queryKey: QUERY_KEYS.ACCOUNT.PROFILE(),
    queryFn: () => accountService.getProfile(),
  });

  // [MUTATION] Update Name
  const { mutateAsync: updateName } = useMutation({
    mutationFn: (name: string) => accountService.updateName(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNT.PROFILE() });
      toast.success('Name updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update name');
    },
  });

  // [MUTATION] Update Job Title
  const { mutateAsync: updateJobTitle } = useMutation({
    mutationFn: (jobTitle: string) => accountService.updateJobTitle(jobTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNT.PROFILE() });
      toast.success('Job title updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update job title');
    },
  });

  // [MUTATION] Update Company Name
  const { mutateAsync: updateCompanyName } = useMutation({
    mutationFn: (companyName: string) => accountService.updateCompanyName(companyName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNT.PROFILE() });
      toast.success('Company updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update company');
    },
  });

  // [MUTATION] Finalize Picture Update — saves the uploaded URL to DB
  const { mutate: updatePicture, isPending: isUpdatingPicture } = useMutation({
    mutationFn: ({
      uploadType,
      pictureUrl,
    }: {
      uploadType: ENUM_PRESIGNED_UPLOAD_TYPE;
      pictureUrl: string;
    }) => accountService.updatePicture({ uploadType, pictureUrl }),
    onSuccess: () => {
      toast.success('Profile picture updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNT.PROFILE() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update picture');
    },
  });

  // [MUTATION] Supabase Storage Upload — uploads file directly, then saves URL to DB
  const { upload: uploadToSupabase, isLoading: isUploadingFile } = useSupabaseUpload({
    onSuccess: (url) => {
      updatePicture({
        uploadType: isChangeProfilePicture
          ? ENUM_PRESIGNED_UPLOAD_TYPE.PROFILE_PICTURE
          : ENUM_PRESIGNED_UPLOAD_TYPE.COVER_PICTURE,
        pictureUrl: url,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });

  const isImageLoading = isUploadingFile || isUpdatingPicture;

  const currentJob = useMemo(() => {
    return userInformation?.companies?.find((c) => c.isCurrentCompany);
  }, [userInformation?.companies]);

  const initials = useMemo(() => {
    return userInformation?.name
      ? userInformation.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'US';
  }, [userInformation?.name]);

  if (isLoading || !userInformation) {
    return <IDCardSkeleton />;
  }

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isImageLoading) return;
    setIsChangeProfilePicture(true);
    fileInputRef.current?.click();
  };

  const handleBgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isImageLoading) return;
    setIsChangeProfilePicture(false);
    bgInputRef.current?.click();
  };

  const executeChangePicture = async (file?: File, isProfilePicture = true) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      uploadToSupabase({
        file,
        uploadType: isProfilePicture
          ? ENUM_PRESIGNED_UPLOAD_TYPE.PROFILE_PICTURE
          : ENUM_PRESIGNED_UPLOAD_TYPE.COVER_PICTURE,
        userUuid: userInformation.uuid,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    executeChangePicture(file);
    e.target.value = '';
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    executeChangePicture(file, false);
    e.target.value = '';
  };

  // --- EMBOSSED SILVER TEXT STYLE (VISA CHROME STYLE) ---
  const visaTextStyle = {
    // Complex gradient for metallic shine effect (White -> Gray -> Black -> Gray -> White)
    backgroundImage:
      'linear-gradient(180deg, #ffffff 0%, #e0e0e0 40%, #707070 50%, #c0c0c0 60%, #ffffff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    // Drop shadow for 3D embossed effect
    filter: 'drop-shadow(1px 2px 1px rgba(0,0,0,0.8))',
  };

  return (
    <div
      className={cn(
        'group/card hover:shadow-primary/20 relative w-full overflow-hidden rounded-2xl shadow-2xl transition-all',
        'aspect-[1.586/1]' // Standard credit card aspect ratio
      )}
      style={{
        background: userInformation.coverPicture
          ? `url(${userInformation.coverPicture}) center/cover`
          : 'linear-gradient(135deg, #0f172a 0%, #000000 100%)', // Dark background to highlight silver text
      }}
    >
      {/* Inputs hidden */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileChange}
        className='hidden'
      />
      <input
        ref={bgInputRef}
        type='file'
        accept='image/*'
        onChange={handleBgChange}
        className='hidden'
      />

      {/* Overlays */}
      <div className='pointer-events-none absolute inset-0 bg-black/10' />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20' />

      {/* Texture noise */}
      <div className='pointer-events-none absolute inset-0 bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-[0.05] mix-blend-overlay' />

      {/* Loading Overlay */}
      {isImageLoading && !isChangeProfilePicture && (
        <div className='absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
          <Loader2 className='h-8 w-8 animate-spin text-white' />
        </div>
      )}

      {/* CARD CONTENT */}
      <div className='relative z-10 flex h-full flex-col justify-between p-6 sm:p-7'>
        {/* TOP ROW: Logo & Edit Button */}
        <div className='flex items-start justify-between'>
          <div className='text-left'>
            <h2
              className='font-mono text-xl font-black tracking-wider uppercase italic'
              style={visaTextStyle} // Apply silver style to logo
            >
              ARK.CARD
            </h2>
          </div>

          <button
            onClick={handleBgClick}
            className='flex cursor-pointer items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 opacity-0 backdrop-blur-md transition-all group-hover/card:opacity-100 hover:bg-black/50'
          >
            <Camera className='h-3.5 w-3.5 text-white' />
            <span className='text-[10px] font-medium text-white'>Edit Cover</span>
          </button>
        </div>

        {/* BOTTOM ROW: Avatar & Info */}
        <div className='flex items-end gap-5 sm:gap-6'>
          {/* Avatar Area */}
          <div
            className='group/avatar relative h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-full border-[3px] border-white/20 shadow-2xl transition-transform hover:scale-105'
            onClick={handleAvatarClick}
          >
            {isImageLoading && isChangeProfilePicture ? (
              <div className='flex h-full w-full items-center justify-center bg-black/50'>
                <Loader2 className='h-6 w-6 animate-spin text-white' />
              </div>
            ) : userInformation.profilePicture ? (
              <img
                src={userInformation.profilePicture}
                alt={userInformation.name}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-xl font-black text-white'>
                {initials}
              </div>
            )}

            <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100'>
              <Camera className='h-6 w-6 text-white' />
            </div>
          </div>

          {/* User Details */}
          <div className='flex min-w-0 flex-1 flex-col justify-end space-y-2 pb-1'>
            {/* 1. NAME - Chrome Embossed Style */}
            <div className='flex items-center'>
              <EditableField
                fieldName='name'
                value={userInformation.name}
                onSave={async (val) => await updateName(val)}
                // Use mono font to resemble card number font
                className='truncate font-mono text-2xl leading-tight font-black tracking-[0.1em] uppercase sm:text-3xl'
                textStyle={visaTextStyle}
                inputClassName='font-mono font-black text-xl sm:text-2xl h-8 uppercase tracking-widest text-black bg-white/90'
              />
            </div>

            <div className='flex flex-wrap items-center gap-x-2 text-xs sm:text-sm'>
              <div className='flex flex-wrap items-center gap-x-2'>
                <EditableField
                  fieldName='job title'
                  value={currentJob?.jobTitle || 'MEMBER'}
                  onSave={async (val) => await updateJobTitle(val)}
                  className='font-mono font-bold tracking-widest uppercase'
                  textStyle={visaTextStyle}
                  inputClassName='h-6 text-xs uppercase font-bold tracking-widest text-black bg-white/90 font-mono'
                />
                {currentJob?.companyName && (
                  <>
                    <span style={visaTextStyle}>/</span>
                    <EditableField
                      fieldName='company'
                      value={currentJob?.companyName || ''}
                      onSave={async (val) => await updateCompanyName(val)}
                      className='font-mono font-bold tracking-widest uppercase'
                      textStyle={visaTextStyle}
                      inputClassName='h-6 text-xs uppercase font-bold tracking-widest text-black bg-white/90 font-mono'
                    />
                  </>
                )}
              </div>
            </div>

            {/* 3. Email */}
            <p className='truncate font-mono text-[10px] tracking-wide text-white/50'>
              {userInformation.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SKELETON ---
const IDCardSkeleton = () => {
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
