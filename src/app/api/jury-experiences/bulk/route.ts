import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Resolve the internal user_profile.id (bigint) and the Supabase Auth UUID
 * from the session.
 */
async function getUserProfile(supabase: any): Promise<{ id: number; uuid: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profile')
    .select('id')
    .eq('uuid', user.id)
    .single();

  if (error || !data) throw new Error('User profile not found');

  return { id: data.id, uuid: user.id };
}

/**
 * PUT /api/jury-experiences/bulk
 * Replace all jury experiences for the authenticated user.
 * Deletes existing records first, then inserts the new set.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile(supabase);
    const userProfileId = userProfile.id;

    const { experiences } = await request.json();

    if (!Array.isArray(experiences)) {
      return NextResponse.json(
        { success: false, message: 'experiences must be an array' },
        { status: 400 }
      );
    }

    // Remove all existing records before inserting the replacement set
    await supabase.from('jury_experience').delete().eq('user_id', userProfileId);

    if (experiences.length > 0) {
      const now = new Date().toISOString();
      const insertData = experiences.map((item: any) => ({
        user_id: userProfileId,
        event_name: item.eventName,
        role: item.role,
        years: item.years,
        created_at: now,
        updated_at: now,
      }));

      const { error } = await supabase.from('jury_experience').insert(insertData);

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }

      // Mark user as having jury experience in their profile
      const { error: updateErr } = await supabase
        .from('user_profile')
        .update({ has_jury_experience: true })
        .eq('uuid', userProfile.uuid);
      if (updateErr) console.error('Failed to update has_jury_experience:', updateErr);
    }

    return NextResponse.json({ success: true, data: experiences });
  } catch (error) {
    console.error('Error in PUT jury-experiences/bulk:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
