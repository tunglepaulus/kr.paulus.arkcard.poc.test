import { NextResponse } from 'next/server';

import { PAGE_ROUTES } from './constants';

import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userCookie = request.cookies.get('user-storage')?.value;

  let isLoggedIn = false;
  let hasJuryExperience = false;

  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie);
      isLoggedIn = !!parsed.state?.accessToken && parsed.state?.isLoggedIn;
      hasJuryExperience = !!parsed.state?.hasJuryExperience;
    } catch (e) {
      isLoggedIn = false;
      hasJuryExperience = false;
    }
  }

  const isPublicRoute =
    Object.values(PAGE_ROUTES.PUBLIC).some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) || /^\/user\/[a-zA-Z0-9-]+$/.test(pathname);

  if (!isLoggedIn && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && (pathname === '/' || pathname === '/onboarding')) {
    // If user hasn't selected juries yet, keep them on onboarding
    if (!hasJuryExperience && pathname === '/onboarding') {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If logged in but no jury experience, redirect to onboarding from any protected route.
  // NOTE: /onboarding is in PUBLIC_ROUTES so isPublicRoute is true for it,
  // but we also explicitly check `pathname !== '/onboarding'` as a safety net
  // to prevent redirect loops if /onboarding is ever removed from PUBLIC_ROUTES.
  if (isLoggedIn && !hasJuryExperience && !isPublicRoute && pathname !== '/onboarding') {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (svg, png, jpg...)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
