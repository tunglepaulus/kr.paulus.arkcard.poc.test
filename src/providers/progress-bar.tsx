'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import nProgress from 'nprogress';
import { useEffect, Suspense } from 'react';

// Configure NProgress (v4 / Ark.works theme)
nProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
});

function ProgressBarHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When the URL changes, navigation is considered complete
    nProgress.done();
  }, [pathname, searchParams]);

  return null;
}

export default function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarHandler />
    </Suspense>
  );
}
