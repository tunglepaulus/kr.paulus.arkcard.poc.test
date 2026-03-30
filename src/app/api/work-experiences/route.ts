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
 * GET /api/work-experiences
 * List all work experiences for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    const { data, error } = await supabase
      .from('working_experience')
      .select('*')
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      companyName: item.company_name,
      title: item.title,
      startDate: item.start_date,
      endDate: item.end_date || null,
      description: item.description || '',
      isCurrent: item.is_current || false,
      isVisible: item.is_visible || false,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error in GET work-experiences:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * POST /api/work-experiences
 * Create a single work experience for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    const { companyName, title, startDate, endDate, description, isCurrent } = await request.json();

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('working_experience')
      .insert({
        user_id: userProfileId,
        company_name: companyName,
        title,
        start_date: startDate,
        end_date: endDate || null,
        description: description || '',
        is_current: isCurrent || false,
        is_visible: true,
        created_at: now,
        updated_at: now,
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
        companyName: data.company_name,
        title: data.title,
        startDate: data.start_date,
        endDate: data.end_date || null,
        description: data.description || '',
        isCurrent: data.is_current || false,
        isVisible: data.is_visible || false,
      },
    });
  } catch (error) {
    console.error('Error in POST work-experiences:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
