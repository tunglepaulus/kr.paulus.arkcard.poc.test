import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile
 * Fetch the authenticated user's profile.
 * Reads from user_profile + user_company tables (primary source).
 * Falls back to auth user_metadata only if user_profile doesn't exist.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Support Authorization header (for client-side fetches that can't set cookies)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Override the session so getUser() uses this token instead of cookies
      supabase.auth.setSession({ access_token: token, refresh_token: '' });
    }

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

    // Read profile from user_profile table
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('id, uuid, name, email, cover_picture, profile_picture, has_jury_experience')
      .eq('uuid', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (profile) {
      // Read companies from user_company via join on profile id
      const { data: companies } = await supabase
        .from('user_company')
        .select('id, company_name, job_title, is_current_company')
        .eq('user_id', profile.id)
        .order('is_current_company', { ascending: false });

      return NextResponse.json({
        success: true,
        data: {
          id: profile.id,
          uuid: profile.uuid,
          name: profile.name,
          email: profile.email,
          role: 'user',
          coverPicture: profile.cover_picture,
          profilePicture: profile.profile_picture,
          hasJuryExperience: profile.has_jury_experience ?? false,
          companies: (companies || []).map((c: any) => ({
            id: c.id,
            companyName: c.company_name,
            jobTitle: c.job_title,
            isCurrentCompany: c.is_current_company,
          })),
        },
      });
    }

    // Fallback: user_profile doesn't exist yet → read from auth metadata
    const meta = user.user_metadata || {};
    const rawCompanies: any[] = meta.companies || [];

    return NextResponse.json({
      success: true,
      data: {
        id: 0,
        uuid: user.id,
        name: meta.name || '',
        email: user.email || '',
        role: user.role || 'user',
        coverPicture: null,
        profilePicture: null,
        hasJuryExperience: false,
        companies: rawCompanies.map((c: any, index: number) => ({
          id: c.id ?? index,
          companyName: c.companyName || c.company_name || '',
          jobTitle: c.jobTitle || c.job_title || '',
          isCurrentCompany: c.isCurrentCompany ?? c.is_current_company ?? true,
        })),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
