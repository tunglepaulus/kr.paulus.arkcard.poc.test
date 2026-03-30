import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function groupBy<T>(array: T[], predicate: (value: T, index: number, array: T[]) => string) {
  return array.reduce(
    (acc, value, index, array) => {
      (acc[predicate(value, index, array)] ||= []).push(value);
      return acc;
    },
    {} as { [key: string]: T[] }
  );
}

export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function removeDuplicatesByKey<T>(arr: T[], path: string): T[] {
  const seen = new Set<unknown>();
  return arr.filter((item) => {
    const value = getNestedValue(item, path);
    if (!seen.has(value)) {
      seen.add(value);
      return true;
    }
    return false;
  });
}

/**
 * Select file(s).
 * @param {String} acceptType The content type of files you wish to select. For instance, use "image/*" to select all types of images.
 * @param {Boolean} multiple Indicates if the user can select multiple files.
 * @returns {Promise<File|File[]>} A promise of a file or array of files in case the multiple parameter is true.
 */
function getFiles(acceptType?: string, multiple?: false): Promise<File>;
function getFiles(acceptType?: string, multiple?: true): Promise<File[]>;
function getFiles(acceptType?: string, multiple?: boolean): Promise<File | File[]> {
  return new Promise((resolve) => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.multiple = multiple || false;
    input.accept = acceptType || 'image/*';

    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (multiple) resolve(files);
      else resolve(files[0]);
    };

    input.click();
  });
}

export { getFiles };

export function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

export function generateThumbnailFileFromVideo(
  file: File,
  callback: (thumbnailFile: File) => void
): void {
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;

  const fileURL = URL.createObjectURL(file);
  video.src = fileURL;

  video.addEventListener('loadeddata', () => {
    video.currentTime = 0;
  });

  video.addEventListener('seeked', () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas 2D context');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob: Blob | null) => {
      if (!blob) {
        console.error('Failed to create blob from canvas.');
        return;
      }

      // Generate thumbnail name based on original file name
      const baseName = file.name.replace(/\.[^/.]+$/, ''); // remove extension
      const thumbnailName = `${baseName}.jpg`;

      const thumbnailFile = new File([blob], thumbnailName, {
        type: 'image/jpeg',
      });
      callback(thumbnailFile);

      URL.revokeObjectURL(fileURL);
    }, 'image/jpeg');
  });
}

export function sleep(ms: number = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function findFirstStringInNestedObject(data: any): string | undefined {
  function search(obj: any): string | undefined {
    if (typeof obj === 'string') {
      // Strings in arrays or top-level (no key), return as-is
      return obj;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = search(item);
        if (result !== undefined) return result;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (typeof value === 'string') {
            return `${key}: ${value}`;
          }

          const result = search(value);
          if (result !== undefined) return result;
        }
      }
    }

    return undefined;
  }

  return search(data);
}
