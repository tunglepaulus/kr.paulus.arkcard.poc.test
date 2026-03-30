import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/verify-otp
 * Verify the OTP code sent to user's email during signup.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode } = await request.json();

    if (!email || !verificationCode) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: email, verificationCode' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'signup',
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in verify-otp API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

