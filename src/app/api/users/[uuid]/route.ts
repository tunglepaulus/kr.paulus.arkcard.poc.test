import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/users/[uuid]
 * Fetch any user's public profile by UUID.
 * Publicly accessible — no auth required.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json({ success: false, message: 'UUID is required' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }
    const supabase = createServiceClient();

    // Read profile from user_profile table
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('id, uuid, name, email, cover_picture, profile_picture, has_jury_experience')
      .eq('uuid', uuid)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

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
  } catch (error) {
    console.error('Error in GET /api/users/[uuid]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
