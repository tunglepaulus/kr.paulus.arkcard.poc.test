import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/search?name=<name>&page=<page>&limit=<limit>
 * Search users by name (case-insensitive partial match).
 * Supports pagination via cursor-based offset.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('name')?.trim() ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(20, parseInt(searchParams.get('limit') ?? '10', 10));
    const offset = (page - 1) * limit;

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { users: [], total: 0, page: 1, limit, hasMore: false },
      });
    }

    const currentProfileId = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', user.id)
      .single()
      .then(({ data }) => data?.id);

    // Search by name (case-insensitive, partial match)
    // Use ilike for case-insensitive matching
    const searchPattern = `%${query}%`;

    const {
      data: users,
      count,
      error,
    } = await supabase
      .from('user_profile')
      .select('id, uuid, name, email, profile_picture, has_jury_experience', { count: 'exact' })
      .ilike('name', searchPattern)
      .neq('uuid', user.id) // Exclude self
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[GET /api/users/search] DB error:', error);
      return NextResponse.json({ success: false, message: 'Search failed' }, { status: 500 });
    }

    // Fetch companies for each user in parallel
    const userIds = (users || []).map((u) => u.id);
    const { data: allCompanies } = userIds.length
      ? await supabase
          .from('user_company')
          .select('id, company_name, job_title, is_current_company, user_id')
          .in('user_id', userIds)
          .order('is_current_company', { ascending: false })
      : { data: [] };

    const companyMap: Record<number, any[]> = {};
    (allCompanies || []).forEach((c) => {
      if (!companyMap[c.user_id]) companyMap[c.user_id] = [];
      companyMap[c.user_id].push(c);
    });

    const currentUserIds = currentProfileId ? [currentProfileId] : [];

    // Check connection status for all results
    const { data: connections } = currentProfileId
      ? await supabase
          .from('connections')
          .select('connected_user_id')
          .eq('user_id', currentProfileId)
          .in(
            'connected_user_id',
            userIds.filter((id) => id !== currentProfileId)
          )
      : { data: [] };

    const connectedSet = new Set((connections || []).map((c) => c.connected_user_id));

    const result = (users || []).map((u) => ({
      id: u.id,
      uuid: u.uuid,
      name: u.name,
      email: u.email,
      profilePicture: u.profile_picture,
      hasJuryExperience: u.has_jury_experience ?? false,
      companies: (companyMap[u.id] || []).map((c) => ({
        id: c.id,
        companyName: c.company_name,
        jobTitle: c.job_title,
        isCurrentCompany: c.is_current_company,
      })),
      isConnected: connectedSet.has(u.id),
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: result,
        total: count ?? 0,
        page,
        limit,
        hasMore: (count ?? 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/search:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
