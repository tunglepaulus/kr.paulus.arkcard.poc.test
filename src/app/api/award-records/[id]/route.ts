import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Resolve the internal user_profile.id (bigint) from the
 * Supabase Auth UUID stored in the session.
 */
async function getUserProfileId(supabase: any): Promise<number> {
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

  return data.id;
}

/**
 * PUT /api/award-records/[id]
 * Update a single award record by its ID.
 * Only the record owner can update it.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);
    const { organization, years, awardType, category } = await request.json();

    // IDOR check: verify record belongs to this user before updating
    const { data: existing } = await supabase
      .from('award_records')
      .select('id')
      .eq('id', Number(id))
      .eq('user_id', userProfileId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Record not found or access denied' },
        { status: 404 }
      );
    }

    // year column is int4[] — pass array directly to Supabase
    const yearValue = Array.isArray(years) && years.length > 0 ? years : [];

    const { data, error } = await supabase
      .from('award_records')
      .update({
        organization,
        year: yearValue,
        award_type: awardType || '',
        category: category || '',
      })
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        organization: data.organization,
        years: Array.isArray(data.year) ? data.year : [],
        awardType: data.award_type || '',
        category: data.category || '',
      },
    });
  } catch (error) {
    console.error('Error in PUT award-records/[id]:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * DELETE /api/award-records/[id]
 * Remove a single award record by its ID.
 * Only the record owner can delete it.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    // IDOR check: verify record belongs to this user before deleting
    const { data: existing } = await supabase
      .from('award_records')
      .select('id')
      .eq('id', Number(id))
      .eq('user_id', userProfileId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Record not found or access denied' },
        { status: 404 }
      );
    }

    const { error } = await supabase.from('award_records').delete().eq('id', Number(id));

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE award-records/[id]:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
