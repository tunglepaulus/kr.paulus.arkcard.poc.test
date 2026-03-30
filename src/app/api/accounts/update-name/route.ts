import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/accounts/update-name
 * Updates the authenticated user's name in BOTH:
 *   1. user_profile table (primary source)
 *   2. Supabase Auth user_metadata (keeps fallback in sync)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const now = new Date().toISOString();

    // 1. Update user_profile table (primary source for GET)
    const { data: existingProfile, error: selectError } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: profileError } = await supabase
        .from('user_profile')
        .update({ name: trimmedName, updated_at: now })
        .eq('uuid', user.id);

      if (profileError) {
        console.error('Error updating user_profile:', profileError);
        return NextResponse.json(
          { success: false, message: profileError.message || 'Failed to update name' },
          { status: 500 }
        );
      }
    } else {
      // Create profile if it doesn't exist yet
      const { error: insertError } = await supabase.from('user_profile').insert({
        uuid: user.id,
        name: trimmedName,
        email: user.email || '',
        role: 'user',
        created_at: now,
        updated_at: now,
      });

      if (insertError) {
        console.error('Error creating user_profile:', insertError);
        return NextResponse.json(
          { success: false, message: insertError.message || 'Failed to update name' },
          { status: 500 }
        );
      }
    }

    // 2. Also update Supabase Auth user_metadata (keeps GET fallback in sync)
    const meta = user.user_metadata || {};
    const { error: metaError } = await supabase.auth.updateUser({
      data: { ...meta, name: trimmedName },
    });

    if (metaError) {
      console.error('Warning: failed to update user_metadata:', metaError);
      // Don't fail the whole request — user_profile is the source of truth
    }

    return NextResponse.json({
      success: true,
      message: 'Name updated successfully',
      data: null,
      error: null,
    });
  } catch (error) {
    console.error('Error in PUT /api/accounts/update-name:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
