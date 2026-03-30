import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout
 * Sign out the current user and clear all cookies.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase (clears session cookies server-side)
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
