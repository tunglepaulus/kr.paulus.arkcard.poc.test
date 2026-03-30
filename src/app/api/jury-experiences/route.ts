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
 * GET /api/jury-experiences
 * List all jury experiences for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    const { data, error } = await supabase
      .from('jury_experience')
      .select('*')
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // Map snake_case DB columns to camelCase for the client
    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      eventName: item.event_name,
      role: item.role,
      years: item.years || [],
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error in GET jury-experiences:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * POST /api/jury-experiences
 * Create a single jury experience for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfileId = await getUserProfileId(supabase);

    const { eventName, role, years } = await request.json();

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('jury_experience')
      .insert({
        user_id: userProfileId,
        event_name: eventName,
        role,
        years,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        eventName: data.event_name,
        role: data.role,
        years: data.years || [],
      },
    });
  } catch (error) {
    console.error('Error in POST jury-experiences:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message === 'User not authenticated' ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

