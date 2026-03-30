import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/connections/check/[uuid]
 * Check if the current user is connected with the user identified by UUID.
 * Requires authentication.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid: connectedUuid } = await params;

    if (!connectedUuid) {
      return NextResponse.json({ success: false, message: 'UUID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        data: { isConnected: false, isLoggedIn: false },
      });
    }

    // Get current user's profile id
    const { data: currentProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', user.id)
      .single();

    if (!currentProfile) {
      return NextResponse.json({
        success: true,
        data: { isConnected: false, isLoggedIn: false },
      });
    }

    // Get target user's profile id
    const { data: targetProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', connectedUuid)
      .single();

    if (!targetProfile) {
      return NextResponse.json({
        success: true,
        data: { isConnected: false, isLoggedIn: true },
      });
    }

    // Check if connection exists
    const { data: connection } = await supabase
      .from('connections')
      .select('id')
      .eq('user_id', currentProfile.id)
      .eq('connected_user_id', targetProfile.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        isConnected: !!connection,
        isLoggedIn: true,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/connections/check/[uuid]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
