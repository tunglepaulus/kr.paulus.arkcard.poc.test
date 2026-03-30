'use client';

import { useRouter as useNextRouter } from 'next/navigation';
import nProgress from 'nprogress';
import { useTransition } from 'react';

export function useAppRouter() {
  const router = useNextRouter();
  const [isPending, startTransition] = useTransition();

  const push = (href: string, options?: any) => {
    nProgress.start(); // Start the bar manually
    startTransition(() => {
      router.push(href, options);
    });
  };

  const replace = (href: string, options?: any) => {
    nProgress.start();
    startTransition(() => {
      router.replace(href, options);
    });
  };

  return { ...router, push, replace, isPending };
}
