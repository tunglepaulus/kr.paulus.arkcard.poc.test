import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/login
 * Sign in with email and password.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Detect unverified email — Supabase returns "Email not confirmed"
      const isEmailNotConfirmed =
        error.message?.toLowerCase().includes('email not confirmed') ||
        error.message?.toLowerCase().includes('email_not_confirmed');

      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Login failed. Please check your email and password.',
          code: isEmailNotConfirmed ? 'EMAIL_NOT_CONFIRMED' : 'LOGIN_FAILED',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


