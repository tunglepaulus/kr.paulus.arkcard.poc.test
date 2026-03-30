import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { API_ROUTE_TYPE, ENUM_PRESIGNED_UPLOAD_KEY, ENUM_PRESIGNED_UPLOAD_TYPE } from '@/constants';
import { getFiles } from '@/lib/utils';
import { IDataResponse } from '@/types';

type PresignedUploadRequestType = {
  uploadType: ENUM_PRESIGNED_UPLOAD_TYPE;
  uploadKeyId: ENUM_PRESIGNED_UPLOAD_KEY;
  uploadKeyValue: string;
};

export const usePresignedUpload = ({
  url,
  onSuccess,
  onError,
}: {
  url: API_ROUTE_TYPE;
  onSuccess?: (successUrl: string) => void;
  onError?: (error: any) => void;
}) => {
  // Track loading state for UI feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetProgressRef = useRef<number>(0); // for smoothing

  const smoothProgressUpdate = (): Promise<void> => {
    return new Promise((resolve) => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev === null) return 0;

          if (prev >= 100) {
            clearInterval(intervalRef.current!);
            resolve(); // ✅ only resolve when fully at 100
            return 100;
          }

          return prev + 1;
        });
      }, 20); // adjust to control speed
    });
  };

  /**
   * Handles the complete file upload process
   * 1. Gets file from user input
   * 2. Generates presigned URL
   * 3. Uploads file to storage
   * 4. Returns permanent URL
   */
  const handlePresignedUpload = async ({
    params,
    accept,
    initialFile,
  }: {
    params: PresignedUploadRequestType;
    initialFile?: File;
    accept?: string;
  }) => {
    const file = initialFile || (await getFiles(accept));
    if (file) {
      setIsLoading(true);
      setProgress(0);
      try {
        // Prepare query parameters for presigned URL request
        const searchParams = new URLSearchParams();
        searchParams.set('uploadType', params.uploadType);
        searchParams.set(params.uploadKeyId, params.uploadKeyValue);
        searchParams.set('fileName', file.name);

        // Request presigned URL from API
        const presignedResponse = await fetch(`${url}?${searchParams.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const presignedJson: IDataResponse<string> = await presignedResponse.json();

        if (presignedJson.data) {
          const presignedUrl = presignedJson.data;
          const payload = await file.arrayBuffer();

          // Upload file directly to storage using presigned URL (with XHR for progress)
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.timeout = 10 * 60 * 1000; // 10 minutes
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentCompleted = Math.min(Math.round((event.loaded / event.total) * 100), 100);
                targetProgressRef.current = percentCompleted;
                setProgress(percentCompleted);
              }
            };
            xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
            xhr.onerror = () => reject(new Error('Upload network error'));
            xhr.ontimeout = () => reject(new Error('Upload timed out'));
            xhr.send(payload);
          });

          // ✅ Smooth the final part to 100% if it's not already
          if (progress !== 100) {
            await smoothProgressUpdate();
          }
          // Extract permanent URL from presigned URL
          const parsedUrl = new URL(presignedUrl);
          const originUrl = parsedUrl.origin + parsedUrl.pathname;

          onSuccess?.(originUrl);

          return originUrl;
        }
      } catch (error) {
        onError?.(error);
        toast.error('Failed to upload file. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    mutate: handlePresignedUpload,
    isPending: isLoading,
    progress,
  };
};


