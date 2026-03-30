import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cards/connected-users
 * Fetch all connections for the authenticated user.
 * Returns paginated list with denormalized data from connections table.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', user.id)
      .single();

    if (!currentProfile) {
      return NextResponse.json({
        success: true,
        data: {
          content: [],
          last: true,
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 0,
          first: true,
          numberOfElements: 0,
        },
      });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Fetch connections
    const from = page * size;
    const to = from + size - 1;

    const sortColumn = 'created_at';

    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, connected_user_id, connected_email, created_at')
      .eq('user_id', currentProfile.id)
      .order(sortColumn, { ascending: sortDirection === 'asc' })
      .range(from, to);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Fetch profile data for all connected users — always fresh, no denormalization needed
    const connectedUserIds = (connections || []).map((c) => c.connected_user_id).filter(Boolean);
    const { data: profiles } = connectedUserIds.length
      ? await supabase
          .from('user_profile')
          .select('id, uuid, name, profile_picture')
          .in('id', connectedUserIds)
      : { data: [] };

    // Fetch current company/job for connected users
    const { data: companies } = connectedUserIds.length
      ? await supabase
          .from('user_company')
          .select('user_id, company_name, job_title, is_current_company')
          .in('user_id', connectedUserIds)
          .order('is_current_company', { ascending: false })
      : { data: [] };

    const companyMap: Record<number, { companyName: string; jobTitle: string }> = {};
    (companies || []).forEach((c) => {
      if (!companyMap[c.user_id]) {
        companyMap[c.user_id] = { companyName: c.company_name, jobTitle: c.job_title };
      }
    });

    const profileMap: Record<
      number,
      { uuid: string; name: string; profilePicture: string | null }
    > = {};
    (profiles || []).forEach((p) => {
      profileMap[p.id] = { uuid: p.uuid, name: p.name, profilePicture: p.profile_picture };
    });

    // Count total
    const { count: totalElements } = await supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', currentProfile.id);

    const totalPages = Math.ceil((totalElements || 0) / size);

    const COLORS = ['navy', 'teal', 'coral', 'gold', 'camel'] as const;

    const content = (connections || []).map((c, index) => {
      const profile = profileMap[c.connected_user_id] ?? {};
      const company = companyMap[c.connected_user_id] ?? {};
      const color = COLORS[(page * size + index) % COLORS.length];
      return {
        id: String(c.id),
        name: profile.name || 'Unknown',
        jobTitle: company.jobTitle || '',
        companyName: company.companyName || '',
        avatar: profile.profilePicture || '',
        color,
        email: c.connected_email || '',
        userUuid: profile.uuid || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        content,
        last: page >= totalPages - 1,
        totalElements: totalElements || 0,
        totalPages,
        number: page,
        size,
        first: page === 0,
        numberOfElements: content.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/cards/connected-users:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
