import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/signup
 * Register a new user:
 *   1. Creates auth user in Supabase Auth.
 *   2. SELECT → INSERT or UPDATE user_profile (handles duplicate UUID from partial signups).
 *   3. Inserts companies into user_company (direct INSERT).
 * Requires schema: created_at/updated_at nullable on both tables.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, companies } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: email, password, name' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          companies: companies || [],
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message || 'Registration failed. Please try again.' },
        { status: 400 }
      );
    }

    const authUid = data.user?.id;
    if (!authUid) {
      return NextResponse.json(
        { success: false, message: 'User created but ID not returned.' },
        { status: 500 }
      );
    }

    // 2. Check if user_profile already exists (from partial previous signup), then INSERT or UPDATE
    const { data: existingProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', authUid)
      .single();

    let profileError: unknown = null;

    if (existingProfile) {
      // UUID exists → UPDATE (handles duplicate UUID from partial previous signups)
      const result = await supabase
        .from('user_profile')
        .update({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('uuid', authUid);
      profileError = result.error;
    } else {
      // New user → INSERT
      const result = await supabase.from('user_profile').insert({
        uuid: authUid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        active: true,
      });
      profileError = result.error;
    }

    if (profileError) {
      console.error('[signup] user_profile save error:', profileError);
      return NextResponse.json(
        {
          success: false,
          message:
            'User created but profile save failed: ' +
            (profileError as { message?: string }).message,
        },
        { status: 500 }
      );
    }

    // 3. Get the numeric profile id
    const { data: profile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('uuid', authUid)
      .single();

    // 4. Insert companies directly
    const companyErrors = [];
    if (companies && companies.length > 0 && profile) {
      for (const c of companies) {
        const { error: companyError } = await supabase.from('user_company').insert({
          user_id: profile.id,
          company_name: c.companyName?.trim() || '',
          job_title: c.jobTitle?.trim() || '',
          is_current_company: c.isCurrentCompany ?? true,
        });

        if (companyError) {
          console.error('[signup] user_company insert error:', companyError);
          companyErrors.push({ company: c.companyName, error: companyError.message });
        }
      }
    }

    const response: Record<string, unknown> = { success: true, data };
    if (companyErrors.length > 0) {
      response.companyErrors = companyErrors;
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in signup API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
