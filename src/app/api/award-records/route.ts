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
 * GET /api/award-records
 * List all award records for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    const { data, error } = await supabase
      .from('award_records')
      .select('*')
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // year column is int4[] — Supabase returns it as an array of numbers
    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      organization: item.organization,
      years: Array.isArray(item.year) ? item.year : [],
      awardType: item.award_type || '',
      category: item.category || '',
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error in GET award-records:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * POST /api/award-records
 * Create a single award record for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    const { organization, years, awardType, category } = await request.json();

    // year column is int4[] — pass array directly to Supabase
    const yearValue = Array.isArray(years) && years.length > 0 ? years : [];

    const { data, error } = await supabase
      .from('award_records')
      .insert({
        user_id: userProfileId,
        organization,
        year: yearValue,
        award_type: awardType || '',
        category: category || '',
        created_at: new Date().toISOString(),
      })
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
    console.error('Error in POST award-records:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
