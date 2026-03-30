import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/connections/[uuid]
 * Create a connection with the user identified by UUID.
 * Requires authentication.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid: connectedUuid } = await params;

    if (!connectedUuid) {
      return NextResponse.json({ success: false, message: 'UUID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('id, name')
      .eq('uuid', user.id)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get target user's profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('user_profile')
      .select('id, name, profile_picture, email')
      .eq('uuid', connectedUuid)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { success: false, message: 'Target user not found' },
        { status: 404 }
      );
    }

    // Prevent self-connect
    if (currentProfile.id === targetProfile.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot connect with yourself' },
        { status: 400 }
      );
    }

    // Get target user's current job for denormalization
    const { data: currentJob } = await supabase
      .from('user_company')
      .select('company_name, job_title')
      .eq('user_id', targetProfile.id)
      .eq('is_current_company', true)
      .single();

    // Insert connection
    const { error: insertError } = await supabase.from('connections').insert({
      user_id: currentProfile.id,
      connected_user_id: targetProfile.id,
      connected_name: targetProfile.name,
      connected_company: currentJob?.company_name || null,
      connected_job_title: currentJob?.job_title || null,
      connected_avatar: targetProfile.profile_picture || null,
      connected_email: targetProfile.email || null,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, message: 'Already connected' }, { status: 409 });
      }
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Connected successfully' });
  } catch (error) {
    console.error('Error in POST /api/connections/[uuid]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/connections/[uuid]
 * Remove a connection with the user identified by UUID.
 * Requires authentication.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid: connectedUuid } = await params;

    if (!connectedUuid) {
      return NextResponse.json({ success: false, message: 'UUID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile id
    const { data: currentProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', user.id)
      .single();

    if (!currentProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get target user's profile id
    const { data: targetProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', connectedUuid)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, message: 'Target user not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', currentProfile.id)
      .eq('connected_user_id', targetProfile.id);

    if (deleteError) {
      return NextResponse.json({ success: false, message: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Connection removed' });
  } catch (error) {
    console.error('Error in DELETE /api/connections/[uuid]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
