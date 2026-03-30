import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/work-experiences/[id]
 * Update a single work experience by its ID.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { companyName, title, startDate, endDate, description, isCurrent } = await request.json();

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('working_experience')
      .update({
        company_name: companyName,
        title,
        start_date: startDate,
        end_date: endDate || null,
        description: description || '',
        is_current: isCurrent || false,
        is_visible: true,
        updated_at: now,
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
    console.error('Error in PUT work-experiences/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/work-experiences/[id]
 * Remove a single work experience by its ID.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from('working_experience').delete().eq('id', Number(id));

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE work-experiences/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
