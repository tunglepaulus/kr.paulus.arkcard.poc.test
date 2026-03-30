import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/accounts/update-current-job-title
 * Updates the job title of the user's current company.
 * Uses direct INSERT/UPDATE after schema is fixed (created_at/updated_at nullable).
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const { jobTitle } = body;

    if (jobTitle === undefined || typeof jobTitle !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Job title is required' },
        { status: 400 }
      );
    }

    const trimmedJobTitle = jobTitle.trim();

    // Find the user's profile id
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Find the current company
    const { data: currentCompany } = await supabase
      .from('user_company')
      .select('id')
      .eq('user_id', profile.id)
      .eq('is_current_company', true)
      .single();

    if (currentCompany) {
      // UPDATE existing company
      const { error: updateError } = await supabase
        .from('user_company')
        .update({ job_title: trimmedJobTitle })
        .eq('id', currentCompany.id);

      if (updateError) {
        console.error('Error updating job title:', updateError);
        return NextResponse.json(
          { success: false, message: updateError.message || 'Failed to update job title' },
          { status: 500 }
        );
      }
    } else {
      // INSERT new company
      const { error: insertError } = await supabase.from('user_company').insert({
        user_id: profile.id,
        job_title: trimmedJobTitle,
        is_current_company: true,
      });

      if (insertError) {
        console.error('Error inserting company:', insertError);
        return NextResponse.json(
          { success: false, message: insertError.message || 'Failed to update job title' },
          { status: 500 }
        );
      }
    }

    // Sync companies to auth user_metadata (keeps GET fallback in sync)
    await syncCompaniesToMetadata(supabase, user.id);

    return NextResponse.json({
      success: true,
      message: 'Job title updated successfully',
      data: null,
      error: null,
    });
  } catch (error) {
    console.error('Error in PUT /api/accounts/update-current-job-title:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

async function syncCompaniesToMetadata(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from('user_profile')
    .select('id')
    .eq('uuid', userId)
    .single();

  if (!profile) return;

  const { data: companies } = await supabase
    .from('user_company')
    .select('company_name, job_title, is_current_company')
    .eq('user_id', profile.id)
    .order('is_current_company', { ascending: false });

  if (!companies || companies.length === 0) return;

  const meta = (await supabase.auth.getUser()).data.user?.user_metadata || {};
  await supabase.auth.updateUser({
    data: { ...meta, companies },
  });
}
