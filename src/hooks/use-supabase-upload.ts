import { useState } from 'react';
import { toast } from 'sonner';

import { ENUM_PRESIGNED_UPLOAD_TYPE } from '@/constants';
import { createClient } from '@/lib/supabase/client';

const AVATARS_BUCKET = 'avatars';

/**
 * Hook for uploading files directly to Supabase Storage
 * using the authenticated browser session.
 */
export const useSupabaseUpload = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async ({
    file,
    uploadType,
    userUuid,
  }: {
    file: File;
    uploadType: ENUM_PRESIGNED_UPLOAD_TYPE;
    userUuid: string;
  }) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const supabase = createClient();

      // Build storage path: avatars/{userUuid}/{type}/{timestamp}-{filename}
      const typeFolder =
        uploadType === ENUM_PRESIGNED_UPLOAD_TYPE.PROFILE_PICTURE ? 'profile' : 'cover';
      const ext = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const filePath = `${userUuid}/${typeFolder}/${timestamp}.${ext}`;

      // Upload to Supabase Storage using the authenticated session
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, file, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      setProgress(100);

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      onSuccess?.(publicUrl);
      return publicUrl;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      onError?.(err);
      toast.error(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upload,
    isLoading,
    progress,
  };
};
