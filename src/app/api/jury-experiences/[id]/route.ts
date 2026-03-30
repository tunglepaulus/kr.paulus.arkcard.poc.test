import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/jury-experiences/[id]
 * Update a single jury experience by its ID.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { eventName, role, years } = await request.json();

    const { data, error } = await supabase
      .from('jury_experience')
      .update({
        event_name: eventName,
        role,
        years,
      })
      .eq('id', Number(id))
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
    console.error('Error in PUT jury-experiences/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jury-experiences/[id]
 * Remove a single jury experience by its ID.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('jury_experience')
      .delete()
      .eq('id', Number(id));

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE jury-experiences/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

