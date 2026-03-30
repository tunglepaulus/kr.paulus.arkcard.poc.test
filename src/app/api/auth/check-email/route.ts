import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/check-email
 * Check if an email is already registered via Supabase RPC.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Call the RPC function to check email existence
    const { data: emailExists, error } = await supabase.rpc('check_email_exists', {
      check_email: email,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to verify email at this time. Please try again later.',
        },
        { status: 500 }
      );
    }

    if (emailExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This email is already registered. Please use a different email or log in.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, valid: true, message: '' });
  } catch (error) {
    console.error('Error in check-email API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

