import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/login-magic-link
 * Sends a magic link (passwordless login) to the user's email via Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const supabase = await createClient();

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to send magic link' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Please check your email.',
    });
  } catch (error) {
    console.error('Error in login-magic-link API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
