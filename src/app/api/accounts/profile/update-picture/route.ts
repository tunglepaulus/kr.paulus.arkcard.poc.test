import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/accounts/profile/update-picture
 * Updates profile_picture or cover_picture URL in user_profile table.
 * Body: { uploadType: 'PROFILE_PICTURE' | 'COVER_PICTURE', pictureUrl: string }
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
    const { uploadType, pictureUrl } = body;

    if (!pictureUrl || typeof pictureUrl !== 'string') {
      return NextResponse.json(
        { success: false, message: 'pictureUrl is required' },
        { status: 400 }
      );
    }

    if (uploadType !== 'PROFILE_PICTURE' && uploadType !== 'COVER_PICTURE') {
      return NextResponse.json({ success: false, message: 'Invalid uploadType' }, { status: 400 });
    }

    const columnName = uploadType === 'PROFILE_PICTURE' ? 'profile_picture' : 'cover_picture';
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('user_profile')
      .update({ [columnName]: pictureUrl, updated_at: now })
      .eq('uuid', user.id);

    if (updateError) {
      console.error('Error updating picture:', updateError);
      return NextResponse.json(
        { success: false, message: updateError.message || 'Failed to update picture' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Picture updated successfully',
      data: pictureUrl,
      error: null,
    });
  } catch (error) {
    console.error('Error in POST /api/accounts/profile/update-picture:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
